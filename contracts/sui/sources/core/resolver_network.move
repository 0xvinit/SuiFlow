module fusion_plus_crosschain::resolver_network {
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::clock::{Self, Clock};
    use sui::event;
    use sui::sui::SUI;

    // Error codes
    const E_RESOLVER_ALREADY_REGISTERED: u64 = 1;
    const E_INSUFFICIENT_STAKE: u64 = 2;
    const E_RESOLVER_NOT_REGISTERED: u64 = 3;
    const E_ORDER_ALREADY_REGISTERED: u64 = 4;
    const E_ORDER_NOT_REGISTERED: u64 = 5;
    const E_RESOLVER_NOT_AUTHORIZED: u64 = 6;
    const E_ORDER_NOT_ACTIVE: u64 = 7;
    const E_INVALID_BID_AMOUNT: u64 = 8;
    const E_ONLY_LIMIT_ORDER_PROTOCOL: u64 = 9;
    const E_ONLY_ADMIN: u64 = 10;
    const E_INVALID_ADDRESS: u64 = 11;

    // Constants
    const MIN_STAKE: u64 = 1000000000; // 1 SUI minimum stake (assuming 9 decimals)
    const REPUTATION_DECAY_RATE: u64 = 99; // 1% decay per period
    const REPUTATION_PERIOD: u64 = 86400000; // 24 hours in milliseconds

    // Resolver information structure
    public struct ResolverInfo has copy, drop, store {
        resolver: address,
        is_registered: bool,
        is_authorized: bool,
        reputation: u64,
        total_orders_filled: u64,
        total_volume_handled: u64,
        last_activity_time: u64,
        staked_amount: u64,
        penalties: u64,
    }

    // Order information structure
    public struct OrderInfo has copy, drop, store {
        order_hash: vector<u8>,
        source_amount: u64,
        destination_amount: u64,
        is_registered: bool,
        is_active: bool,
        best_bidder: address,
        best_bid_price: u64,
        registered_at: u64,
    }

    // Resolver network registry
    public struct ResolverNetwork has key {
        id: sui::object::UID,
        resolvers: sui::table::Table<address, ResolverInfo>,
        orders: sui::table::Table<vector<u8>, OrderInfo>, // order_hash -> OrderInfo
        order_bids: sui::table::Table<vector<u8>, sui::table::Table<address, u64>>, // order_hash -> (resolver -> bid_amount)
        order_resolvers: sui::table::Table<vector<u8>, vector<address>>, // order_hash -> resolvers[]
        resolver_stakes: Balance<SUI>,
        limit_order_protocol: address,
        admin: address,
    }

    // Events
    public struct ResolverRegistered has copy, drop {
        resolver: address,
        stake_amount: u64,
    }

    public struct ResolverUnregistered has copy, drop {
        resolver: address,
        returned_stake: u64,
    }

    public struct OrderRegistered has copy, drop {
        order_hash: vector<u8>,
        source_amount: u64,
        destination_amount: u64,
    }

    public struct OrderUnregistered has copy, drop {
        order_hash: vector<u8>,
    }

    public struct BidPlaced has copy, drop {
        order_hash: vector<u8>,
        resolver: address,
        bid_amount: u64,
    }

    public struct OrderFilled has copy, drop {
        order_hash: vector<u8>,
        resolver: address,
        fill_amount: u64,
        current_rate: u64,
    }

    public struct ResolverPenalized has copy, drop {
        resolver: address,
        penalty_amount: u64,
    }

    public struct ResolverAuthorizationChanged has copy, drop {
        resolver: address,
        authorized: bool,
    }

    public struct AdminChanged has copy, drop {
        old_admin: address,
        new_admin: address,
    }

    // Initialize function
    fun init(ctx: &mut sui::tx_context::TxContext) {
        let network = ResolverNetwork {
            id: sui::object::new(ctx),
            resolvers: sui::table::new(ctx),
            orders: sui::table::new(ctx),
            order_bids: sui::table::new(ctx),
            order_resolvers: sui::table::new(ctx),
            resolver_stakes: balance::zero<SUI>(),
            limit_order_protocol: @0x0, // Will be set later
            admin: sui::tx_context::sender(ctx),
        };
        sui::transfer::share_object(network);
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut sui::tx_context::TxContext) {
        init(ctx);
    }

    // Modifier functions
    fun assert_only_limit_order_protocol(network: &ResolverNetwork, ctx: &sui::tx_context::TxContext) {
        assert!(sui::tx_context::sender(ctx) == network.limit_order_protocol, E_ONLY_LIMIT_ORDER_PROTOCOL);
    }

    fun assert_only_admin(network: &ResolverNetwork, ctx: &sui::tx_context::TxContext) {
        assert!(sui::tx_context::sender(ctx) == network.admin, E_ONLY_ADMIN);
    }

    // Set the limit order protocol address (admin function)
    public fun set_limit_order_protocol(
        network: &mut ResolverNetwork,
        protocol_address: address,
        ctx: &mut sui::tx_context::TxContext
    ) {
        assert_only_admin(network, ctx);
        network.limit_order_protocol = protocol_address;
    }

    // Registers a resolver with initial stake
    public fun register_resolver(
        network: &mut ResolverNetwork,
        stake_coin: Coin<SUI>,
        ctx: &mut sui::tx_context::TxContext
    ) {
        let resolver = sui::tx_context::sender(ctx);
        let stake_amount = coin::value(&stake_coin);
        
        assert!(!sui::table::contains(&network.resolvers, resolver), E_RESOLVER_ALREADY_REGISTERED);
        assert!(stake_amount >= MIN_STAKE, E_INSUFFICIENT_STAKE);

        // Add stake to the pool
        balance::join(&mut network.resolver_stakes, coin::into_balance(stake_coin));

        let resolver_info = ResolverInfo {
            resolver,
            is_registered: true,
            is_authorized: true,
            reputation: 100, // Start with neutral reputation
            total_orders_filled: 0,
            total_volume_handled: 0,
            last_activity_time: 0, // Will be set when clock is available
            staked_amount: stake_amount,
            penalties: 0,
        };

        sui::table::add(&mut network.resolvers, resolver, resolver_info);

        event::emit(ResolverRegistered {
            resolver,
            stake_amount,
        });
    }

    // Unregisters a resolver and returns their stake
    public fun unregister_resolver(
        network: &mut ResolverNetwork,
        ctx: &mut sui::tx_context::TxContext
    ): Coin<SUI> {
        let resolver = sui::tx_context::sender(ctx);
        
        assert!(sui::table::contains(&network.resolvers, resolver), E_RESOLVER_NOT_REGISTERED);
        
        let resolver_info = sui::table::remove(&mut network.resolvers, resolver);
        let stake_to_return = resolver_info.staked_amount;
        
        // Return stake
        let returned_coin = coin::from_balance(
            balance::split(&mut network.resolver_stakes, stake_to_return),
            ctx
        );

        event::emit(ResolverUnregistered {
            resolver,
            returned_stake: stake_to_return,
        });

        returned_coin
    }

    // Registers an order for resolver network
    public fun register_order(
        network: &mut ResolverNetwork,
        order_hash: vector<u8>,
        source_amount: u64,
        destination_amount: u64,
        clock: &Clock,
        ctx: &mut sui::tx_context::TxContext
    ) {
        assert_only_limit_order_protocol(network, ctx);
        assert!(!sui::table::contains(&network.orders, order_hash), E_ORDER_ALREADY_REGISTERED);

        let order_info = OrderInfo {
            order_hash,
            source_amount,
            destination_amount,
            is_registered: true,
            is_active: true,
            best_bidder: @0x0,
            best_bid_price: 0,
            registered_at: clock::timestamp_ms(clock),
        };

        sui::table::add(&mut network.orders, order_hash, order_info);
        sui::table::add(&mut network.order_bids, order_hash, sui::table::new(ctx));
        sui::table::add(&mut network.order_resolvers, order_hash, std::vector::empty<address>());

        event::emit(OrderRegistered {
            order_hash,
            source_amount,
            destination_amount,
        });
    }

    // Unregisters an order from resolver network
    public fun unregister_order(
        network: &mut ResolverNetwork,
        order_hash: vector<u8>,
        ctx: &mut sui::tx_context::TxContext
    ) {
        assert_only_limit_order_protocol(network, ctx);
        assert!(sui::table::contains(&network.orders, order_hash), E_ORDER_NOT_REGISTERED);
        
        let order_info = sui::table::borrow_mut(&mut network.orders, order_hash);
        order_info.is_active = false;

        event::emit(OrderUnregistered {
            order_hash,
        });
    }

    // Places a bid on an order
    public fun bid_on_order(
        network: &mut ResolverNetwork,
        order_hash: vector<u8>,
        bid_amount: u64,
        ctx: &mut sui::tx_context::TxContext
    ) {
        let resolver = sui::tx_context::sender(ctx);
        
        assert!(sui::table::contains(&network.resolvers, resolver), E_RESOLVER_NOT_REGISTERED);
        assert!(sui::table::contains(&network.orders, order_hash), E_ORDER_NOT_REGISTERED);
        assert!(bid_amount > 0, E_INVALID_BID_AMOUNT);

        let resolver_info = sui::table::borrow(&network.resolvers, resolver);
        assert!(resolver_info.is_authorized, E_RESOLVER_NOT_AUTHORIZED);

        let order_info = sui::table::borrow_mut(&mut network.orders, order_hash);
        assert!(order_info.is_active, E_ORDER_NOT_ACTIVE);

        // Update bid
        let order_bids = sui::table::borrow_mut(&mut network.order_bids, order_hash);
        if (sui::table::contains(order_bids, resolver)) {
            let existing_bid = sui::table::borrow_mut(order_bids, resolver);
            *existing_bid = bid_amount;
        } else {
            sui::table::add(order_bids, resolver, bid_amount);
        };

        // Track resolver for this order
        let resolver_list = sui::table::borrow_mut(&mut network.order_resolvers, order_hash);
        let mut found = false;
        let mut i = 0;
        let len = std::vector::length(resolver_list);
        while (i < len) {
            if (*std::vector::borrow(resolver_list, i) == resolver) {
                found = true;
                break
            };
            i = i + 1;
        };
        if (!found) {
            std::vector::push_back(resolver_list, resolver);
        };

        // Update best bid if this is better
        if (bid_amount > order_info.best_bid_price) {
            order_info.best_bidder = resolver;
            order_info.best_bid_price = bid_amount;
        };

        event::emit(BidPlaced {
            order_hash,
            resolver,
            bid_amount,
        });
    }

    // Records order fill execution
    public fun record_order_fill(
        network: &mut ResolverNetwork,
        order_hash: vector<u8>,
        resolver: address,
        fill_amount: u64,
        current_rate: u64,
        clock: &Clock,
        ctx: &mut sui::tx_context::TxContext
    ) {
        assert_only_limit_order_protocol(network, ctx);
        assert!(sui::table::contains(&network.resolvers, resolver), E_RESOLVER_NOT_REGISTERED);
        assert!(sui::table::contains(&network.orders, order_hash), E_ORDER_NOT_REGISTERED);

        // Update resolver stats
        let resolver_info = sui::table::borrow_mut(&mut network.resolvers, resolver);
        resolver_info.total_orders_filled = resolver_info.total_orders_filled + 1;
        resolver_info.total_volume_handled = resolver_info.total_volume_handled + fill_amount;
        resolver_info.last_activity_time = clock::timestamp_ms(clock);

        // Update reputation based on performance
        update_resolver_reputation(resolver_info, true);

        event::emit(OrderFilled {
            order_hash,
            resolver,
            fill_amount,
            current_rate,
        });
    }

    // Penalizes a resolver for bad behavior
    public fun penalize_resolver(
        network: &mut ResolverNetwork,
        resolver: address,
        penalty_amount: u64,
        ctx: &mut sui::tx_context::TxContext
    ) {
        assert_only_admin(network, ctx);
        assert!(sui::table::contains(&network.resolvers, resolver), E_RESOLVER_NOT_REGISTERED);

        let resolver_info = sui::table::borrow_mut(&mut network.resolvers, resolver);
        resolver_info.penalties = resolver_info.penalties + penalty_amount;
        resolver_info.reputation = if (resolver_info.reputation > penalty_amount) {
            resolver_info.reputation - penalty_amount
        } else {
            0
        };

        // Deauthorize if too many penalties
        if (resolver_info.penalties > 50) {
            resolver_info.is_authorized = false;
        };

        event::emit(ResolverPenalized {
            resolver,
            penalty_amount,
        });
    }

    // Internal function to update resolver reputation
    fun update_resolver_reputation(resolver_info: &mut ResolverInfo, positive: bool) {
        if (positive) {
            // Increase reputation for successful fills
            resolver_info.reputation = if (resolver_info.reputation < 200) {
                resolver_info.reputation + 1
            } else {
                200
            };
        } else {
            // Decrease reputation for failures
            resolver_info.reputation = if (resolver_info.reputation > 1) {
                resolver_info.reputation - 1
            } else {
                0
            };
        };
    }

    // View functions
    public fun get_resolver(network: &ResolverNetwork, resolver: address): ResolverInfo {
        *sui::table::borrow(&network.resolvers, resolver)
    }

    public fun get_order(network: &ResolverNetwork, order_hash: vector<u8>): OrderInfo {
        *sui::table::borrow(&network.orders, order_hash)
    }

    public fun get_bid(network: &ResolverNetwork, order_hash: vector<u8>, resolver: address): u64 {
        let order_bids = sui::table::borrow(&network.order_bids, order_hash);
        if (sui::table::contains(order_bids, resolver)) {
            *sui::table::borrow(order_bids, resolver)
        } else {
            0
        }
    }

    public fun get_order_resolvers(network: &ResolverNetwork, order_hash: vector<u8>): vector<address> {
        *sui::table::borrow(&network.order_resolvers, order_hash)
    }

    public fun is_authorized_resolver(network: &ResolverNetwork, resolver: address): bool {
        if (sui::table::contains(&network.resolvers, resolver)) {
            let resolver_info = sui::table::borrow(&network.resolvers, resolver);
            resolver_info.is_registered && resolver_info.is_authorized
        } else {
            false
        }
    }

    public fun get_resolver_reputation(
        network: &ResolverNetwork,
        resolver: address,
        clock: &Clock
    ): u64 {
        if (!sui::table::contains(&network.resolvers, resolver)) {
            return 0
        };

        let resolver_info = sui::table::borrow(&network.resolvers, resolver);
        
        // Apply reputation decay based on inactivity
        let current_time = clock::timestamp_ms(clock);
        let time_since_activity = current_time - resolver_info.last_activity_time;
        let periods = time_since_activity / REPUTATION_PERIOD;
        
        if (periods == 0) {
            return resolver_info.reputation
        };
        
        let mut decayed_reputation = resolver_info.reputation;
        let mut i = 0;
        while (i < periods && decayed_reputation > 0) {
            decayed_reputation = (decayed_reputation * REPUTATION_DECAY_RATE) / 100;
            i = i + 1;
        };
        
        decayed_reputation
    }

    // Admin functions
    public fun set_resolver_authorization(
        network: &mut ResolverNetwork,
        resolver: address,
        authorized: bool,
        ctx: &mut sui::tx_context::TxContext
    ) {
        assert_only_admin(network, ctx);
        assert!(sui::table::contains(&network.resolvers, resolver), E_RESOLVER_NOT_REGISTERED);
        
        let resolver_info = sui::table::borrow_mut(&mut network.resolvers, resolver);
        resolver_info.is_authorized = authorized;
        
        event::emit(ResolverAuthorizationChanged {
            resolver,
            authorized,
        });
    }

    public fun change_admin(
        network: &mut ResolverNetwork,
        new_admin: address,
        ctx: &mut sui::tx_context::TxContext
    ) {
        assert_only_admin(network, ctx);
        assert!(new_admin != @0x0, E_INVALID_ADDRESS);
        
        let old_admin = network.admin;
        network.admin = new_admin;
        
        event::emit(AdminChanged {
            old_admin,
            new_admin,
        });
    }

    // Helper functions for testing
    #[test_only]
    public fun create_test_resolver_info(
        resolver: address,
        reputation: u64,
        staked_amount: u64
    ): ResolverInfo {
        ResolverInfo {
            resolver,
            is_registered: true,
            is_authorized: true,
            reputation,
            total_orders_filled: 0,
            total_volume_handled: 0,
            last_activity_time: 0,
            staked_amount,
            penalties: 0,
        }
    }

    #[test_only]
    public fun get_min_stake(): u64 {
        MIN_STAKE
    }
}