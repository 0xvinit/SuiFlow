/// Advanced atomic swap vault example
/// Demonstrates usage of the enhanced vault system for cross-chain transactions
module fusion_plus_crosschain::escrow_example {
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::clock::{Clock};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use std::string;
    use std::vector;
    use fusion_plus_crosschain::cross_chain_escrow::{Self as vault_manager, AtomicSwapVault, ConsumedProofRegistry};
    use fusion_plus_crosschain::cryptographic_proof;
    use fusion_plus_crosschain::temporal_constraint;

    /// Example: Create a secure atomic swap vault
    public entry fun create_secure_vault(
        coin: Coin<SUI>,
        beneficiary: address,
        preimage: vector<u8>,
        clock: &Clock,
        registry: &mut ConsumedProofRegistry,
        ctx: &mut TxContext
    ) {
        let cryptographic_commitment = cryptographic_proof::create_commitment(preimage);
        let temporal_deadline = temporal_constraint::create_deadline(
            temporal_constraint::get_standard_duration(),
            clock
        );
        let cross_chain_reference = string::utf8(b"example_vault_reference");
        
        vault_manager::create_and_share_vault<SUI>(
            coin,
            beneficiary,
            cryptographic_commitment,
            temporal_deadline,
            cross_chain_reference,
            registry,
            clock,
            ctx
        );
    }
    
    /// Example: Settle vault with cryptographic proof
    public entry fun settle_vault_example(
        vault: &mut AtomicSwapVault<SUI>,
        registry: &mut ConsumedProofRegistry,
        cryptographic_proof: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let settlement_coin = vault_manager::settle_vault_complete(
            vault,
            registry,
            cryptographic_proof,
            clock,
            ctx
        );
        
        // Transfer the settlement to the caller
        let settler = tx_context::sender(ctx);
        transfer::public_transfer(settlement_coin, settler);
    }

    /// Example: Partial settlement of vault
    public entry fun partial_settle_vault(
        vault: &mut AtomicSwapVault<SUI>,
        registry: &mut ConsumedProofRegistry,
        settlement_amount: u64,
        cryptographic_proof: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let partial_coin = vault_manager::settle_vault_partial(
            vault,
            registry,
            settlement_amount,
            cryptographic_proof,
            clock,
            ctx
        );
        
        // Transfer the partial settlement to the caller
        let settler = tx_context::sender(ctx);
        transfer::public_transfer(partial_coin, settler);
    }
    
    /// Example: Refund expired vault
    public entry fun refund_expired_vault(
        vault: &mut AtomicSwapVault<SUI>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let refund_coin = vault_manager::refund_vault(
            vault,
            clock,
            ctx
        );
        
        // Transfer refund back to the depositor
        let depositor = tx_context::sender(ctx);
        transfer::public_transfer(refund_coin, depositor);
    }
    
    /// Example: Create multiple vaults with batch commitments
    public entry fun create_batch_vaults(
        mut coins: vector<Coin<SUI>>,
        beneficiary: address,
        preimages: vector<vector<u8>>,
        clock: &Clock,
        registry: &mut ConsumedProofRegistry,
        ctx: &mut TxContext
    ) {
        let commitments = cryptographic_proof::batch_create_commitments(preimages);
        let temporal_deadline = temporal_constraint::create_deadline(
            temporal_constraint::get_extended_duration(),
            clock
        );
        
        let mut i = 0;
        let len = vector::length(&coins);
        while (i < len) {
            let coin = vector::pop_back(&mut coins);
            let commitment = *vector::borrow(&commitments, i);
            let cross_chain_reference = string::utf8(b"batch_vault_");
            
            vault_manager::create_and_share_vault<SUI>(
                coin,
                beneficiary,
                commitment,
                temporal_deadline,
                cross_chain_reference,
                registry,
                clock,
                ctx
            );
            
            i = i + 1;
        };
        
        // Destroy the empty vector
        vector::destroy_empty(coins);
    }
    
    /// Example: Comprehensive vault status check
    public fun check_vault_status<T>(
        vault: &AtomicSwapVault<T>,
        clock: &Clock
    ): (bool, bool, u8, u64) {
        let has_expired = vault_manager::has_expired(vault, clock);
        let can_settle = vault_manager::can_settle(vault, clock);
        let available_balance = vault_manager::get_available_balance(vault);
        
        let (_, _, _, _, _, _, _, status, _, _) = vault_manager::get_vault_info(vault);
        
        (has_expired, can_settle, status, available_balance)
    }

    /// Example: Advanced vault with temporal configuration
    public entry fun create_advanced_vault(
        coin: Coin<SUI>,
        beneficiary: address,
        preimage: vector<u8>,
        duration_hours: u64,
        clock: &Clock,
        registry: &mut ConsumedProofRegistry,
        ctx: &mut TxContext
    ) {
        let cryptographic_commitment = cryptographic_proof::create_commitment(preimage);
        let custom_duration = duration_hours * 3600000; // Convert hours to milliseconds
        let temporal_deadline = temporal_constraint::create_deadline(custom_duration, clock);
        let cross_chain_reference = string::utf8(b"advanced_vault_with_custom_duration");
        
        vault_manager::create_and_share_vault<SUI>(
            coin,
            beneficiary,
            cryptographic_commitment,
            temporal_deadline,
            cross_chain_reference,
            registry,
            clock,
            ctx
        );
    }

    /// Example: Verify cryptographic proof before settlement
    public fun verify_proof_example(
        preimage: vector<u8>,
        commitment: vector<u8>
    ): bool {
        vault_manager::verify_proof(preimage, commitment)
    }

    /// Example: Get vault settlement history
    public fun get_vault_settlement_info<T>(
        vault: &AtomicSwapVault<T>
    ): (vector<u8>, vector<fusion_plus_crosschain::cross_chain_escrow::SettlementRecord>) {
        let revealed_proof = vault_manager::get_revealed_proof(vault);
        let settlement_history = vault_manager::get_settlement_history(vault);
        
        (revealed_proof, settlement_history)
    }

    /// Example: Check registry statistics
    public fun get_registry_info(registry: &ConsumedProofRegistry): (u64, u64) {
        vault_manager::get_registry_stats(registry)
    }
}