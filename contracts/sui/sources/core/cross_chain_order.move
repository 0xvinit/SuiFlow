module fusion_plus_crosschain::cross_chain_order {
    use sui::coin::{Self, Coin};
    use sui::clock::{Self, Clock};
    use sui::event;
    use sui::table;
    use sui::object;
    use sui::bcs;
    use std::option;
    use std::string::{Self, String};
    use fusion_plus_crosschain::cross_chain_escrow::{Self as vault_manager, AtomicSwapVault, ConsumedProofRegistry};
    use fusion_plus_crosschain::limit_order_protocol::{Self, LimitOrderProtocol};
    use fusion_plus_crosschain::dutch_auction::{Self, DutchAuction};
    use fusion_plus_crosschain::resolver_network::{Self, ResolverNetwork};
    use fusion_plus_crosschain::cryptographic_proof;
    use fusion_plus_crosschain::temporal_constraint;

    // Enhanced error codes with unique identifiers
    const E_ORDER_NOT_FOUND: u64 = 0x4001;
    const E_ORDER_NOT_ACTIVE: u64 = 0x4002;
    const E_ORDER_EXPIRED: u64 = 0x4003;
    const E_INVALID_CRYPTOGRAPHIC_PROOF: u64 = 0x4004;
    const E_UNAUTHORIZED_RESOLVER: u64 = 0x4005;
    const E_VAULT_NOT_FOUND: u64 = 0x4006;
    const E_AUCTION_NOT_STARTED: u64 = 0x4007;
    const E_ONLY_ORDER_CREATOR: u64 = 0x4008;
    const E_INSUFFICIENT_BALANCE: u64 = 0x4009;
    const E_ORDER_NOT_EXPIRED: u64 = 0x400A;
    const E_INVALID_ORDER_STATE: u64 = 0x400B;
    const E_SETTLEMENT_FAILED: u64 = 0x400C;

    // Cross-chain order status
    const STATUS_ACTIVE: u8 = 0;
    const STATUS_COMPLETED: u8 = 1;
    const STATUS_CANCELLED: u8 = 2;
    const STATUS_REFUNDED: u8 = 3;

    // Enhanced cross-chain order data structure
    public struct CrossChainOrderData has copy, drop, store {
        order_id: vector<u8>,
        creator: address,
        beneficiary: address,
        source_amount: u64,
        destination_amount: u64,
        cryptographic_commitment: vector<u8>,
        temporal_deadline: u64,
        status: u8,
        created_at: u64,
        cross_chain_reference: String,
        vault_object_id: option::Option<sui::object::ID>,
    }

    // Cross-chain order registry
    public struct CrossChainOrderRegistry has key {
        id: sui::object::UID,
        orders: sui::table::Table<vector<u8>, CrossChainOrderData>,
        order_counter: u64,
    }

    // Enhanced event structures
    public struct CrossChainOrderCreated has copy, drop {
        order_id: vector<u8>,
        creator: address,
        beneficiary: address,
        source_amount: u64,
        destination_amount: u64,
        cryptographic_commitment: vector<u8>,
        temporal_deadline: u64,
        cross_chain_reference: String,
        vault_id: sui::object::ID,
    }

    public struct CrossChainOrderSettled has copy, drop {
        order_id: vector<u8>,
        settler: address,
        settlement_amount: u64,
        cryptographic_proof: vector<u8>,
        cross_chain_reference: String,
    }

    public struct CrossChainOrderCancelled has copy, drop {
        order_id: vector<u8>,
        creator: address,
        refund_amount: u64,
        cross_chain_reference: String,
    }

    // Initialize cross-chain order system
    fun init(ctx: &mut sui::tx_context::TxContext) {
        let registry = CrossChainOrderRegistry {
            id: sui::object::new(ctx),
            orders: sui::table::new(ctx),
            order_counter: 0,
        };
        sui::transfer::share_object(registry);
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut sui::tx_context::TxContext) {
        init(ctx);
    }

    // Create cross-chain order with integrated vault
    public fun create_cross_chain_order_with_vault<T>(
        order_registry: &mut CrossChainOrderRegistry,
        vault_registry: &mut ConsumedProofRegistry,
        coin: Coin<T>,
        beneficiary: address,
        destination_amount: u64,
        cryptographic_commitment: vector<u8>,
        temporal_deadline: u64,
        cross_chain_reference: String,
        clock: &Clock,
        ctx: &mut sui::tx_context::TxContext
    ): vector<u8> {
        let creator = sui::tx_context::sender(ctx);
        let source_amount = coin::value(&coin);
        let current_timestamp = clock::timestamp_ms(clock);
        
        // Validate inputs
        assert!(temporal_constraint::is_valid_deadline(temporal_deadline, clock), E_ORDER_EXPIRED);
        assert!(cryptographic_proof::is_valid_commitment(&cryptographic_commitment), E_INVALID_CRYPTOGRAPHIC_PROOF);
        
        // Generate unique order ID
        order_registry.order_counter = order_registry.order_counter + 1;
        let order_id = sui::bcs::to_bytes(&order_registry.order_counter);
        
        // Create vault for the order
        let vault_id = vault_manager::create_and_share_vault(
            coin,
            beneficiary,
            cryptographic_commitment,
            temporal_deadline,
            cross_chain_reference,
            vault_registry,
            clock,
            ctx
        );
        
        // Create order data
        let order_data = CrossChainOrderData {
            order_id,
            creator,
            beneficiary,
            source_amount,
            destination_amount,
            cryptographic_commitment,
            temporal_deadline,
            status: STATUS_ACTIVE,
            created_at: current_timestamp,
            cross_chain_reference,
            vault_object_id: option::some(vault_id),
        };
        
        // Store order
        sui::table::add(&mut order_registry.orders, order_id, order_data);
        
        // Emit event
        event::emit(CrossChainOrderCreated {
            order_id,
            creator,
            beneficiary,
            source_amount,
            destination_amount,
            cryptographic_commitment,
            temporal_deadline,
            cross_chain_reference,
            vault_id,
        });
        
        order_id
    }

    // Settle cross-chain order through vault
    public fun settle_cross_chain_order<T>(
        order_registry: &mut CrossChainOrderRegistry,
        vault_registry: &mut ConsumedProofRegistry,
        vault: &mut AtomicSwapVault<T>,
        order_id: vector<u8>,
        settlement_amount: u64,
        cryptographic_proof: vector<u8>,
        clock: &Clock,
        ctx: &mut sui::tx_context::TxContext
    ): Coin<T> {
        let settler = sui::tx_context::sender(ctx);
        
        // Validate order exists and is active
        assert!(sui::table::contains(&order_registry.orders, order_id), E_ORDER_NOT_FOUND);
        let order_data = sui::table::borrow_mut(&mut order_registry.orders, order_id);
        assert!(order_data.status == STATUS_ACTIVE, E_ORDER_NOT_ACTIVE);
        
        // Validate temporal constraint
        assert!(!temporal_constraint::has_expired(order_data.temporal_deadline, clock), E_ORDER_EXPIRED);
        
        // Validate cryptographic proof
        assert!(cryptographic_proof::verify_proof(cryptographic_proof, order_data.cryptographic_commitment), E_INVALID_CRYPTOGRAPHIC_PROOF);
        
        // Settle through vault
        let settlement_coin = vault_manager::settle_vault_partial(
            vault,
            vault_registry,
            settlement_amount,
            cryptographic_proof,
            clock,
            ctx
        );
        
        // Check if fully settled
        let remaining_balance = vault_manager::get_available_balance(vault);
        if (remaining_balance == 0) {
            order_data.status = STATUS_COMPLETED;
        };
        
        // Emit settlement event
        event::emit(CrossChainOrderSettled {
            order_id,
            settler,
            settlement_amount,
            cryptographic_proof,
            cross_chain_reference: order_data.cross_chain_reference,
        });
        
        settlement_coin
    }

    // Complete settlement of cross-chain order
    public fun complete_cross_chain_order<T>(
        order_registry: &mut CrossChainOrderRegistry,
        vault_registry: &mut ConsumedProofRegistry,
        vault: &mut AtomicSwapVault<T>,
        order_id: vector<u8>,
        cryptographic_proof: vector<u8>,
        clock: &Clock,
        ctx: &mut sui::tx_context::TxContext
    ): Coin<T> {
        let settler = sui::tx_context::sender(ctx);
        
        // Validate order
        assert!(sui::table::contains(&order_registry.orders, order_id), E_ORDER_NOT_FOUND);
        let order_data = sui::table::borrow_mut(&mut order_registry.orders, order_id);
        assert!(order_data.status == STATUS_ACTIVE, E_ORDER_NOT_ACTIVE);
        
        // Validate temporal constraint
        assert!(!temporal_constraint::has_expired(order_data.temporal_deadline, clock), E_ORDER_EXPIRED);
        
        // Validate cryptographic proof
        assert!(cryptographic_proof::verify_proof(cryptographic_proof, order_data.cryptographic_commitment), E_INVALID_CRYPTOGRAPHIC_PROOF);
        
        // Complete settlement
        let settlement_coin = vault_manager::settle_vault_complete(
            vault,
            vault_registry,
            cryptographic_proof,
            clock,
            ctx
        );
        
        // Mark order as completed
        order_data.status = STATUS_COMPLETED;
        
        // Emit completion event
        event::emit(CrossChainOrderSettled {
            order_id,
            settler,
            settlement_amount: coin::value(&settlement_coin),
            cryptographic_proof,
            cross_chain_reference: order_data.cross_chain_reference,
        });
        
        settlement_coin
    }

    // Cancel and refund cross-chain order
    public fun cancel_cross_chain_order<T>(
        order_registry: &mut CrossChainOrderRegistry,
        vault: &mut AtomicSwapVault<T>,
        order_id: vector<u8>,
        clock: &Clock,
        ctx: &mut sui::tx_context::TxContext
    ): Coin<T> {
        let sender = sui::tx_context::sender(ctx);
        
        // Validate order
        assert!(sui::table::contains(&order_registry.orders, order_id), E_ORDER_NOT_FOUND);
        let order_data = sui::table::borrow_mut(&mut order_registry.orders, order_id);
        assert!(sender == order_data.creator, E_ONLY_ORDER_CREATOR);
        assert!(order_data.status == STATUS_ACTIVE, E_ORDER_NOT_ACTIVE);
        
        // Check if can refund (expired) or cancel (active)
        let refund_coin = if (temporal_constraint::has_expired(order_data.temporal_deadline, clock)) {
            vault_manager::refund_vault(vault, clock, ctx)
        } else {
            // For active orders, only creator can cancel with immediate refund
            vault_manager::refund_vault(vault, clock, ctx)
        };
        
        // Mark as cancelled
        order_data.status = STATUS_CANCELLED;
        
        // Emit cancellation event  
        event::emit(CrossChainOrderCancelled {
            order_id,
            creator: sender,
            refund_amount: coin::value(&refund_coin),
            cross_chain_reference: order_data.cross_chain_reference,
        });
        
        refund_coin
    }

    // Emergency refund for expired orders
    public fun emergency_refund_order<T>(
        order_registry: &mut CrossChainOrderRegistry,
        vault: &mut AtomicSwapVault<T>,
        order_id: vector<u8>,
        clock: &Clock,
        ctx: &mut sui::tx_context::TxContext
    ): Coin<T> {
        let sender = sui::tx_context::sender(ctx);
        
        // Validate order
        assert!(sui::table::contains(&order_registry.orders, order_id), E_ORDER_NOT_FOUND);
        let order_data = sui::table::borrow_mut(&mut order_registry.orders, order_id);
        assert!(sender == order_data.creator, E_ONLY_ORDER_CREATOR);
        assert!(order_data.status == STATUS_ACTIVE, E_ORDER_NOT_ACTIVE);
        
        // Must be expired
        assert!(temporal_constraint::has_expired(order_data.temporal_deadline, clock), E_ORDER_NOT_EXPIRED);
        
        // Refund through vault
        let refund_coin = vault_manager::refund_vault(vault, clock, ctx);
        
        // Mark as refunded
        order_data.status = STATUS_REFUNDED;
        
        // Emit refund event
        event::emit(CrossChainOrderCancelled {
            order_id,
            creator: sender,
            refund_amount: coin::value(&refund_coin),
            cross_chain_reference: order_data.cross_chain_reference,
        });
        
        refund_coin
    }

    // View functions
    public fun get_order_data(
        order_registry: &CrossChainOrderRegistry,
        order_id: vector<u8>
    ): CrossChainOrderData {
        *sui::table::borrow(&order_registry.orders, order_id)
    }

    public fun is_order_active(
        order_registry: &CrossChainOrderRegistry,
        order_id: vector<u8>,
        clock: &Clock
    ): bool {
        if (!sui::table::contains(&order_registry.orders, order_id)) {
            return false
        };
        
        let order_data = sui::table::borrow(&order_registry.orders, order_id);
        order_data.status == STATUS_ACTIVE && 
        !temporal_constraint::has_expired(order_data.temporal_deadline, clock)
    }

    public fun is_order_expired(
        order_registry: &CrossChainOrderRegistry,
        order_id: vector<u8>,
        clock: &Clock
    ): bool {
        if (!sui::table::contains(&order_registry.orders, order_id)) {
            return false
        };
        
        let order_data = sui::table::borrow(&order_registry.orders, order_id);
        temporal_constraint::has_expired(order_data.temporal_deadline, clock)
    }

    // Get registry statistics
    public fun get_registry_stats(order_registry: &CrossChainOrderRegistry): u64 {
        order_registry.order_counter
    }

    // Status constants
    public fun get_status_active(): u8 { STATUS_ACTIVE }
    public fun get_status_completed(): u8 { STATUS_COMPLETED }
    public fun get_status_cancelled(): u8 { STATUS_CANCELLED }
    public fun get_status_refunded(): u8 { STATUS_REFUNDED }
}