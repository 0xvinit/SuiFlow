#[test_only]
module fusion_plus_crosschain::example_test {
    use sui::test_scenario::{Self as test, next_tx, ctx};
    use sui::coin::{Self};
    use sui::clock::{Self};
    use sui::sui::SUI;
    use sui::test_utils::assert_eq;
    use std::string;
    use std::debug;
    use std::vector;
    use fusion_plus_crosschain::escrow_example;
    use fusion_plus_crosschain::cross_chain_escrow::{
        Self as vault_manager, AtomicSwapVault, ConsumedProofRegistry
    };
    use fusion_plus_crosschain::cryptographic_proof;
    use fusion_plus_crosschain::temporal_constraint;

    // Test constants with educational explanations
    const DEPOSITOR: address = @0xA;         // Original vault creator and fund provider
    const BENEFICIARY: address = @0xB;       // Authorized fund recipient
    const RESOLVER: address = @0xC;          // Third-party settlement resolver
    const AMOUNT: u64 = 1000000000;          // 1 SUI in nano SUI units
    const PARTIAL_AMOUNT: u64 = 300000000;   // 0.3 SUI for partial settlement demos
    const BATCH_SIZE: u8 = 3;                // Number of vaults for batch operations
    const ONE_HOUR_MS: u64 = 3600000;        // Standard temporal constraint duration

    #[test]
    fun test_create_secure_vault_with_comprehensive_workflow() {
        debug::print(&std::string::utf8(b"🔐 === SECURE VAULT CREATION TEST ===" ));
        debug::print(&std::string::utf8(b"📚 Comprehensive test of secure vault creation and settlement"));
        debug::print(&std::string::utf8(b""));
        
        let mut scenario = test::begin(DEPOSITOR);
        let mut clock = clock::create_for_testing(ctx(&mut scenario));
        
        // Initialize the vault system
        debug::print(&std::string::utf8(b"⚙️  STEP 1: System Initialization"));
        vault_manager::init_for_testing(ctx(&mut scenario));
        next_tx(&mut scenario, DEPOSITOR);
        
        debug::print(&std::string::utf8(b"   ✅ AtomicSwapVault system initialized"));
        debug::print(&std::string::utf8(b"   📝 ConsumedProofRegistry created for replay protection"));
        debug::print(&std::string::utf8(b""));
        
        // Create secure vault using escrow_example
        debug::print(&std::string::utf8(b"🏗️  STEP 2: Creating Secure Vault via Example Module"));
        let coin = coin::mint_for_testing<SUI>(AMOUNT, ctx(&mut scenario));
        let secret_preimage = b"secure_vault_demo_secret";
        
        debug::print(&std::string::utf8(b"   💰 Funding amount (nano SUI):"));
        debug::print(&coin::value(&coin));
        debug::print(&std::string::utf8(b"   🔑 Secret preimage length:"));
        debug::print(&std::vector::length(&secret_preimage));
        debug::print(&std::string::utf8(b"   👤 Beneficiary address: @0xB"));
        
        let mut registry = test::take_shared<ConsumedProofRegistry>(&scenario);
        
        // Create secure vault using the example function
        escrow_example::create_secure_vault(
            coin,
            BENEFICIARY,
            secret_preimage,
            &clock,
            &mut registry,
            ctx(&mut scenario)
        );
        
        debug::print(&std::string::utf8(b"   ✅ Secure vault created successfully using example module!"));
        debug::print(&std::string::utf8(b"   🌐 Vault is shared and accessible by multiple transactions"));
        
        let (vault_count, settlements_count) = escrow_example::get_registry_info(&registry);
        debug::print(&std::string::utf8(b"   📊 Registry stats after creation:"));
        debug::print(&std::string::utf8(b"      - Total vaults: "));
        debug::print(&vault_count);
        debug::print(&std::string::utf8(b"      - Total settlements: "));
        debug::print(&settlements_count);
        
        test::return_shared(registry);
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"🔍 STEP 3: Vault Status Verification"));
        next_tx(&mut scenario, BENEFICIARY);
        
        // Verify vault was created and check its status
        let mut vault = test::take_shared<AtomicSwapVault<SUI>>(&scenario);
        
        let (has_expired, can_settle, status, available_balance) = escrow_example::check_vault_status(&vault, &clock);
        
        debug::print(&std::string::utf8(b"   📋 Vault Status Check Results:"));
        debug::print(&std::string::utf8(b"      ❌ Has expired:"));
        debug::print(&(if (has_expired) { 1 } else { 0 }));
        debug::print(&std::string::utf8(b"      ✅ Can settle:"));
        debug::print(&(if (can_settle) { 1 } else { 0 }));
        debug::print(&std::string::utf8(b"      📊 Status code:"));
        debug::print(&(status as u64));
        debug::print(&std::string::utf8(b"      💰 Available balance:"));
        debug::print(&available_balance);
        
        // Validate status
        assert_eq(has_expired, false);
        assert_eq(can_settle, true);
        assert_eq(status, vault_manager::get_status_active());
        assert_eq(available_balance, AMOUNT);
        
        debug::print(&std::string::utf8(b"      ✅ All status checks passed!"));
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"💸 STEP 4: Complete Settlement via Example Module"));
        
        let mut registry = test::take_shared<ConsumedProofRegistry>(&scenario);
        
        debug::print(&std::string::utf8(b"   🔐 Beneficiary settling vault with cryptographic proof"));
        debug::print(&std::string::utf8(b"   📝 Using settle_vault_example function"));
        
        // Test proof verification first
        let cryptographic_commitment = cryptographic_proof::create_commitment(secret_preimage);
        let proof_valid = escrow_example::verify_proof_example(secret_preimage, cryptographic_commitment);
        debug::print(&std::string::utf8(b"   🧪 Proof verification result:"));
        debug::print(&(if (proof_valid) { 1 } else { 0 }));
        assert_eq(proof_valid, true);
        
        // Get settlement history before settlement
        let (revealed_proof_before, settlement_history_before) = escrow_example::get_vault_settlement_info(&vault);
        debug::print(&std::string::utf8(b"   📜 Pre-settlement state:"));
        debug::print(&std::string::utf8(b"      - Revealed proof length:"));
        debug::print(&std::vector::length(&revealed_proof_before));
        debug::print(&std::string::utf8(b"      - Settlement history count:"));
        debug::print(&std::vector::length(&settlement_history_before));
        
        // Settle using the example module
        escrow_example::settle_vault_example(
            &mut vault,
            &mut registry,
            secret_preimage,
            &clock,
            ctx(&mut scenario)
        );
        
        debug::print(&std::string::utf8(b"   ✅ Settlement completed via example module!"));
        
        // Verify settlement effects
        let final_balance = vault_manager::get_available_balance(&vault);
        let (revealed_proof_after, settlement_history_after) = escrow_example::get_vault_settlement_info(&vault);
        let (_, final_settlements) = escrow_example::get_registry_info(&registry);
        
        debug::print(&std::string::utf8(b"   📊 Post-settlement state:"));
        debug::print(&std::string::utf8(b"      💰 Final vault balance:"));
        debug::print(&final_balance);
        debug::print(&std::string::utf8(b"      🔓 Revealed proof length:"));
        debug::print(&std::vector::length(&revealed_proof_after));
        debug::print(&std::string::utf8(b"      📜 Settlement records:"));
        debug::print(&std::vector::length(&settlement_history_after));
        debug::print(&std::string::utf8(b"      🎯 Total registry settlements:"));
        debug::print(&final_settlements);
        
        assert_eq(final_balance, 0);
        assert_eq(revealed_proof_after, secret_preimage);
        assert_eq(std::vector::length(&settlement_history_after), 1);
        assert_eq(final_settlements, 1);
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"💡 SECURE VAULT CREATION INSIGHTS:"));
        debug::print(&std::string::utf8(b"   🔐 Example module provides user-friendly vault creation"));
        debug::print(&std::string::utf8(b"   ⚡ Standard temporal constraints ensure security"));
        debug::print(&std::string::utf8(b"   🔍 Comprehensive status checks enable real-time monitoring"));
        debug::print(&std::string::utf8(b"   💸 Settlement via example module transfers coins automatically"));
        debug::print(&std::string::utf8(b"   📊 Registry tracking provides system-wide statistics"));
        
        test::return_shared(vault);
        test::return_shared(registry);
        clock::destroy_for_testing(clock);
        test::end(scenario);
        debug::print(&std::string::utf8(b""));
    }

    #[test]
    fun test_create_batch_vaults_with_detailed_tracking() {
        debug::print(&std::string::utf8(b"🏗️  === BATCH VAULT CREATION TEST ===" ));
        debug::print(&std::string::utf8(b"📚 Creating multiple vaults in batch with comprehensive tracking"));
        debug::print(&std::string::utf8(b""));
        
        let mut scenario = test::begin(DEPOSITOR);
        let mut clock = clock::create_for_testing(ctx(&mut scenario));
        
        // Initialize the vault system
        vault_manager::init_for_testing(ctx(&mut scenario));
        next_tx(&mut scenario, DEPOSITOR);
        
        debug::print(&std::string::utf8(b"💰 STEP 1: Preparing Batch Vault Data"));
        
        // Create multiple coins with different amounts
        let coin1 = coin::mint_for_testing<SUI>(AMOUNT, ctx(&mut scenario));
        let coin2 = coin::mint_for_testing<SUI>(AMOUNT * 2, ctx(&mut scenario));
        let coin3 = coin::mint_for_testing<SUI>(AMOUNT * 3, ctx(&mut scenario));
        let coins = vector[coin1, coin2, coin3];
        
        // Create multiple unique secrets
        let secret1 = b"batch_vault_secret_alpha";
        let secret2 = b"batch_vault_secret_beta";
        let secret3 = b"batch_vault_secret_gamma";
        let preimages = vector[secret1, secret2, secret3];
        
        debug::print(&std::string::utf8(b"   📊 Batch configuration:"));
        debug::print(&std::string::utf8(b"      - Vault 1: 1 SUI"));
        debug::print(&std::string::utf8(b"      - Vault 2: 2 SUI"));
        debug::print(&std::string::utf8(b"      - Vault 3: 3 SUI"));
        debug::print(&std::string::utf8(b"      - Total value: 6 SUI"));
        debug::print(&std::string::utf8(b"   🔑 Created 3 unique cryptographic preimages"));
        debug::print(&std::string::utf8(b"   👤 All vaults assigned to same beneficiary: @0xB"));
        
        let mut registry = test::take_shared<ConsumedProofRegistry>(&scenario);
        
        let (vault_count_before, _) = escrow_example::get_registry_info(&registry);
        debug::print(&std::string::utf8(b"   📈 Vaults before batch creation: "));
        debug::print(&vault_count_before);
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"🚀 STEP 2: Executing Batch Vault Creation"));
        
        // Create batch vaults using the example function
        escrow_example::create_batch_vaults(
            coins,
            BENEFICIARY,
            preimages,
            &clock,
            &mut registry,
            ctx(&mut scenario)
        );
        
        debug::print(&std::string::utf8(b"   ✅ Batch vault creation completed successfully!"));
        
        let (vault_count_after, settlements_after) = escrow_example::get_registry_info(&registry);
        debug::print(&std::string::utf8(b"   📊 Registry stats after batch creation:"));
        debug::print(&std::string::utf8(b"      - Total vaults:"));
        debug::print(&vault_count_after);
        debug::print(&std::string::utf8(b"      - Total settlements:"));
        debug::print(&settlements_after);
        debug::print(&std::string::utf8(b"      - Vaults created in this batch:"));
        debug::print(&(vault_count_after - vault_count_before));
        
        assert_eq(vault_count_after - vault_count_before, (BATCH_SIZE as u64));
        assert_eq(settlements_after, 0); // No settlements yet
        
        test::return_shared(registry);
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"💡 BATCH VAULT CREATION INSIGHTS:"));
        debug::print(&std::string::utf8(b"   🏗️  Batch creation enables efficient multi-vault deployment"));
        debug::print(&std::string::utf8(b"   💰 Each vault can hold different amounts independently"));
        debug::print(&std::string::utf8(b"   🔑 Unique cryptographic commitments ensure security isolation"));
        debug::print(&std::string::utf8(b"   ⏰ Extended duration provides flexibility for complex operations"));
        debug::print(&std::string::utf8(b"   📊 Registry accurately tracks all created vaults"));
        
        clock::destroy_for_testing(clock);
        test::end(scenario);
        debug::print(&std::string::utf8(b""));
    }

    #[test]
    fun test_partial_settlement_with_comprehensive_tracking() {
        debug::print(&std::string::utf8(b"⚖️  === PARTIAL SETTLEMENT TEST ===" ));
        debug::print(&std::string::utf8(b"📚 Demonstrating partial settlement functionality with detailed tracking"));
        debug::print(&std::string::utf8(b""));
        
        let mut scenario = test::begin(DEPOSITOR);
        let mut clock = clock::create_for_testing(ctx(&mut scenario));
        
        // Initialize the vault system
        vault_manager::init_for_testing(ctx(&mut scenario));
        next_tx(&mut scenario, DEPOSITOR);
        
        debug::print(&std::string::utf8(b"🏗️  STEP 1: Creating Vault for Partial Settlement Demo"));
        
        let coin = coin::mint_for_testing<SUI>(AMOUNT, ctx(&mut scenario));
        let secret_preimage = b"partial_settlement_demo_secret";
        
        debug::print(&std::string::utf8(b"   💰 Total vault amount: 1 SUI"));
        debug::print(&std::string::utf8(b"   📋 Settlement plan: 0.3 SUI partial, 0.7 SUI remaining"));
        debug::print(&std::string::utf8(b"   🎯 Beneficiary: Open access (@0x0)"));
        
        let mut registry = test::take_shared<ConsumedProofRegistry>(&scenario);
        
        // Create vault with open beneficiary for partial settlement
        escrow_example::create_secure_vault(
            coin,
            @0x0, // Open access for partial settlement by anyone
            secret_preimage,
            &clock,
            &mut registry,
            ctx(&mut scenario)
        );
        
        debug::print(&std::string::utf8(b"   ✅ Vault created with open beneficiary access"));
        
        test::return_shared(registry);
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"💸 STEP 2: Executing Partial Settlement"));
        next_tx(&mut scenario, RESOLVER);
        
        let mut vault = test::take_shared<AtomicSwapVault<SUI>>(&scenario);
        let mut registry = test::take_shared<ConsumedProofRegistry>(&scenario);
        
        // Check initial state
        let initial_balance = vault_manager::get_available_balance(&vault);
        let (revealed_proof_before, history_before) = escrow_example::get_vault_settlement_info(&vault);
        
        debug::print(&std::string::utf8(b"   🔍 Pre-settlement state:"));
        debug::print(&std::string::utf8(b"      💰 Available balance:"));
        debug::print(&initial_balance);
        debug::print(&std::string::utf8(b"      🔓 Revealed proof length:"));
        debug::print(&std::vector::length(&revealed_proof_before));
        debug::print(&std::string::utf8(b"      📜 Settlement history:"));
        debug::print(&std::vector::length(&history_before));
        
        debug::print(&std::string::utf8(b"   👤 Resolver executing partial settlement"));
        
        // Execute partial settlement using the example function
        escrow_example::partial_settle_vault(
            &mut vault,
            &mut registry,
            PARTIAL_AMOUNT,
            secret_preimage,
            &clock,
            ctx(&mut scenario)
        );
        
        debug::print(&std::string::utf8(b"   ✅ Partial settlement completed via example module!"));
        
        // Verify partial settlement effects
        let remaining_balance = vault_manager::get_available_balance(&vault);
        let (revealed_proof_after, history_after) = escrow_example::get_vault_settlement_info(&vault);
        let (has_expired, can_settle, status, available_balance) = escrow_example::check_vault_status(&vault, &clock);
        
        debug::print(&std::string::utf8(b"   📊 Post-partial-settlement state:"));
        debug::print(&std::string::utf8(b"      💰 Remaining balance:"));
        debug::print(&remaining_balance);
        debug::print(&std::string::utf8(b"      🔓 Revealed proof length:"));
        debug::print(&std::vector::length(&revealed_proof_after));
        debug::print(&std::string::utf8(b"      📜 Settlement records:"));
        debug::print(&std::vector::length(&history_after));
        debug::print(&std::string::utf8(b"      📊 Vault status (still active):"));
        debug::print(&(status as u64));
        debug::print(&std::string::utf8(b"      ✅ Can still settle:"));
        debug::print(&(if (can_settle) { 1 } else { 0 }));
        
        // Validate partial settlement results
        assert_eq(remaining_balance, AMOUNT - PARTIAL_AMOUNT);
        assert_eq(revealed_proof_after, secret_preimage);
        assert_eq(std::vector::length(&history_after), 1);
        assert_eq(status, vault_manager::get_status_active()); // Still active after partial
        assert_eq(can_settle, true);
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"💡 PARTIAL SETTLEMENT INSIGHTS:"));
        debug::print(&std::string::utf8(b"   ⚖️  Partial settlements enable incremental fund claiming"));
        debug::print(&std::string::utf8(b"   🔐 First settlement reveals the cryptographic proof"));
        debug::print(&std::string::utf8(b"   📜 Each settlement creates a comprehensive historical record"));
        debug::print(&std::string::utf8(b"   🔄 Vault remains active until fully settled"));
        debug::print(&std::string::utf8(b"   🎯 Example module handles coin transfers automatically"));
        
        test::return_shared(vault);
        test::return_shared(registry);
        clock::destroy_for_testing(clock);
        test::end(scenario);
        debug::print(&std::string::utf8(b""));
    }

    #[test]
    fun test_expired_vault_refund_with_detailed_workflow() {
        debug::print(&std::string::utf8(b"⏰ === EXPIRED VAULT REFUND TEST ===" ));
        debug::print(&std::string::utf8(b"📚 Complete workflow of vault expiry and refund process"));
        debug::print(&std::string::utf8(b""));
        
        let mut scenario = test::begin(DEPOSITOR);
        let mut clock = clock::create_for_testing(ctx(&mut scenario));
        
        // Initialize the vault system
        vault_manager::init_for_testing(ctx(&mut scenario));
        next_tx(&mut scenario, DEPOSITOR);
        
        debug::print(&std::string::utf8(b"🏗️  STEP 1: Creating Vault with Standard Expiry"));
        
        let coin = coin::mint_for_testing<SUI>(AMOUNT, ctx(&mut scenario));
        let secret_preimage = b"expiry_refund_demo_secret";
        
        let initial_timestamp = clock::timestamp_ms(&clock);
        debug::print(&std::string::utf8(b"   🕐 Initial timestamp:"));
        debug::print(&initial_timestamp);
        debug::print(&std::string::utf8(b"   💰 Vault amount: 1 SUI"));
        debug::print(&std::string::utf8(b"   ⏰ Will use standard temporal constraint (1 hour)"));
        
        let mut registry = test::take_shared<ConsumedProofRegistry>(&scenario);
        
        // Create vault that will expire
        escrow_example::create_secure_vault(
            coin,
            BENEFICIARY,
            secret_preimage,
            &clock,
            &mut registry,
            ctx(&mut scenario)
        );
        
        debug::print(&std::string::utf8(b"   ✅ Vault created with standard expiry time"));
        
        test::return_shared(registry);
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"⏩ STEP 2: Simulating Time Passage to Expiry"));
        
        // Advance time past the standard temporal constraint (1 hour + buffer)
        clock::increment_for_testing(&mut clock, ONE_HOUR_MS + 300000); // 1 hour + 5 minutes
        
        let time_after_advance = clock::timestamp_ms(&clock);
        debug::print(&std::string::utf8(b"   🕐 Time after advance:"));
        debug::print(&time_after_advance);
        debug::print(&std::string::utf8(b"   📊 Time elapsed (ms):"));
        debug::print(&(time_after_advance - initial_timestamp));
        debug::print(&std::string::utf8(b"   ❌ Vault should now be expired"));
        
        next_tx(&mut scenario, DEPOSITOR);
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"🔍 STEP 3: Verifying Vault Expiry Status"));
        
        let mut vault = test::take_shared<AtomicSwapVault<SUI>>(&scenario);
        
        // Check vault status after expiry
        let (has_expired, can_settle, status_before_refund, available_balance) = escrow_example::check_vault_status(&vault, &clock);
        
        debug::print(&std::string::utf8(b"   📊 Vault Status After Time Advance:"));
        debug::print(&std::string::utf8(b"      ❌ Has expired:"));
        debug::print(&(if (has_expired) { 1 } else { 0 }));
        debug::print(&std::string::utf8(b"      🚫 Can still settle:"));
        debug::print(&(if (can_settle) { 1 } else { 0 }));
        debug::print(&std::string::utf8(b"      📊 Status code:"));
        debug::print(&(status_before_refund as u64));
        debug::print(&std::string::utf8(b"      💰 Available for refund:"));
        debug::print(&available_balance);
        
        // Validate expiry status
        assert_eq(has_expired, true);
        assert_eq(can_settle, false);
        assert_eq(status_before_refund, vault_manager::get_status_active()); // Still active, not refunded yet
        assert_eq(available_balance, AMOUNT);
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"💸 STEP 4: Executing Refund via Example Module"));
        debug::print(&std::string::utf8(b"   🔄 Original depositor claiming refund"));
        
        // Execute refund using the example function
        escrow_example::refund_expired_vault(
            &mut vault,
            &clock,
            ctx(&mut scenario)
        );
        
        debug::print(&std::string::utf8(b"   ✅ Refund executed successfully via example module!"));
        
        // Verify refund effects
        let (_, _, status_after_refund, balance_after_refund) = escrow_example::check_vault_status(&vault, &clock);
        
        debug::print(&std::string::utf8(b"   📊 Vault State After Refund:"));
        debug::print(&std::string::utf8(b"      💰 Available balance:"));
        debug::print(&balance_after_refund);
        debug::print(&std::string::utf8(b"      📊 Status (2=Refunded):"));
        debug::print(&(status_after_refund as u64));
        
        // Validate refund results
        assert_eq(balance_after_refund, 0);
        assert_eq(status_after_refund, vault_manager::get_status_refunded());
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"💡 EXPIRED VAULT REFUND INSIGHTS:"));
        debug::print(&std::string::utf8(b"   ⏰ Temporal constraints protect against indefinite fund locks"));
        debug::print(&std::string::utf8(b"   🔍 Status checks clearly identify expired vaults"));
        debug::print(&std::string::utf8(b"   💸 Example module handles refund transfers automatically"));
        debug::print(&std::string::utf8(b"   🛡️  Only original depositors can claim refunds"));
        debug::print(&std::string::utf8(b"   📊 Status tracking prevents double-refunds"));
        
        test::return_shared(vault);
        clock::destroy_for_testing(clock);
        test::end(scenario);
        debug::print(&std::string::utf8(b""));
    }

    #[test]
    fun test_advanced_vault_with_custom_duration() {
        debug::print(&std::string::utf8(b"⚙️  === ADVANCED VAULT WITH CUSTOM DURATION TEST ===" ));
        debug::print(&std::string::utf8(b"📚 Testing advanced vault creation with custom temporal constraints"));
        debug::print(&std::string::utf8(b""));
        
        let mut scenario = test::begin(DEPOSITOR);
        let mut clock = clock::create_for_testing(ctx(&mut scenario));
        
        // Initialize the vault system
        vault_manager::init_for_testing(ctx(&mut scenario));
        next_tx(&mut scenario, DEPOSITOR);
        
        debug::print(&std::string::utf8(b"🏗️  STEP 1: Creating Advanced Vault with Custom Duration"));
        
        let coin = coin::mint_for_testing<SUI>(AMOUNT, ctx(&mut scenario));
        let secret_preimage = b"advanced_vault_custom_duration_secret";
        let custom_duration_hours = 2; // 2 hours instead of standard 1 hour
        
        let initial_timestamp = clock::timestamp_ms(&clock);
        debug::print(&std::string::utf8(b"   🕐 Initial timestamp:"));
        debug::print(&initial_timestamp);
        debug::print(&std::string::utf8(b"   💰 Vault amount: 1 SUI"));
        debug::print(&std::string::utf8(b"   ⏰ Custom duration: 2 hours"));
        debug::print(&std::string::utf8(b"   🎯 Beneficiary: @0xB"));
        
        let mut registry = test::take_shared<ConsumedProofRegistry>(&scenario);
        
        // Create advanced vault with custom duration
        escrow_example::create_advanced_vault(
            coin,
            BENEFICIARY,
            secret_preimage,
            custom_duration_hours,
            &clock,
            &mut registry,
            ctx(&mut scenario)
        );
        
        debug::print(&std::string::utf8(b"   ✅ Advanced vault created with 2-hour custom duration"));
        
        let (vault_count, settlements_count) = escrow_example::get_registry_info(&registry);
        debug::print(&std::string::utf8(b"   📊 Registry stats:"));
        debug::print(&std::string::utf8(b"      - Total vaults:"));
        debug::print(&vault_count);
        debug::print(&std::string::utf8(b"      - Total settlements:"));
        debug::print(&settlements_count);
        
        test::return_shared(registry);
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"🔍 STEP 2: Comprehensive Status Checking Throughout Lifecycle"));
        next_tx(&mut scenario, BENEFICIARY);
        
        let vault = test::take_shared<AtomicSwapVault<SUI>>(&scenario);
        
        // Check initial status
        let (has_expired_initial, can_settle_initial, status_initial, balance_initial) = 
            escrow_example::check_vault_status(&vault, &clock);
        
        debug::print(&std::string::utf8(b"   📊 Initial Status (just created):"));
        debug::print(&std::string::utf8(b"      ❌ Has expired:"));
        debug::print(&(if (has_expired_initial) { 1 } else { 0 }));
        debug::print(&std::string::utf8(b"      ✅ Can settle:"));
        debug::print(&(if (can_settle_initial) { 1 } else { 0 }));
        debug::print(&std::string::utf8(b"      📊 Status code:"));
        debug::print(&(status_initial as u64));
        debug::print(&std::string::utf8(b"      💰 Available balance:"));
        debug::print(&balance_initial);
        
        assert_eq(has_expired_initial, false);
        assert_eq(can_settle_initial, true);
        assert_eq(status_initial, vault_manager::get_status_active());
        assert_eq(balance_initial, AMOUNT);
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"⏰ STEP 3: Testing Status After 1 Hour (should still be active)"));
        
        // Advance time by 1 hour (less than the 2-hour custom duration)
        clock::increment_for_testing(&mut clock, ONE_HOUR_MS);
        
        let time_after_1_hour = clock::timestamp_ms(&clock);
        debug::print(&std::string::utf8(b"   🕐 Time after 1 hour:"));
        debug::print(&time_after_1_hour);
        debug::print(&std::string::utf8(b"   📊 Time elapsed (should be < 2 hours):"));
        debug::print(&(time_after_1_hour - initial_timestamp));
        
        let (has_expired_1h, can_settle_1h, status_1h, balance_1h) = 
            escrow_example::check_vault_status(&vault, &clock);
        
        debug::print(&std::string::utf8(b"   📊 Status After 1 Hour:"));
        debug::print(&std::string::utf8(b"      ❌ Has expired (should be false):"));
        debug::print(&(if (has_expired_1h) { 1 } else { 0 }));
        debug::print(&std::string::utf8(b"      ✅ Can still settle (should be true):"));
        debug::print(&(if (can_settle_1h) { 1 } else { 0 }));
        debug::print(&std::string::utf8(b"      📊 Status code:"));
        debug::print(&(status_1h as u64));
        debug::print(&std::string::utf8(b"      💰 Available balance:"));
        debug::print(&balance_1h);
        
        // Vault should still be active after 1 hour with 2-hour duration
        assert_eq(has_expired_1h, false);
        assert_eq(can_settle_1h, true);
        assert_eq(status_1h, vault_manager::get_status_active());
        assert_eq(balance_1h, AMOUNT);
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"⏰ STEP 4: Testing Status After 2+ Hours (should be expired)"));
        
        // Advance time past 2 hours total
        clock::increment_for_testing(&mut clock, ONE_HOUR_MS + 300000); // +1 hour 5 minutes
        
        let time_after_2h = clock::timestamp_ms(&clock);
        debug::print(&std::string::utf8(b"   🕐 Time after 2+ hours:"));
        debug::print(&time_after_2h);
        debug::print(&std::string::utf8(b"   📊 Total time elapsed:"));
        debug::print(&(time_after_2h - initial_timestamp));
        
        let (has_expired_2h, can_settle_2h, status_2h, balance_2h) = 
            escrow_example::check_vault_status(&vault, &clock);
        
        debug::print(&std::string::utf8(b"   📊 Status After 2+ Hours:"));
        debug::print(&std::string::utf8(b"      ❌ Has expired (should be true):"));
        debug::print(&(if (has_expired_2h) { 1 } else { 0 }));
        debug::print(&std::string::utf8(b"      🚫 Can settle (should be false):"));
        debug::print(&(if (can_settle_2h) { 1 } else { 0 }));
        debug::print(&std::string::utf8(b"      📊 Status code:"));
        debug::print(&(status_2h as u64));
        debug::print(&std::string::utf8(b"      💰 Available balance:"));
        debug::print(&balance_2h);
        
        // Vault should now be expired after 2+ hours
        assert_eq(has_expired_2h, true);
        assert_eq(can_settle_2h, false);
        assert_eq(status_2h, vault_manager::get_status_active()); // Still active (not refunded)
        assert_eq(balance_2h, AMOUNT);
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"💡 ADVANCED VAULT INSIGHTS:"));
        debug::print(&std::string::utf8(b"   ⚙️  Advanced vault creation supports custom temporal constraints"));
        debug::print(&std::string::utf8(b"   ⏰ Duration can be configured in hours for flexibility"));
        debug::print(&std::string::utf8(b"   🔍 Status checks work consistently across different durations"));
        debug::print(&std::string::utf8(b"   📊 Temporal logic correctly handles custom timeframes"));
        debug::print(&std::string::utf8(b"   🎯 Example module provides user-friendly configuration"));
        
        test::return_shared(vault);
        clock::destroy_for_testing(clock);
        test::end(scenario);
        debug::print(&std::string::utf8(b""));
    }

    #[test]
    fun test_comprehensive_proof_verification_and_settlement_info() {
        debug::print(&std::string::utf8(b"🔐 === COMPREHENSIVE PROOF VERIFICATION TEST ===" ));
        debug::print(&std::string::utf8(b"📚 Testing cryptographic proof verification and settlement info tracking"));
        debug::print(&std::string::utf8(b""));
        
        let mut scenario = test::begin(DEPOSITOR);
        let mut clock = clock::create_for_testing(ctx(&mut scenario));
        
        // Initialize the vault system
        vault_manager::init_for_testing(ctx(&mut scenario));
        next_tx(&mut scenario, DEPOSITOR);
        
        debug::print(&std::string::utf8(b"🔑 STEP 1: Cryptographic Proof Testing"));
        
        let correct_secret = b"comprehensive_proof_test_secret";
        let wrong_secret = b"incorrect_secret_for_testing";
        let empty_secret = b"";
        
        // Create commitment for testing
        let cryptographic_commitment = cryptographic_proof::create_commitment(correct_secret);
        
        debug::print(&std::string::utf8(b"   🧪 Testing Various Proof Scenarios:"));
        
        // Test correct proof
        let correct_proof_valid = escrow_example::verify_proof_example(correct_secret, cryptographic_commitment);
        debug::print(&std::string::utf8(b"      ✅ Correct proof verification:"));
        debug::print(&(if (correct_proof_valid) { 1 } else { 0 }));
        assert_eq(correct_proof_valid, true);
        
        // Test wrong proof
        let wrong_proof_valid = escrow_example::verify_proof_example(wrong_secret, cryptographic_commitment);
        debug::print(&std::string::utf8(b"      ❌ Wrong proof verification:"));
        debug::print(&(if (wrong_proof_valid) { 1 } else { 0 }));
        assert_eq(wrong_proof_valid, false);
        
        // Test empty proof
        let empty_proof_valid = escrow_example::verify_proof_example(empty_secret, cryptographic_commitment);
        debug::print(&std::string::utf8(b"      ❌ Empty proof verification:"));
        debug::print(&(if (empty_proof_valid) { 1 } else { 0 }));
        assert_eq(empty_proof_valid, false);
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"🏗️  STEP 2: Creating Vault for Settlement Info Testing"));
        
        let coin = coin::mint_for_testing<SUI>(AMOUNT, ctx(&mut scenario));
        
        debug::print(&std::string::utf8(b"   💰 Vault amount: 1 SUI"));
        debug::print(&std::string::utf8(b"   🎯 Beneficiary: @0x0 (open access)"));
        
        let mut registry = test::take_shared<ConsumedProofRegistry>(&scenario);
        
        // Create vault for settlement info testing
        escrow_example::create_secure_vault(
            coin,
            @0x0, // Open access
            correct_secret,
            &clock,
            &mut registry,
            ctx(&mut scenario)
        );
        
        debug::print(&std::string::utf8(b"   ✅ Vault created for settlement info testing"));
        
        test::return_shared(registry);
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"📊 STEP 3: Pre-Settlement Information Analysis"));
        next_tx(&mut scenario, RESOLVER);
        
        let mut vault = test::take_shared<AtomicSwapVault<SUI>>(&scenario);
        
        // Get pre-settlement info
        let (revealed_proof_before, settlement_history_before) = escrow_example::get_vault_settlement_info(&vault);
        
        debug::print(&std::string::utf8(b"   📋 Pre-Settlement State:"));
        debug::print(&std::string::utf8(b"      🔓 Revealed proof length:"));
        debug::print(&std::vector::length(&revealed_proof_before));
        debug::print(&std::string::utf8(b"      📜 Settlement history count:"));
        debug::print(&std::vector::length(&settlement_history_before));
        
        assert_eq(std::vector::length(&revealed_proof_before), 0);
        assert_eq(std::vector::length(&settlement_history_before), 0);
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"💸 STEP 4: Executing Settlement and Analyzing Results"));
        
        let mut registry = test::take_shared<ConsumedProofRegistry>(&scenario);
        
        debug::print(&std::string::utf8(b"   👤 Resolver settling vault completely"));
        
        // Execute complete settlement
        escrow_example::settle_vault_example(
            &mut vault,
            &mut registry,
            correct_secret,
            &clock,
            ctx(&mut scenario)
        );
        
        debug::print(&std::string::utf8(b"   ✅ Settlement completed successfully!"));
        
        // Get post-settlement info
        let (revealed_proof_after, settlement_history_after) = escrow_example::get_vault_settlement_info(&vault);
        let (final_vault_count, final_settlements) = escrow_example::get_registry_info(&registry);
        
        debug::print(&std::string::utf8(b"   📊 Post-Settlement Analysis:"));
        debug::print(&std::string::utf8(b"      🔓 Revealed proof length:"));
        debug::print(&std::vector::length(&revealed_proof_after));
        debug::print(&std::string::utf8(b"      📜 Settlement history count:"));
        debug::print(&std::vector::length(&settlement_history_after));
        debug::print(&std::string::utf8(b"      🏗️  Total vaults in registry:"));
        debug::print(&final_vault_count);
        debug::print(&std::string::utf8(b"      🎯 Total settlements in registry:"));
        debug::print(&final_settlements);
        
        // Validate settlement information
        assert_eq(revealed_proof_after, correct_secret);
        assert_eq(std::vector::length(&settlement_history_after), 1);
        assert_eq(final_vault_count, 1);
        assert_eq(final_settlements, 1);
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"🔍 STEP 5: Final Status Verification"));
        
        let (has_expired_final, can_settle_final, status_final, balance_final) = 
            escrow_example::check_vault_status(&vault, &clock);
        
        debug::print(&std::string::utf8(b"   📊 Final Vault Status:"));
        debug::print(&std::string::utf8(b"      ❌ Has expired:"));
        debug::print(&(if (has_expired_final) { 1 } else { 0 }));
        debug::print(&std::string::utf8(b"      🚫 Can settle:"));
        debug::print(&(if (can_settle_final) { 1 } else { 0 }));
        debug::print(&std::string::utf8(b"      📊 Status (1=Settled):"));
        debug::print(&(status_final as u64));
        debug::print(&std::string::utf8(b"      💰 Final balance:"));
        debug::print(&balance_final);
        
        assert_eq(has_expired_final, false); // Not expired, just settled
        assert_eq(can_settle_final, false); // Cannot settle (already settled)
        assert_eq(status_final, vault_manager::get_status_settled());
        assert_eq(balance_final, 0);
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"💡 COMPREHENSIVE VERIFICATION INSIGHTS:"));
        debug::print(&std::string::utf8(b"   🔐 Cryptographic proof verification is robust and secure"));
        debug::print(&std::string::utf8(b"   📊 Settlement information provides complete audit trail"));
        debug::print(&std::string::utf8(b"   🔍 Status checks give comprehensive vault state information"));
        debug::print(&std::string::utf8(b"   📈 Registry statistics enable system-wide monitoring"));
        debug::print(&std::string::utf8(b"   ⚡ Example module functions integrate seamlessly"));
        
        test::return_shared(vault);
        test::return_shared(registry);
        clock::destroy_for_testing(clock);
        test::end(scenario);
        debug::print(&std::string::utf8(b""));
    }
}