module fusion_plus_crosschain::limit_order_protocol {
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::clock::{Self, Clock};
    use sui::event;
    use fusion_plus_crosschain::dutch_auction::{Self, DutchAuction};
    use fusion_plus_crosschain::resolver_network::{Self, ResolverNetwork};
    use sui::sui::SUI;

    // Error codes
    const E_INVALID_SOURCE_AMOUNT: u64 = 1;
    const E_INVALID_DESTINATION_AMOUNT: u64 = 2;
    const E_INVALID_AUCTION_TIMES: u64 = 3;
    const E_AUCTION_TOO_SHORT: u64 = 4;
    const E_AUCTION_TOO_LONG: u64 = 5;
    const E_INVALID_RATES: u64 = 6;
    const E_ORDER_ALREADY_EXISTS: u64 = 7;
    const E_ORDER_NOT_FOUND: u64 = 8;
    const E_ONLY_MAKER: u64 = 9;
    const E_ORDER_NOT_ACTIVE: u64 = 10;
    const E_ORDER_ALREADY_CANCELLED: u64 = 11;
    const E_ORDER_EXPIRED: u64 = 12;
    const E_UNAUTHORIZED_RESOLVER: u64 = 13;
    const E_AUCTION_NOT_STARTED: u64 = 14;
    const E_INVALID_FILL_AMOUNT: u64 = 15;
    #[allow(unused_const)]
    const E_ALREADY_FILLED: u64 = 16;

    // Constants
    const MIN_AUCTION_DURATION: u64 = 300000; // 5 minutes in milliseconds
    const MAX_AUCTION_DURATION: u64 = 86400000; // 24 hours in milliseconds
    const MIN_ORDER_AMOUNT: u64 = 1000000; // 0.001 SUI minimum (assuming 9 decimals)

    // Dutch auction configuration
    public struct DutchAuctionConfig has copy, drop, store {
        auction_start_time: u64,
        auction_end_time: u64,
        start_rate: u64,
        end_rate: u64,
        decrease_rate: u64,
    }

    // Limit order structure
    public struct LimitOrder<phantom T> has key, store {
        id: sui::object::UID,
        maker: address,
        taker: address, // address(0x0) means open to any resolver
        source_amount: u64,
        destination_amount: u64,
        deadline: u64,
        order_hash: vector<u8>,
        is_active: bool,
        auction_config: DutchAuctionConfig,
        filled_amount: u64,
        escrow_id: sui::object::ID,
        created_at: u64,
        balance: Balance<T>,
    }

    // Limit order protocol registry
    public struct LimitOrderProtocol<phantom T> has key {
        id: sui::object::UID,
        orders: sui::table::Table<vector<u8>, sui::object::ID>, // order_hash -> LimitOrder ID
        cancelled_orders: sui::table::Table<vector<u8>, bool>,
        nonces: sui::table::Table<address, u64>,
    }

    // Events
    public struct OrderCreated has copy, drop {
        order_hash: vector<u8>,
        maker: address,
        source_amount: u64,
        destination_amount: u64,
        auction_start_time: u64,
        auction_end_time: u64,
    }

    public struct EscrowCreated has copy, drop {
        order_hash: vector<u8>,
        escrow_id: sui::object::ID,
        hash_lock: vector<u8>,
        time_lock: u64,
        amount: u64,
    }

    public struct OrderPartiallyFilled has copy, drop {
        order_hash: vector<u8>,
        resolver: address,
        fill_amount: u64,
        filled_amount: u64,
        current_rate: u64,
    }

    public struct OrderCompleted has copy, drop {
        order_hash: vector<u8>,
        resolver: address,
        filled_amount: u64,
        current_rate: u64,
    }

    public struct OrderCancelled has copy, drop {
        order_hash: vector<u8>,
        maker: address,
        refund_amount: u64,
    }

    // Initialize function (Note: This is generic and should be called explicitly with type)
    public fun init_protocol<T>(ctx: &mut sui::tx_context::TxContext) {
        let protocol = LimitOrderProtocol<T> {
            id: sui::object::new(ctx),
            orders: sui::table::new(ctx),
            cancelled_orders: sui::table::new(ctx),
            nonces: sui::table::new(ctx),
        };
        sui::transfer::share_object(protocol);
    }

    // Initialize function for SUI specifically
    fun init(ctx: &mut sui::tx_context::TxContext) {
        init_protocol<SUI>(ctx);
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut sui::tx_context::TxContext) {
        init(ctx);
    }

    // Creates a cross-chain limit order with Dutch auction
    public fun create_cross_chain_order<T>(
        protocol: &mut LimitOrderProtocol<T>,
        coin: Coin<T>,
        destination_amount: u64,
        auction_start_time: u64,
        auction_end_time: u64,
        start_rate: u64,
        end_rate: u64,
        decrease_rate: u64,
        clock: &Clock,
        ctx: &mut sui::tx_context::TxContext
    ): vector<u8> {
        let source_amount = coin::value(&coin);
        let maker = sui::tx_context::sender(ctx);
        let current_time = clock::timestamp_ms(clock);
        
        assert!(source_amount >= MIN_ORDER_AMOUNT, E_INVALID_SOURCE_AMOUNT);
        assert!(destination_amount > 0, E_INVALID_DESTINATION_AMOUNT);
        assert!(auction_end_time > auction_start_time, E_INVALID_AUCTION_TIMES);
        assert!(auction_end_time - auction_start_time >= MIN_AUCTION_DURATION, E_AUCTION_TOO_SHORT);
        assert!(auction_end_time - auction_start_time <= MAX_AUCTION_DURATION, E_AUCTION_TOO_LONG);
        assert!(start_rate > 0 && end_rate > 0, E_INVALID_RATES);

        // Get or initialize nonce
        let nonce = if (sui::table::contains(&protocol.nonces, maker)) {
            let current_nonce = sui::table::borrow_mut(&mut protocol.nonces, maker);
            *current_nonce = *current_nonce + 1;
            *current_nonce
        } else {
            sui::table::add(&mut protocol.nonces, maker, 1);
            1
        };

        // Generate order hash
        let order_hash = generate_order_hash(
            maker,
            source_amount,
            destination_amount,
            auction_start_time,
            auction_end_time,
            start_rate,
            end_rate,
            nonce,
            current_time
        );

        assert!(!sui::table::contains(&protocol.orders, order_hash), E_ORDER_ALREADY_EXISTS);

        let auction_config = DutchAuctionConfig {
            auction_start_time,
            auction_end_time,
            start_rate,
            end_rate,
            decrease_rate,
        };

        // Create order
        let order = LimitOrder<T> {
            id: sui::object::new(ctx),
            maker,
            taker: @0x0, // Open to any resolver
            source_amount,
            destination_amount,
            deadline: auction_end_time,
            order_hash,
            is_active: true,
            auction_config,
            filled_amount: 0,
            escrow_id: sui::object::id_from_address(@0x0), // Will be set when escrow is created
            created_at: current_time,
            balance: coin::into_balance(coin),
        };

        let order_id = sui::object::id(&order);
        sui::table::add(&mut protocol.orders, order_hash, order_id);

        // Share the order object
        sui::transfer::share_object(order);

        event::emit(OrderCreated {
            order_hash,
            maker,
            source_amount,
            destination_amount,
            auction_start_time,
            auction_end_time,
        });

        order_hash
    }

    // Creates an escrow for a specific order
    public fun create_escrow_for_order<T>(
        order: &mut LimitOrder<T>,
        hash_lock: vector<u8>,
        time_lock: u64,
        ctx: &mut sui::tx_context::TxContext
    ): sui::object::ID {
        let sender = sui::tx_context::sender(ctx);
        
        assert!(sender == order.maker, E_ONLY_MAKER);
        assert!(order.is_active, E_ORDER_NOT_ACTIVE);
        assert!(order.escrow_id == sui::object::id_from_address(@0x0), E_ORDER_ALREADY_EXISTS);

        // For now, we'll just set a placeholder escrow_id
        // In a real implementation, this would interact with the escrow contract
        let escrow_id = sui::object::id_from_address(@0x1); // Placeholder
        order.escrow_id = escrow_id;

        event::emit(EscrowCreated {
            order_hash: order.order_hash,
            escrow_id,
            hash_lock,
            time_lock,
            amount: order.source_amount - order.filled_amount,
        });

        escrow_id
    }

    // Fills a limit order (called by resolvers)
    public fun fill_limit_order<T>(
        protocol: &mut LimitOrderProtocol<T>,
        order: &mut LimitOrder<T>,
        auction: &DutchAuction,
        resolver_network: &ResolverNetwork,
        _secret: vector<u8>,
        clock: &Clock,
        ctx: &mut sui::tx_context::TxContext
    ): Coin<T> {
        let resolver = sui::tx_context::sender(ctx);
        let current_time = clock::timestamp_ms(clock);
        
        assert!(order.is_active, E_ORDER_NOT_ACTIVE);
        assert!(!sui::table::contains(&protocol.cancelled_orders, order.order_hash), E_ORDER_ALREADY_CANCELLED);
        assert!(current_time <= order.deadline, E_ORDER_EXPIRED);
        assert!(resolver_network::is_authorized_resolver(resolver_network, resolver), E_UNAUTHORIZED_RESOLVER);

        // Get current auction rate
        let current_rate = dutch_auction::calculate_current_rate(auction, order.order_hash, clock);
        assert!(current_rate > 0, E_AUCTION_NOT_STARTED);

        // Calculate fill amount based on current rate
        let mut fill_amount = (order.source_amount * current_rate) / 1000000; // 1e6 precision
        let remaining_amount = order.source_amount - order.filled_amount;
        if (fill_amount > remaining_amount) {
            fill_amount = remaining_amount;
        };

        assert!(fill_amount > 0, E_INVALID_FILL_AMOUNT);

        // Update order
        order.filled_amount = order.filled_amount + fill_amount;
        let is_completed = order.filled_amount >= order.source_amount;

        if (is_completed) {
            order.is_active = false;
        };

        // Extract coins from balance
        let coin = coin::from_balance(balance::split(&mut order.balance, fill_amount), ctx);

        if (is_completed) {
            event::emit(OrderCompleted {
                order_hash: order.order_hash,
                resolver,
                filled_amount: order.filled_amount,
                current_rate,
            });
        } else {
            event::emit(OrderPartiallyFilled {
                order_hash: order.order_hash,
                resolver,
                fill_amount,
                filled_amount: order.filled_amount,
                current_rate,
            });
        };

        coin
    }

    // Cancels an active order
    public fun cancel_order<T>(
        protocol: &mut LimitOrderProtocol<T>,
        order: &mut LimitOrder<T>,
        order_hash: vector<u8>,
        ctx: &mut sui::tx_context::TxContext
    ): Coin<T> {
        let sender = sui::tx_context::sender(ctx);
        
        assert!(sender == order.maker, E_ONLY_MAKER);
        assert!(order.is_active, E_ORDER_NOT_ACTIVE);
        assert!(!sui::table::contains(&protocol.cancelled_orders, order_hash), E_ORDER_ALREADY_CANCELLED);

        // Mark as cancelled
        sui::table::add(&mut protocol.cancelled_orders, order_hash, true);
        order.is_active = false;

        // Refund remaining amount
        let refund_amount = order.source_amount - order.filled_amount;
        let coin = if (refund_amount > 0) {
            coin::from_balance(balance::withdraw_all(&mut order.balance), ctx)
        } else {
            coin::zero<T>(ctx)
        };

        event::emit(OrderCancelled {
            order_hash,
            maker: order.maker,
            refund_amount,
        });

        coin
    }

    // View functions
    public fun get_order<T>(order: &LimitOrder<T>): (
        address, // maker
        address, // taker
        u64, // source_amount
        u64, // destination_amount
        u64, // deadline
        bool, // is_active
        DutchAuctionConfig, // auction_config
        u64, // filled_amount
        sui::object::ID, // escrow_id
        u64 // created_at
    ) {
        (
            order.maker,
            order.taker,
            order.source_amount,
            order.destination_amount,
            order.deadline,
            order.is_active,
            order.auction_config,
            order.filled_amount,
            order.escrow_id,
            order.created_at
        )
    }

    public fun can_fill_order<T>(
        protocol: &LimitOrderProtocol<T>,
        order: &LimitOrder<T>,
        resolver_network: &ResolverNetwork,
        auction: &DutchAuction,
        resolver: address,
        clock: &Clock
    ): bool {
        let current_time = clock::timestamp_ms(clock);
        
        order.is_active &&
        !sui::table::contains(&protocol.cancelled_orders, order.order_hash) &&
        current_time <= order.deadline &&
        resolver_network::is_authorized_resolver(resolver_network, resolver) &&
        dutch_auction::calculate_current_rate(auction, order.order_hash, clock) > 0
    }

    public fun get_remaining_amount<T>(order: &LimitOrder<T>): u64 {
        order.source_amount - order.filled_amount
    }

    public fun get_order_hash<T>(order: &LimitOrder<T>): vector<u8> {
        order.order_hash
    }

    public fun get_auction_config<T>(order: &LimitOrder<T>): DutchAuctionConfig {
        order.auction_config
    }

    // Helper function to generate order hash
    fun generate_order_hash(
        maker: address,
        source_amount: u64,
        destination_amount: u64,
        auction_start_time: u64,
        auction_end_time: u64,
        start_rate: u64,
        end_rate: u64,
        nonce: u64,
        timestamp: u64
    ): vector<u8> {
        let mut data = std::vector::empty<u8>();
        
        // Append address as bytes
        let maker_bytes = std::bcs::to_bytes(&maker);
        std::vector::append(&mut data, maker_bytes);
        
        // Append amounts and times
        let source_bytes = std::bcs::to_bytes(&source_amount);
        std::vector::append(&mut data, source_bytes);
        
        let dest_bytes = std::bcs::to_bytes(&destination_amount);
        std::vector::append(&mut data, dest_bytes);
        
        let start_time_bytes = std::bcs::to_bytes(&auction_start_time);
        std::vector::append(&mut data, start_time_bytes);
        
        let end_time_bytes = std::bcs::to_bytes(&auction_end_time);
        std::vector::append(&mut data, end_time_bytes);
        
        let start_rate_bytes = std::bcs::to_bytes(&start_rate);
        std::vector::append(&mut data, start_rate_bytes);
        
        let end_rate_bytes = std::bcs::to_bytes(&end_rate);
        std::vector::append(&mut data, end_rate_bytes);
        
        let nonce_bytes = std::bcs::to_bytes(&nonce);
        std::vector::append(&mut data, nonce_bytes);
        
        let timestamp_bytes = std::bcs::to_bytes(&timestamp);
        std::vector::append(&mut data, timestamp_bytes);
        
        sui::hash::keccak256(&data)
    }
}