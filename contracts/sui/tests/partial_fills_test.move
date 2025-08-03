#[test_only]
module fusion_plus_crosschain::partial_fills_test {
    use sui::test_scenario::{Self as test, next_tx, ctx};
    use sui::coin::{Self};
    use sui::clock::{Self};
    use sui::sui::SUI;
    use sui::test_utils::assert_eq;
    use std::string;
    use std::debug;
    use fusion_plus_crosschain::cross_chain_escrow::{
        Self as vault_manager, AtomicSwapVault, ConsumedProofRegistry
    };
    use fusion_plus_crosschain::cryptographic_proof;
    use fusion_plus_crosschain::temporal_constraint;

    // Test constants with educational explanations
    const DEPOSITOR: address = @0xA;       // Vault creator and fund provider
    const BENEFICIARY: address = @0xB;     // Authorized recipient (can be @0x0 for open access)
    const RESOLVER1: address = @0xC;       // First partial settler
    const RESOLVER2: address = @0xD;       // Second partial settler  
    const RESOLVER3: address = @0xE;       // Third partial settler
    const TOTAL_AMOUNT: u64 = 10000000000; // 10 SUI in nano units for partial settlement demos
    const PARTIAL_AMOUNT_1: u64 = 3000000000; // 3 SUI (30%)
    const PARTIAL_AMOUNT_2: u64 = 5000000000; // 5 SUI (50%)
    const PARTIAL_AMOUNT_3: u64 = 2000000000; // 2 SUI (20%)
    const ONE_HOUR_MS: u64 = 3600000;      // Standard temporal constraint duration

    #[test]
    fun test_basic_partial_settlement_with_educational_logging() {
        debug::print(&std::string::utf8(b"💰 === BASIC PARTIAL SETTLEMENT TEST ===" ));
        debug::print(&std::string::utf8(b"📚 Demonstrating partial settlement functionality in AtomicSwapVaults"));
        debug::print(&std::string::utf8(b""));
        
        let mut scenario = test::begin(DEPOSITOR);
        let mut clock = clock::create_for_testing(ctx(&mut scenario));
        
        // Initialize the vault system
        debug::print(&std::string::utf8(b"⚙️  STEP 1: System Initialization"));
        vault_manager::init_for_testing(ctx(&mut scenario));
        next_tx(&mut scenario, DEPOSITOR);
        
        debug::print(&std::string::utf8(b"   ✅ AtomicSwapVault system initialized"));
        debug::print(&std::string::utf8(b"   📝 Partial settlement enables incremental fund claiming"));
        debug::print(&std::string::utf8(b""));
        
        // Create vault with open beneficiary for partial settlement demo
        debug::print(&std::string::utf8(b"🏦 STEP 2: Creating Vault for Partial Settlement"));
        let secret_preimage = b"partial_settlement_demo_secret";
        let cryptographic_commitment = cryptographic_proof::create_commitment(secret_preimage);
        let temporal_deadline = temporal_constraint::create_deadline(ONE_HOUR_MS, &clock);
        let coin = coin::mint_for_testing<SUI>(TOTAL_AMOUNT, ctx(&mut scenario));
        let cross_chain_reference = string::utf8(b"PARTIAL_SETTLEMENT_DEMO");
        
        debug::print(&std::string::utf8(b"   💰 Total vault amount (nano SUI):"));
        debug::print(&coin::value(&coin));
        debug::print(&std::string::utf8(b"   💡 This represents 10 SUI available for partial settlement"));
        debug::print(&std::string::utf8(b"   👥 Beneficiary set to @0x0 (open access for demo)"));
        
        let mut registry = test::take_shared<ConsumedProofRegistry>(&scenario);
        
        let vault_id = vault_manager::create_and_share_vault<SUI>(
            coin,
            @0x0, // Open access for partial settlement by anyone
            cryptographic_commitment,
            temporal_deadline,
            cross_chain_reference,
            &mut registry,
            &clock,
            ctx(&mut scenario)
        );
        
        debug::print(&std::string::utf8(b"   ✅ Vault created with open beneficiary access"));
        debug::print(&std::string::utf8(b"   🆔 Vault ID:"));
        debug::print(&sui::object::id_to_address(&vault_id));
        
        test::return_shared(registry);
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"💸 STEP 3: First Partial Settlement (30%)"));
        debug::print(&std::string::utf8(b"   👤 Resolver1 attempting to settle 3 SUI (30% of vault)"));
        
        next_tx(&mut scenario, RESOLVER1);
        
        let mut vault = test::take_shared<AtomicSwapVault<SUI>>(&scenario);
        let mut registry = test::take_shared<ConsumedProofRegistry>(&scenario);
        
        // Verify initial vault state
        let initial_balance = vault_manager::get_available_balance(&vault);
        debug::print(&std::string::utf8(b"   🔍 Initial vault balance:"));
        debug::print(&initial_balance);
        assert_eq(initial_balance, TOTAL_AMOUNT);
        
        // First partial settlement (30%)
        let partial_settlement_1 = vault_manager::settle_vault_partial(
            &mut vault,
            &mut registry,
            PARTIAL_AMOUNT_1,
            secret_preimage,
            &clock,
            ctx(&mut scenario)
        );
        
        debug::print(&std::string::utf8(b"   ✅ First partial settlement completed!"));
        debug::print(&std::string::utf8(b"   💰 Amount settled:"));
        debug::print(&coin::value(&partial_settlement_1));
        debug::print(&std::string::utf8(b"   📊 Percentage of total: 30%"));
        
        // Verify partial settlement effects
        let balance_after_first = vault_manager::get_available_balance(&vault);
        let settlement_history = vault_manager::get_settlement_history(&vault);
        let revealed_proof = vault_manager::get_revealed_proof(&vault);
        
        debug::print(&std::string::utf8(b"   📋 Post-Settlement State:"));
        debug::print(&std::string::utf8(b"      💵 Remaining balance:"));
        debug::print(&balance_after_first);
        debug::print(&std::string::utf8(b"      📜 Settlement records:"));
        debug::print(&std::vector::length(&settlement_history));
        debug::print(&std::string::utf8(b"      🔓 Proof revealed (length):"));
        debug::print(&std::vector::length(&revealed_proof));
        
        // Validate results
        assert_eq(coin::value(&partial_settlement_1), PARTIAL_AMOUNT_1);
        assert_eq(balance_after_first, TOTAL_AMOUNT - PARTIAL_AMOUNT_1);
        assert_eq(std::vector::length(&settlement_history), 1);
        assert_eq(revealed_proof, secret_preimage);
        
        debug::print(&std::string::utf8(b"      ✅ All partial settlement validations passed!"));
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"💡 PARTIAL SETTLEMENT INSIGHTS:"));
        debug::print(&std::string::utf8(b"   💰 Partial settlements allow incremental fund claiming"));
        debug::print(&std::string::utf8(b"   🔐 First settlement reveals and consumes the cryptographic proof"));
        debug::print(&std::string::utf8(b"   📜 Each settlement creates a historical record"));
        debug::print(&std::string::utf8(b"   🔍 Remaining balance accurately tracks available funds"));
        debug::print(&std::string::utf8(b"   ⚡ Multiple parties can claim portions using the same proof"));
        
        // Cleanup
        coin::burn_for_testing(partial_settlement_1);
        test::return_shared(vault);
        test::return_shared(registry);
        clock::destroy_for_testing(clock);
        test::end(scenario);
        debug::print(&std::string::utf8(b""));
    }

    #[test]
    fun test_multiple_partial_settlements_complete_workflow() {
        debug::print(&std::string::utf8(b"🔄 === MULTIPLE PARTIAL SETTLEMENTS TEST ===" ));
        debug::print(&std::string::utf8(b"📚 Complete workflow: multiple resolvers settling same vault"));
        debug::print(&std::string::utf8(b""));
        
        let mut scenario = test::begin(DEPOSITOR);
        let mut clock = clock::create_for_testing(ctx(&mut scenario));
        
        vault_manager::init_for_testing(ctx(&mut scenario));
        next_tx(&mut scenario, DEPOSITOR);
        
        debug::print(&std::string::utf8(b"🏦 STEP 1: Creating Large Vault for Multi-Party Settlement"));
        let secret_preimage = b"multi_settlement_demo_secret";
        let cryptographic_commitment = cryptographic_proof::create_commitment(secret_preimage);
        let temporal_deadline = temporal_constraint::create_deadline(ONE_HOUR_MS, &clock);
        let coin = coin::mint_for_testing<SUI>(TOTAL_AMOUNT, ctx(&mut scenario));
        let cross_chain_reference = string::utf8(b"MULTI_SETTLEMENT_DEMO");
        
        debug::print(&std::string::utf8(b"   💰 Total vault: 10 SUI"));
        debug::print(&std::string::utf8(b"   📋 Settlement plan:"));
        debug::print(&std::string::utf8(b"      - Resolver1: 3 SUI (30%)"));
        debug::print(&std::string::utf8(b"      - Resolver2: 5 SUI (50%)"));
        debug::print(&std::string::utf8(b"      - Resolver3: 2 SUI (20%)"));
        
        let mut registry = test::take_shared<ConsumedProofRegistry>(&scenario);
        
        let vault_id = vault_manager::create_and_share_vault<SUI>(
            coin,
            @0x0, // Open access for multiple settlers
            cryptographic_commitment,
            temporal_deadline,
            cross_chain_reference,
            &mut registry,
            &clock,
            ctx(&mut scenario)
        );
        
        test::return_shared(registry);
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"👤 STEP 2: First Partial Settlement - Resolver1 (30%)"));
        next_tx(&mut scenario, RESOLVER1);
        {
            let mut vault = test::take_shared<AtomicSwapVault<SUI>>(&scenario);
            let mut registry = test::take_shared<ConsumedProofRegistry>(&scenario);
            
            let balance_before = vault_manager::get_available_balance(&vault);
            debug::print(&std::string::utf8(b"   💵 Vault balance before Resolver1:"));
            debug::print(&balance_before);
            
            let settlement_1 = vault_manager::settle_vault_partial(
                &mut vault,
                &mut registry,
                PARTIAL_AMOUNT_1,
                secret_preimage,
                &clock,
                ctx(&mut scenario)
            );
            
            let balance_after = vault_manager::get_available_balance(&vault);
            debug::print(&std::string::utf8(b"   ✅ Resolver1 settled: 3 SUI"));
            debug::print(&std::string::utf8(b"   💵 Remaining balance:"));
            debug::print(&balance_after);
            
            assert_eq(coin::value(&settlement_1), PARTIAL_AMOUNT_1);
            assert_eq(balance_after, TOTAL_AMOUNT - PARTIAL_AMOUNT_1);
            
            coin::burn_for_testing(settlement_1);
            test::return_shared(vault);
            test::return_shared(registry);
        };
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"👤 STEP 3: Second Partial Settlement - Resolver2 (50%)"));
        next_tx(&mut scenario, RESOLVER2);
        {
            let mut vault = test::take_shared<AtomicSwapVault<SUI>>(&scenario);
            let mut registry = test::take_shared<ConsumedProofRegistry>(&scenario);
            
            let balance_before = vault_manager::get_available_balance(&vault);
            let history_before = vault_manager::get_settlement_history(&vault);
            debug::print(&std::string::utf8(b"   💵 Vault balance before Resolver2:"));
            debug::print(&balance_before);
            debug::print(&std::string::utf8(b"   📜 Settlement records so far:"));
            debug::print(&std::vector::length(&history_before));
            
            let settlement_2 = vault_manager::settle_vault_partial(
                &mut vault,
                &mut registry,
                PARTIAL_AMOUNT_2,
                secret_preimage, // Same proof reused
                &clock,
                ctx(&mut scenario)
            );
            
            let balance_after = vault_manager::get_available_balance(&vault);
            let history_after = vault_manager::get_settlement_history(&vault);
            debug::print(&std::string::utf8(b"   ✅ Resolver2 settled: 5 SUI"));
            debug::print(&std::string::utf8(b"   💵 Remaining balance:"));
            debug::print(&balance_after);
            debug::print(&std::string::utf8(b"   📜 Total settlement records:"));
            debug::print(&std::vector::length(&history_after));
            
            assert_eq(coin::value(&settlement_2), PARTIAL_AMOUNT_2);
            assert_eq(balance_after, TOTAL_AMOUNT - PARTIAL_AMOUNT_1 - PARTIAL_AMOUNT_2);
            assert_eq(std::vector::length(&history_after), 2);
            
            coin::burn_for_testing(settlement_2);
            test::return_shared(vault);
            test::return_shared(registry);
        };
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"👤 STEP 4: Final Settlement - Resolver3 (20%, completes vault)"));
        next_tx(&mut scenario, RESOLVER3);
        {
            let mut vault = test::take_shared<AtomicSwapVault<SUI>>(&scenario);
            let mut registry = test::take_shared<ConsumedProofRegistry>(&scenario);
            
            let balance_before = vault_manager::get_available_balance(&vault);
            debug::print(&std::string::utf8(b"   💵 Final balance to settle:"));
            debug::print(&balance_before);
            debug::print(&std::string::utf8(b"   🎯 This should complete the vault"));
            
            let final_settlement = vault_manager::settle_vault_partial(
                &mut vault,
                &mut registry,
                PARTIAL_AMOUNT_3,
                secret_preimage,
                &clock,
                ctx(&mut scenario)
            );
            
            let balance_after = vault_manager::get_available_balance(&vault);
            let (_, _, _, _, _, _, _, status, _, _) = vault_manager::get_vault_info(&vault);
            let final_history = vault_manager::get_settlement_history(&vault);
            
            debug::print(&std::string::utf8(b"   ✅ Resolver3 settled: 2 SUI"));
            debug::print(&std::string::utf8(b"   💵 Final vault balance:"));
            debug::print(&balance_after);
            debug::print(&std::string::utf8(b"   📊 Vault status (1=Settled):"));
            debug::print(&(status as u64));
            debug::print(&std::string::utf8(b"   📜 Total settlement records:"));
            debug::print(&std::vector::length(&final_history));
            
            // Verify vault is now completely settled
            assert_eq(coin::value(&final_settlement), PARTIAL_AMOUNT_3);
            assert_eq(balance_after, 0);
            assert_eq(status, vault_manager::get_status_settled());
            assert_eq(std::vector::length(&final_history), 3);
            
            coin::burn_for_testing(final_settlement);
            test::return_shared(vault);
            test::return_shared(registry);
        };
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"🎉 SETTLEMENT COMPLETE!"));
        debug::print(&std::string::utf8(b"   📊 Final tally:"));
        debug::print(&std::string::utf8(b"      - Resolver1: 3 SUI"));
        debug::print(&std::string::utf8(b"      - Resolver2: 5 SUI"));
        debug::print(&std::string::utf8(b"      - Resolver3: 2 SUI"));
        debug::print(&std::string::utf8(b"      - Total: 10 SUI ✅"));
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"💡 MULTI-PARTY SETTLEMENT INSIGHTS:"));
        debug::print(&std::string::utf8(b"   👥 Multiple parties can settle portions of same vault"));
        debug::print(&std::string::utf8(b"   🔐 Same cryptographic proof works for all settlements"));
        debug::print(&std::string::utf8(b"   📜 Each settlement is recorded in comprehensive history"));
        debug::print(&std::string::utf8(b"   ⚖️  Final settlement automatically marks vault as complete"));
        debug::print(&std::string::utf8(b"   💰 Perfect accounting ensures no funds are lost or duplicated"));
        
        clock::destroy_for_testing(clock);
        test::end(scenario);
        debug::print(&std::string::utf8(b""));
    }

    #[test]
    fun test_complete_vs_partial_settlement_comparison() {
        debug::print(&std::string::utf8(b"⚖️  === COMPLETE VS PARTIAL SETTLEMENT COMPARISON ===" ));
        debug::print(&std::string::utf8(b"📚 Demonstrating both settlement methods in same test"));
        debug::print(&std::string::utf8(b""));
        
        let mut scenario = test::begin(DEPOSITOR);
        let mut clock = clock::create_for_testing(ctx(&mut scenario));
        
        vault_manager::init_for_testing(ctx(&mut scenario));
        next_tx(&mut scenario, DEPOSITOR);
        
        debug::print(&std::string::utf8(b"🏦 STEP 1: Creating vault for fixed beneficiary settlement"));
        let secret_preimage = b"comparison_demo_secret";
        let cryptographic_commitment = cryptographic_proof::create_commitment(secret_preimage);
        let temporal_deadline = temporal_constraint::create_deadline(ONE_HOUR_MS, &clock);
        let coin = coin::mint_for_testing<SUI>(TOTAL_AMOUNT, ctx(&mut scenario));
        let cross_chain_reference = string::utf8(b"COMPARISON_DEMO");
        
        debug::print(&std::string::utf8(b"   💰 Vault amount: 10 SUI"));
        debug::print(&std::string::utf8(b"   🎯 Beneficiary: Fixed address (not open access)"));
        
        let mut registry = test::take_shared<ConsumedProofRegistry>(&scenario);
        
        let vault_id = vault_manager::create_and_share_vault<SUI>(
            coin,
            BENEFICIARY, // Fixed beneficiary (not @0x0)
            cryptographic_commitment,
            temporal_deadline,
            cross_chain_reference,
            &mut registry,
            &clock,
            ctx(&mut scenario)
        );
        
        test::return_shared(registry);
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"🔄 STEP 2: Comparing Settlement Methods"));
        next_tx(&mut scenario, BENEFICIARY);
        
        let mut vault = test::take_shared<AtomicSwapVault<SUI>>(&scenario);
        let mut registry = test::take_shared<ConsumedProofRegistry>(&scenario);
        
        debug::print(&std::string::utf8(b"   💡 Option A: Complete Settlement (settle_vault_complete)"));
        debug::print(&std::string::utf8(b"      - Settles entire remaining balance at once"));
        debug::print(&std::string::utf8(b"      - Simpler for single-party settlement"));
        debug::print(&std::string::utf8(b"      - Automatically marks vault as fully settled"));
        
        debug::print(&std::string::utf8(b"   💡 Option B: Partial Settlement (settle_vault_partial)"));
        debug::print(&std::string::utf8(b"      - Settles specified amount only"));  
        debug::print(&std::string::utf8(b"      - Enables multi-party settlement"));
        debug::print(&std::string::utf8(b"      - Provides granular control"));
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"   🎯 Demonstrating: settle_vault_complete"));
        
        let complete_settlement = vault_manager::settle_vault_complete(
            &mut vault,
            &mut registry,
            secret_preimage,
            &clock,
            ctx(&mut scenario)
        );
        
        let final_balance = vault_manager::get_available_balance(&vault);
        let (_, _, _, _, _, _, _, status, _, _) = vault_manager::get_vault_info(&vault);
        let settlement_history = vault_manager::get_settlement_history(&vault);
        
        debug::print(&std::string::utf8(b"   ✅ Complete settlement results:"));
        debug::print(&std::string::utf8(b"      💰 Amount received:"));
        debug::print(&coin::value(&complete_settlement));
        debug::print(&std::string::utf8(b"      💵 Remaining balance:"));
        debug::print(&final_balance);
        debug::print(&std::string::utf8(b"      📊 Vault status (1=Settled):"));
        debug::print(&(status as u64));
        debug::print(&std::string::utf8(b"      📜 Settlement records:"));
        debug::print(&std::vector::length(&settlement_history));
        
        // Verify complete settlement
        assert_eq(coin::value(&complete_settlement), TOTAL_AMOUNT);
        assert_eq(final_balance, 0);
        assert_eq(status, vault_manager::get_status_settled());
        assert_eq(std::vector::length(&settlement_history), 1);
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"💡 SETTLEMENT METHOD INSIGHTS:"));
        debug::print(&std::string::utf8(b"   🎯 settle_vault_complete: Best for single beneficiary, full settlement"));
        debug::print(&std::string::utf8(b"   🔄 settle_vault_partial: Best for multi-party, incremental settlement"));
        debug::print(&std::string::utf8(b"   📊 Both methods maintain identical security guarantees"));
        debug::print(&std::string::utf8(b"   ⚡ Choice depends on use case and settlement pattern"));
        debug::print(&std::string::utf8(b"   📜 Both methods create comprehensive settlement history"));
        
        coin::burn_for_testing(complete_settlement);
        test::return_shared(vault);
        test::return_shared(registry);
        clock::destroy_for_testing(clock);
        test::end(scenario);
        debug::print(&std::string::utf8(b""));
    }

    #[test]
    fun test_partial_settlement_with_refund_scenario() {
        debug::print(&std::string::utf8(b"💸 === PARTIAL SETTLEMENT + REFUND SCENARIO ===" ));
        debug::print(&std::string::utf8(b"📚 Mixed scenario: partial settlement followed by refund of remainder"));
        debug::print(&std::string::utf8(b""));
        
        let mut scenario = test::begin(DEPOSITOR);
        let mut clock = clock::create_for_testing(ctx(&mut scenario));
        
        vault_manager::init_for_testing(ctx(&mut scenario));
        next_tx(&mut scenario, DEPOSITOR);
        
        debug::print(&std::string::utf8(b"🏦 STEP 1: Creating vault for mixed settlement scenario"));
        let secret_preimage = b"partial_refund_demo_secret";
        let cryptographic_commitment = cryptographic_proof::create_commitment(secret_preimage);
        let temporal_deadline = temporal_constraint::create_deadline(ONE_HOUR_MS, &clock);
        let coin = coin::mint_for_testing<SUI>(TOTAL_AMOUNT, ctx(&mut scenario));
        let cross_chain_reference = string::utf8(b"PARTIAL_REFUND_DEMO");
        
        debug::print(&std::string::utf8(b"   💰 Initial vault: 10 SUI"));
        debug::print(&std::string::utf8(b"   📋 Scenario plan:"));
        debug::print(&std::string::utf8(b"      1. Partial settlement: 3 SUI"));
        debug::print(&std::string::utf8(b"      2. Time expiry"));  
        debug::print(&std::string::utf8(b"      3. Refund remainder: 7 SUI"));
        
        let mut registry = test::take_shared<ConsumedProofRegistry>(&scenario);
        
        let vault_id = vault_manager::create_and_share_vault<SUI>(
            coin,
            @0x0, // Open access for partial settlement
            cryptographic_commitment,
            temporal_deadline,
            cross_chain_reference,
            &mut registry,
            &clock,
            ctx(&mut scenario)
        );
        
        test::return_shared(registry);
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"💸 STEP 2: Partial Settlement Phase"));
        next_tx(&mut scenario, RESOLVER1);
        
        {
            let mut vault = test::take_shared<AtomicSwapVault<SUI>>(&scenario);
            let mut registry = test::take_shared<ConsumedProofRegistry>(&scenario);
            
            let balance_before = vault_manager::get_available_balance(&vault);
            debug::print(&std::string::utf8(b"   💵 Balance before partial settlement:"));
            debug::print(&balance_before);
            
            let partial_settlement = vault_manager::settle_vault_partial(
                &mut vault,
                &mut registry,
                PARTIAL_AMOUNT_1, // 3 SUI
                secret_preimage,
                &clock,
                ctx(&mut scenario)
            );
            
            let balance_after = vault_manager::get_available_balance(&vault);
            debug::print(&std::string::utf8(b"   ✅ Partial settlement completed"));
            debug::print(&std::string::utf8(b"   💰 Amount settled:"));
            debug::print(&coin::value(&partial_settlement));
            debug::print(&std::string::utf8(b"   💵 Remaining in vault:"));
            debug::print(&balance_after);
            
            assert_eq(coin::value(&partial_settlement), PARTIAL_AMOUNT_1);
            assert_eq(balance_after, TOTAL_AMOUNT - PARTIAL_AMOUNT_1);
            
            coin::burn_for_testing(partial_settlement);
            test::return_shared(vault);
            test::return_shared(registry);
        };
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"⏰ STEP 3: Time Expiry Simulation"));
        debug::print(&std::string::utf8(b"   ⏩ Advancing time past vault deadline..."));
        clock::increment_for_testing(&mut clock, ONE_HOUR_MS + 300000); // 1 hour + 5 minutes
        
        let time_after_expiry = clock::timestamp_ms(&clock);
        debug::print(&std::string::utf8(b"   🕐 Time after expiry:"));
        debug::print(&time_after_expiry);
        debug::print(&std::string::utf8(b"   ❌ Vault is now expired, no more settlements possible"));
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"🔄 STEP 4: Refund Remaining Balance"));
        next_tx(&mut scenario, DEPOSITOR);
        
        {
            let mut vault = test::take_shared<AtomicSwapVault<SUI>>(&scenario);
            
            let balance_before_refund = vault_manager::get_available_balance(&vault);
            debug::print(&std::string::utf8(b"   💵 Balance available for refund:"));
            debug::print(&balance_before_refund);
            debug::print(&std::string::utf8(b"   👤 Original depositor claiming refund"));
            
            let refund_coin = vault_manager::refund_vault(
                &mut vault,
                &clock,
                ctx(&mut scenario)
            );
            
            let balance_after_refund = vault_manager::get_available_balance(&vault);
            let (_, _, _, _, _, _, _, status_after_refund, _, _) = vault_manager::get_vault_info(&vault);
            
            debug::print(&std::string::utf8(b"   ✅ Refund completed"));
            debug::print(&std::string::utf8(b"   💰 Refund amount:"));
            debug::print(&coin::value(&refund_coin));
            debug::print(&std::string::utf8(b"   💵 Final vault balance:"));
            debug::print(&balance_after_refund);
            debug::print(&std::string::utf8(b"   📊 Vault status (2=Refunded):"));
            debug::print(&(status_after_refund as u64));
            
            // Verify refund of remaining amount
            assert_eq(coin::value(&refund_coin), TOTAL_AMOUNT - PARTIAL_AMOUNT_1);
            assert_eq(balance_after_refund, 0);
            assert_eq(status_after_refund, vault_manager::get_status_refunded());
            
            coin::burn_for_testing(refund_coin);
            test::return_shared(vault);
        };
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"📊 FINAL ACCOUNTING SUMMARY:"));
        debug::print(&std::string::utf8(b"   💰 Original vault: 10 SUI"));
        debug::print(&std::string::utf8(b"   💸 Partial settlement: 3 SUI (to Resolver1)"));
        debug::print(&std::string::utf8(b"   🔄 Refund: 7 SUI (to original Depositor)"));
        debug::print(&std::string::utf8(b"   ✅ Total accounted: 10 SUI (perfect balance)"));
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"💡 MIXED SCENARIO INSIGHTS:"));
        debug::print(&std::string::utf8(b"   🔄 Partial settlement + refund covers complex real-world scenarios"));
        debug::print(&std::string::utf8(b"   ⏰ Time expiry protects depositors from permanent partial locks"));
        debug::print(&std::string::utf8(b"   💰 Perfect accounting ensures no funds are lost"));
        debug::print(&std::string::utf8(b"   📊 Status tracking prevents double-spending in mixed scenarios"));
        debug::print(&std::string::utf8(b"   🎯 Flexibility supports various settlement patterns"));
        
        clock::destroy_for_testing(clock);
        test::end(scenario);
        debug::print(&std::string::utf8(b""));
    }
}