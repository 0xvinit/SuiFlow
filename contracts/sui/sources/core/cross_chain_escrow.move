module fusion_plus_crosschain::cross_chain_escrow {
    use sui::balance::{Self, Balance};
    use sui::coin::{Self, Coin};
    use sui::clock::{Self, Clock};
    use sui::event;
    use sui::table::{Self, Table};
    use std::string::String;
    use fusion_plus_crosschain::cryptographic_proof;
    use fusion_plus_crosschain::temporal_constraint;

    // Enhanced error constants with unique identifiers
    const E_INVALID_TEMPORAL_CONSTRAINT: u64 = 0x1001;
    const E_INSUFFICIENT_DEPOSIT: u64 = 0x1002;
    const E_UNAUTHORIZED_BENEFICIARY: u64 = 0x1003;
    const E_VAULT_ALREADY_SETTLED: u64 = 0x1004;
    const E_TEMPORAL_WINDOW_EXPIRED: u64 = 0x1005;
    const E_INVALID_CRYPTOGRAPHIC_PROOF: u64 = 0x1006;
    const E_UNAUTHORIZED_DEPOSITOR: u64 = 0x1007;
    const E_TEMPORAL_CONSTRAINT_ACTIVE: u64 = 0x1008;
    const E_PROOF_ALREADY_CONSUMED: u64 = 0x1009;
    const E_INSUFFICIENT_VAULT_BALANCE: u64 = 0x100A;
    const E_INVALID_SETTLEMENT_AMOUNT: u64 = 0x100B;
    const E_VAULT_STATE_LOCKED: u64 = 0x100C;

    // Settlement status constants
    const STATUS_ACTIVE: u8 = 0;
    const STATUS_SETTLED: u8 = 1;
    const STATUS_REFUNDED: u8 = 2;
    const STATUS_EXPIRED: u8 = 3;

    // Global registry for consumed cryptographic proofs
    public struct ConsumedProofRegistry has key {
        id: sui::object::UID,
        consumed_proofs: Table<vector<u8>, bool>,
        vault_counter: u64,
        total_settlements: u64,
    }

    // Settlement record for tracking partial settlements
    public struct SettlementRecord has copy, drop, store {
        settler: address,
        amount: u64,
        timestamp: u64,
        proof_hash: vector<u8>,
    }

    // Enhanced cross-chain atomic vault with advanced features
    public struct AtomicSwapVault<phantom T> has key, store {
        id: sui::object::UID,
        vault_id: u64,
        depositor: address,
        beneficiary: address, // @0x0 allows any beneficiary
        total_deposit: u64,
        available_balance: u64,
        asset_reserve: Balance<T>,
        cryptographic_commitment: vector<u8>,
        temporal_deadline: u64,
        settlement_status: u8, // 0: Active, 1: Settled, 2: Refunded, 3: Expired
        creation_timestamp: u64,
        cross_chain_reference: String,
        revealed_proof: vector<u8>,
        settlement_history: vector<SettlementRecord>,
    }

    // Enhanced event structures
    public struct VaultCreated has copy, drop {
        vault_id: u64,
        object_id: sui::object::ID,
        depositor: address,
        beneficiary: address,
        deposit_amount: u64,
        cryptographic_commitment: vector<u8>,
        temporal_deadline: u64,
        cross_chain_reference: String,
    }

    public struct VaultPartiallySettled has copy, drop {
        vault_id: u64,
        object_id: sui::object::ID,
        settler: address,
        settlement_amount: u64,
        remaining_balance: u64,
        cryptographic_proof: vector<u8>,
        cross_chain_reference: String,
    }
    
    public struct VaultFullySettled has copy, drop {
        vault_id: u64,
        object_id: sui::object::ID,
        final_settler: address,
        total_settled: u64,
        cryptographic_proof: vector<u8>,
        cross_chain_reference: String,
    }

    public struct VaultRefunded has copy, drop {
        vault_id: u64,
        object_id: sui::object::ID,
        depositor: address,
        refund_amount: u64,
        cross_chain_reference: String,
    }

    // System initialization with enhanced registry
    fun init(ctx: &mut sui::tx_context::TxContext) {
        let registry = ConsumedProofRegistry {
            id: sui::object::new(ctx),
            consumed_proofs: table::new(ctx),
            vault_counter: 0,
            total_settlements: 0,
        };
        sui::transfer::share_object(registry);
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut sui::tx_context::TxContext) {
        init(ctx);
    }

    // Create atomic swap vault with enhanced security
    public fun create_vault<T>(
        coin: Coin<T>,
        beneficiary: address,
        cryptographic_commitment: vector<u8>,
        temporal_deadline: u64,
        cross_chain_reference: String,
        registry: &mut ConsumedProofRegistry,
        clock: &Clock,
        ctx: &mut sui::tx_context::TxContext
    ): AtomicSwapVault<T> {
        let deposit_amount = coin::value(&coin);
        let depositor = sui::tx_context::sender(ctx);
        let current_timestamp = clock::timestamp_ms(clock);
        
        assert!(temporal_constraint::is_valid_deadline(temporal_deadline, clock), E_INVALID_TEMPORAL_CONSTRAINT);
        assert!(deposit_amount > 0, E_INSUFFICIENT_DEPOSIT);
        assert!(cryptographic_proof::is_valid_commitment(&cryptographic_commitment), E_INVALID_CRYPTOGRAPHIC_PROOF);
        
        registry.vault_counter = registry.vault_counter + 1;
        let vault_id = registry.vault_counter;
        
        let vault_uid = sui::object::new(ctx);
        let object_id = sui::object::uid_to_inner(&vault_uid);
        
        let vault = AtomicSwapVault<T> {
            id: vault_uid,
            vault_id,
            depositor,
            beneficiary,
            total_deposit: deposit_amount,
            available_balance: deposit_amount,
            asset_reserve: coin::into_balance(coin),
            cryptographic_commitment,
            temporal_deadline,
            settlement_status: STATUS_ACTIVE,
            creation_timestamp: current_timestamp,
            cross_chain_reference,
            revealed_proof: std::vector::empty(),
            settlement_history: std::vector::empty(),
        };

        event::emit(VaultCreated {
            vault_id,
            object_id,
            depositor,
            beneficiary,
            deposit_amount,
            cryptographic_commitment,
            temporal_deadline,
            cross_chain_reference,
        });

        vault
    }

    // Create and immediately share vault
    public fun create_and_share_vault<T>(
        coin: Coin<T>,
        beneficiary: address,
        cryptographic_commitment: vector<u8>,
        temporal_deadline: u64,
        cross_chain_reference: String,
        registry: &mut ConsumedProofRegistry,
        clock: &Clock,
        ctx: &mut sui::tx_context::TxContext
    ): sui::object::ID {
        let vault = create_vault(
            coin,
            beneficiary,
            cryptographic_commitment,
            temporal_deadline,
            cross_chain_reference,
            registry,
            clock,
            ctx
        );
        
        let object_id = sui::object::id(&vault);
        sui::transfer::share_object(vault);
        object_id
    }

    // Share existing vault
    public fun share_vault<T>(vault: AtomicSwapVault<T>) {
        sui::transfer::share_object(vault);
    }

    // Settle vault with partial amount
    public fun settle_vault_partial<T>(
        vault: &mut AtomicSwapVault<T>,
        registry: &mut ConsumedProofRegistry,
        settlement_amount: u64,
        cryptographic_proof: vector<u8>,
        clock: &Clock,
        ctx: &mut sui::tx_context::TxContext
    ): Coin<T> {
        let settler = sui::tx_context::sender(ctx);
        let current_timestamp = clock::timestamp_ms(clock);
        
        // Validate settlement conditions
        if (vault.beneficiary != @0x0) {
            assert!(settler == vault.beneficiary, E_UNAUTHORIZED_BENEFICIARY);
        };
        assert!(vault.settlement_status == STATUS_ACTIVE, E_VAULT_ALREADY_SETTLED);
        assert!(!temporal_constraint::has_expired(vault.temporal_deadline, clock), E_TEMPORAL_WINDOW_EXPIRED);
        assert!(cryptographic_proof::verify_proof(cryptographic_proof, vault.cryptographic_commitment), E_INVALID_CRYPTOGRAPHIC_PROOF);
        
        // Check if proof already consumed for first settlement
        if (std::vector::is_empty(&vault.revealed_proof)) {
            assert!(!table::contains(&registry.consumed_proofs, cryptographic_proof), E_PROOF_ALREADY_CONSUMED);
            vault.revealed_proof = cryptographic_proof;
            table::add(&mut registry.consumed_proofs, cryptographic_proof, true);
        } else {
            assert!(vault.revealed_proof == cryptographic_proof, E_INVALID_CRYPTOGRAPHIC_PROOF);
        };
        
        assert!(settlement_amount > 0, E_INVALID_SETTLEMENT_AMOUNT);
        assert!(settlement_amount <= vault.available_balance, E_INSUFFICIENT_VAULT_BALANCE);
        
        // Update vault state
        vault.available_balance = vault.available_balance - settlement_amount;
        
        // Record settlement
        let settlement_record = SettlementRecord {
            settler,
            amount: settlement_amount,
            timestamp: current_timestamp,
            proof_hash: sui::hash::keccak256(&cryptographic_proof),
        };
        std::vector::push_back(&mut vault.settlement_history, settlement_record);
        
        // Check if fully settled
        let is_fully_settled = vault.available_balance == 0;
        if (is_fully_settled) {
            vault.settlement_status = STATUS_SETTLED;
            registry.total_settlements = registry.total_settlements + 1;
        };
        
        // Extract settlement amount
        let settlement_coin = coin::from_balance(balance::split(&mut vault.asset_reserve, settlement_amount), ctx);
        
        // Emit appropriate event
        if (is_fully_settled) {
            event::emit(VaultFullySettled {
                vault_id: vault.vault_id,
                object_id: sui::object::uid_to_inner(&vault.id),
                final_settler: settler,
                total_settled: vault.total_deposit,
                cryptographic_proof,
                cross_chain_reference: vault.cross_chain_reference,
            });
        } else {
            event::emit(VaultPartiallySettled {
                vault_id: vault.vault_id,
                object_id: sui::object::uid_to_inner(&vault.id),
                settler,
                settlement_amount,
                remaining_balance: vault.available_balance,
                cryptographic_proof,
                cross_chain_reference: vault.cross_chain_reference,
            });
        };

        settlement_coin
    }
    
    // Settle vault completely (remaining balance)
    public fun settle_vault_complete<T>(
        vault: &mut AtomicSwapVault<T>,
        registry: &mut ConsumedProofRegistry,
        cryptographic_proof: vector<u8>,
        clock: &Clock,
        ctx: &mut sui::tx_context::TxContext
    ): Coin<T> {
        assert!(vault.available_balance > 0, E_VAULT_ALREADY_SETTLED);
        
        let remaining_balance = vault.available_balance;
        settle_vault_partial(vault, registry, remaining_balance, cryptographic_proof, clock, ctx)
    }

    // Refund vault after expiration
    public fun refund_vault<T>(
        vault: &mut AtomicSwapVault<T>,
        clock: &Clock,
        ctx: &mut sui::tx_context::TxContext
    ): Coin<T> {
        let refunder = sui::tx_context::sender(ctx);
        
        assert!(refunder == vault.depositor, E_UNAUTHORIZED_DEPOSITOR);
        assert!(vault.settlement_status == STATUS_ACTIVE, E_VAULT_ALREADY_SETTLED);
        assert!(temporal_constraint::has_expired(vault.temporal_deadline, clock), E_TEMPORAL_CONSTRAINT_ACTIVE);
        
        let refund_amount = vault.available_balance;
        vault.settlement_status = STATUS_REFUNDED;
        vault.available_balance = 0;
        
        let refund_coin = coin::from_balance(balance::withdraw_all(&mut vault.asset_reserve), ctx);
        
        event::emit(VaultRefunded {
            vault_id: vault.vault_id,
            object_id: sui::object::uid_to_inner(&vault.id),
            depositor: refunder,
            refund_amount,
            cross_chain_reference: vault.cross_chain_reference,
        });

        refund_coin
    }

    // Verify cryptographic proof
    public fun verify_proof(preimage: vector<u8>, commitment: vector<u8>): bool {
        cryptographic_proof::verify_proof(preimage, commitment)
    }

    // Create cryptographic commitment
    public fun create_commitment(preimage: vector<u8>): vector<u8> {
        cryptographic_proof::create_commitment(preimage)
    }

    // Get comprehensive vault information
    public fun get_vault_info<T>(vault: &AtomicSwapVault<T>): (
        u64, address, address, u64, u64, vector<u8>, u64, u8, u64, String
    ) {
        (
            vault.vault_id,
            vault.depositor,
            vault.beneficiary,
            vault.total_deposit,
            vault.available_balance,
            vault.cryptographic_commitment,
            vault.temporal_deadline,
            vault.settlement_status,
            vault.creation_timestamp,
            vault.cross_chain_reference
        )
    }
    
    // Get available balance
    public fun get_available_balance<T>(vault: &AtomicSwapVault<T>): u64 {
        vault.available_balance
    }

    // Check if vault has expired
    public fun has_expired<T>(vault: &AtomicSwapVault<T>, clock: &Clock): bool {
        temporal_constraint::has_expired(vault.temporal_deadline, clock)
    }

    // Check if vault can be settled
    public fun can_settle<T>(vault: &AtomicSwapVault<T>, clock: &Clock): bool {
        vault.settlement_status == STATUS_ACTIVE && temporal_constraint::is_active(vault.temporal_deadline, clock)
    }

    // Get revealed cryptographic proof
    public fun get_revealed_proof<T>(vault: &AtomicSwapVault<T>): vector<u8> {
        vault.revealed_proof
    }

    // Get settlement history
    public fun get_settlement_history<T>(vault: &AtomicSwapVault<T>): vector<SettlementRecord> {
        vault.settlement_history
    }

    // Check if proof is consumed
    public fun is_proof_consumed(registry: &ConsumedProofRegistry, proof: &vector<u8>): bool {
        table::contains(&registry.consumed_proofs, *proof)
    }

    // Get registry statistics
    public fun get_registry_stats(registry: &ConsumedProofRegistry): (u64, u64) {
        (registry.vault_counter, registry.total_settlements)
    }

    // Batch create commitments (utility function)
    public fun batch_create_commitments(preimages: vector<vector<u8>>): vector<vector<u8>> {
        cryptographic_proof::batch_create_commitments(preimages)
    }

    // Get vault status constants
    public fun get_status_active(): u8 { STATUS_ACTIVE }
    public fun get_status_settled(): u8 { STATUS_SETTLED }
    public fun get_status_refunded(): u8 { STATUS_REFUNDED }
    public fun get_status_expired(): u8 { STATUS_EXPIRED }
}