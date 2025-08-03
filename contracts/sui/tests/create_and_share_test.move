#[test_only]
module fusion_plus_crosschain::create_and_share_test {
    use sui::test_scenario::{Self as test, next_tx, ctx};
    use sui::coin::{Self};
    use sui::clock::{Self};
    use sui::sui::SUI;
    use sui::test_utils::assert_eq;
    use sui::object::{Self};
    use std::string;
    use std::debug;
    use fusion_plus_crosschain::cross_chain_escrow::{
        Self as vault_manager, AtomicSwapVault, ConsumedProofRegistry
    };
    use fusion_plus_crosschain::cryptographic_proof;
    use fusion_plus_crosschain::temporal_constraint;

    // Test constants with educational explanations
    const DEPOSITOR: address = @0xA;     // Vault creator and fund provider
    const BENEFICIARY: address = @0xB;   // Authorized fund recipient
    const AMOUNT: u64 = 1000000000;      // 1 SUI in nano SUI units
    const ONE_HOUR_MS: u64 = 3600000;    // Standard temporal constraint duration

    #[test]
    fun test_create_and_share_vault_success_with_detailed_workflow() {
        debug::print(&std::string::utf8(b"🏦 === CREATE AND SHARE VAULT SUCCESS TEST ===" ));
        debug::print(&std::string::utf8(b"📚 Complete workflow of vault creation, sharing, and settlement"));
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
        
        // Create test data with educational explanations
        debug::print(&std::string::utf8(b"🔐 STEP 2: Cryptographic and Temporal Setup"));
        let secret_preimage = b"create_and_share_vault_demo_secret";
        let cryptographic_commitment = cryptographic_proof::create_commitment(secret_preimage);
        let temporal_deadline = temporal_constraint::create_deadline(ONE_HOUR_MS, &clock);
        let coin = coin::mint_for_testing<SUI>(AMOUNT, ctx(&mut scenario));
        let cross_chain_reference = string::utf8(b"CREATE_SHARE_DEMO_ORDER");
        
        debug::print(&std::string::utf8(b"   🔑 Secret preimage created (length):"));
        debug::print(&std::vector::length(&secret_preimage));
        debug::print(&std::string::utf8(b"   🔒 Cryptographic commitment generated (SHA3-256 length):"));
        debug::print(&std::vector::length(&cryptographic_commitment));
        debug::print(&std::string::utf8(b"   ⏰ Temporal deadline set for 1 hour from now"));
        debug::print(&std::string::utf8(b"   💰 Funding amount (nano SUI):"));
        debug::print(&coin::value(&coin));
        debug::print(&std::string::utf8(b""));
        
        // Create and share vault - demonstrates the main functionality
        debug::print(&std::string::utf8(b"🏗️  STEP 3: Vault Creation and Sharing"));
        debug::print(&std::string::utf8(b"   📝 Creating vault with create_and_share_vault function"));
        debug::print(&std::string::utf8(b"   🔄 This function creates the vault and immediately makes it shared"));
        debug::print(&std::string::utf8(b"   🌐 Shared objects can be accessed by multiple transactions"));
        
        let mut registry = test::take_shared<ConsumedProofRegistry>(&scenario);
        
        let vault_object_id = vault_manager::create_and_share_vault<SUI>(
            coin,
            BENEFICIARY,
            cryptographic_commitment,
            temporal_deadline,
            cross_chain_reference,
            &mut registry,
            &clock,
            ctx(&mut scenario)
        );
        
        debug::print(&std::string::utf8(b"   ✅ Vault created and shared successfully!"));
        debug::print(&std::string::utf8(b"   🆔 Vault Object ID:"));
        debug::print(&object::id_to_address(&vault_object_id));
        
        // Verify vault_object_id is valid
        assert!(object::id_to_address(&vault_object_id) != @0x0);
        
        let (vault_count_after_creation, settlements_count) = vault_manager::get_registry_stats(&registry);
        debug::print(&std::string::utf8(b"   📊 Registry stats after creation:"));
        debug::print(&std::string::utf8(b"      - Total vaults created:"));
        debug::print(&vault_count_after_creation);
        debug::print(&std::string::utf8(b"      - Total settlements:"));
        debug::print(&settlements_count);
        
        test::return_shared(registry);
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"🔍 STEP 4: Vault Inspection and Verification"));
        
        next_tx(&mut scenario, BENEFICIARY);
        
        // Get shared vault for inspection
        debug::print(&std::string::utf8(b"   🔄 Beneficiary accessing shared vault"));
        let mut vault = test::take_shared<AtomicSwapVault<SUI>>(&scenario);
        let mut registry = test::take_shared<ConsumedProofRegistry>(&scenario);
        
        // Verify vault properties comprehensively
        let (vault_id, depositor, beneficiary, total_deposit, available_balance, 
             stored_commitment, stored_deadline, status, creation_time, stored_reference) = 
            vault_manager::get_vault_info(&vault);
        
        debug::print(&std::string::utf8(b"   📋 Comprehensive Vault Property Verification:"));
        debug::print(&std::string::utf8(b"      🆔 Vault ID:"));
        debug::print(&vault_id);
        debug::print(&std::string::utf8(b"      👤 Depositor address:"));
        debug::print(&depositor);
        debug::print(&std::string::utf8(b"      🎯 Beneficiary address:"));
        debug::print(&beneficiary);
        debug::print(&std::string::utf8(b"      💰 Total deposit amount:"));
        debug::print(&total_deposit);
        debug::print(&std::string::utf8(b"      💵 Available balance:"));
        debug::print(&available_balance);
        debug::print(&std::string::utf8(b"      📊 Status (0=Active):"));
        debug::print(&(status as u64));
        debug::print(&std::string::utf8(b"      🕐 Creation timestamp:"));
        debug::print(&creation_time);
        
        // Validate all properties match expectations
        assert_eq(depositor, DEPOSITOR);
        assert_eq(beneficiary, BENEFICIARY);
        assert_eq(total_deposit, AMOUNT);
        assert_eq(available_balance, AMOUNT);
        assert_eq(stored_commitment, cryptographic_commitment);
        assert_eq(stored_deadline, temporal_deadline);
        assert_eq(status, vault_manager::get_status_active());
        assert_eq(stored_reference, cross_chain_reference);
        
        debug::print(&std::string::utf8(b"      ✅ All vault properties verified correctly!"));
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"⚡ STEP 5: Vault Status and Capability Checks"));
        
        // Test various vault status functions
        let has_expired = vault_manager::has_expired(&vault, &clock);
        let can_settle = vault_manager::can_settle(&vault, &clock);
        let current_balance = vault_manager::get_available_balance(&vault);
        
        debug::print(&std::string::utf8(b"   🔍 Real-time Status Checks:"));
        debug::print(&std::string::utf8(b"      ❌ Has vault expired?"));
        debug::print(&(if (has_expired) { 1 } else { 0 }));
        debug::print(&std::string::utf8(b"      ✅ Can vault be settled?"));
        debug::print(&(if (can_settle) { 1 } else { 0 }));
        debug::print(&std::string::utf8(b"      💰 Current available balance:"));
        debug::print(&current_balance);
        
        assert_eq(has_expired, false);
        assert_eq(can_settle, true);
        assert_eq(current_balance, AMOUNT);
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"💸 STEP 6: Complete Settlement Process"));
        debug::print(&std::string::utf8(b"   🔐 Beneficiary settling vault with correct cryptographic proof"));
        
        // Settle the vault to complete the test
        let settlement_coin = vault_manager::settle_vault_complete(
            &mut vault,
            &mut registry,
            secret_preimage,
            &clock,
            ctx(&mut scenario)
        );
        
        debug::print(&std::string::utf8(b"   ✅ Settlement completed successfully!"));
        debug::print(&std::string::utf8(b"   💰 Settlement amount received:"));
        debug::print(&coin::value(&settlement_coin));
        
        // Verify settlement effects
        let final_balance = vault_manager::get_available_balance(&vault);
        let revealed_proof = vault_manager::get_revealed_proof(&vault);
        let settlement_history = vault_manager::get_settlement_history(&vault);
        
        debug::print(&std::string::utf8(b"   📊 Post-Settlement State:"));
        debug::print(&std::string::utf8(b"      💰 Final vault balance:"));
        debug::print(&final_balance);
        debug::print(&std::string::utf8(b"      🔓 Revealed proof length:"));
        debug::print(&std::vector::length(&revealed_proof));
        debug::print(&std::string::utf8(b"      📜 Settlement records count:"));
        debug::print(&std::vector::length(&settlement_history));
        
        // Verify settlement worked correctly
        assert_eq(coin::value(&settlement_coin), AMOUNT);
        assert_eq(final_balance, 0);
        assert_eq(revealed_proof, secret_preimage);
        assert_eq(std::vector::length(&settlement_history), 1);
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"💡 CREATE AND SHARE WORKFLOW INSIGHTS:"));
        debug::print(&std::string::utf8(b"   🏗️  create_and_share_vault combines creation and sharing in one call"));
        debug::print(&std::string::utf8(b"   🌐 Shared vaults enable multi-party atomic swap transactions"));
        debug::print(&std::string::utf8(b"   🔍 Comprehensive property verification ensures correctness"));
        debug::print(&std::string::utf8(b"   ⚡ Status checks provide real-time vault state information"));
        debug::print(&std::string::utf8(b"   💸 Settlement process completes the atomic swap lifecycle"));
        
        // Cleanup
        coin::burn_for_testing(settlement_coin);
        test::return_shared(vault);
        test::return_shared(registry);
        clock::destroy_for_testing(clock);
        test::end(scenario);
        debug::print(&std::string::utf8(b""));
    }

    #[test]
    fun test_create_and_share_multiple_vaults_with_unique_properties() {
        debug::print(&std::string::utf8(b"🏗️  === MULTIPLE VAULT CREATION TEST ===" ));
        debug::print(&std::string::utf8(b"📚 Creating multiple unique vaults with different properties"));
        debug::print(&std::string::utf8(b""));
        
        let mut scenario = test::begin(DEPOSITOR);
        let mut clock = clock::create_for_testing(ctx(&mut scenario));
        
        // Initialize the module
        vault_manager::init_for_testing(ctx(&mut scenario));
        next_tx(&mut scenario, DEPOSITOR);
        
        debug::print(&std::string::utf8(b"🔐 STEP 1: Creating multiple unique cryptographic commitments"));
        
        // Create multiple vaults with different secrets and amounts
        let secret1 = b"first_vault_secret_unique";
        let secret2 = b"second_vault_secret_different";  
        let secret3 = b"third_vault_secret_special";
        
        let cryptographic_commitment1 = cryptographic_proof::create_commitment(secret1);
        let cryptographic_commitment2 = cryptographic_proof::create_commitment(secret2);
        let cryptographic_commitment3 = cryptographic_proof::create_commitment(secret3);
        
        debug::print(&std::string::utf8(b"   🔑 Created 3 unique cryptographic commitments"));
        debug::print(&std::string::utf8(b"   📏 Commitment 1 length:"));
        debug::print(&std::vector::length(&cryptographic_commitment1));
        debug::print(&std::string::utf8(b"   📏 Commitment 2 length:"));
        debug::print(&std::vector::length(&cryptographic_commitment2));
        debug::print(&std::string::utf8(b"   📏 Commitment 3 length:"));
        debug::print(&std::vector::length(&cryptographic_commitment3));
        
        // Create temporal constraints
        let temporal_deadline = temporal_constraint::create_deadline(ONE_HOUR_MS, &clock);
        let cross_chain_reference1 = string::utf8(b"MULTI_VAULT_ORDER_1");
        let cross_chain_reference2 = string::utf8(b"MULTI_VAULT_ORDER_2");
        let cross_chain_reference3 = string::utf8(b"MULTI_VAULT_ORDER_3");
        
        // Create coins with different amounts
        let coin1 = coin::mint_for_testing<SUI>(AMOUNT, ctx(&mut scenario));
        let coin2 = coin::mint_for_testing<SUI>(AMOUNT * 2, ctx(&mut scenario));
        let coin3 = coin::mint_for_testing<SUI>(AMOUNT * 3, ctx(&mut scenario));
        
        debug::print(&std::string::utf8(b"   💰 Created coins with different amounts:"));
        debug::print(&std::string::utf8(b"      - Vault 1 amount:"));
        debug::print(&coin::value(&coin1));
        debug::print(&std::string::utf8(b"      - Vault 2 amount:"));
        debug::print(&coin::value(&coin2));
        debug::print(&std::string::utf8(b"      - Vault 3 amount:"));
        debug::print(&coin::value(&coin3));
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"🏦 STEP 2: Creating multiple vaults simultaneously"));
        
        let mut registry = test::take_shared<ConsumedProofRegistry>(&scenario);
        
        // Create multiple vaults
        let vault_id1 = vault_manager::create_and_share_vault<SUI>(
            coin1, BENEFICIARY, cryptographic_commitment1, temporal_deadline, 
            cross_chain_reference1, &mut registry, &clock, ctx(&mut scenario)
        );
        
        let vault_id2 = vault_manager::create_and_share_vault<SUI>(
            coin2, BENEFICIARY, cryptographic_commitment2, temporal_deadline,
            cross_chain_reference2, &mut registry, &clock, ctx(&mut scenario)
        );
        
        let vault_id3 = vault_manager::create_and_share_vault<SUI>(
            coin3, BENEFICIARY, cryptographic_commitment3, temporal_deadline,
            cross_chain_reference3, &mut registry, &clock, ctx(&mut scenario)
        );
        
        debug::print(&std::string::utf8(b"   ✅ All 3 vaults created successfully!"));
        
        // Verify all vault IDs are valid and unique
        debug::print(&std::string::utf8(b"   🔍 Vault ID Verification:"));
        debug::print(&std::string::utf8(b"      - Vault 1 ID:"));
        debug::print(&object::id_to_address(&vault_id1));
        debug::print(&std::string::utf8(b"      - Vault 2 ID:"));
        debug::print(&object::id_to_address(&vault_id2));
        debug::print(&std::string::utf8(b"      - Vault 3 ID:"));
        debug::print(&object::id_to_address(&vault_id3));
        
        assert!(object::id_to_address(&vault_id1) != @0x0);
        assert!(object::id_to_address(&vault_id2) != @0x0);
        assert!(object::id_to_address(&vault_id3) != @0x0);
        
        // Verify all IDs are unique
        assert!(vault_id1 != vault_id2);
        assert!(vault_id2 != vault_id3);
        assert!(vault_id1 != vault_id3);
        
        debug::print(&std::string::utf8(b"      ✅ All vault IDs are valid and unique!"));
        
        let (final_vault_count, final_settlements) = vault_manager::get_registry_stats(&registry);
        debug::print(&std::string::utf8(b"   📊 Final registry statistics:"));
        debug::print(&std::string::utf8(b"      - Total vaults created:"));
        debug::print(&final_vault_count);
        debug::print(&std::string::utf8(b"      - Total settlements:"));
        debug::print(&final_settlements);
        
        assert_eq(final_vault_count, 3);
        assert_eq(final_settlements, 0); // No settlements yet
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"💡 MULTIPLE VAULT CREATION INSIGHTS:"));
        debug::print(&std::string::utf8(b"   🏗️  System supports unlimited concurrent vault creation"));
        debug::print(&std::string::utf8(b"   🔑 Each vault has unique cryptographic commitments"));
        debug::print(&std::string::utf8(b"   💰 Vaults can hold different amounts independently"));
        debug::print(&std::string::utf8(b"   📊 Registry tracks all vaults with unique counters"));
        debug::print(&std::string::utf8(b"   🌐 All vaults are immediately available as shared objects"));
        
        test::return_shared(registry);
        clock::destroy_for_testing(clock);
        test::end(scenario);
        debug::print(&std::string::utf8(b""));
    }

    #[test]
    fun test_create_and_share_vault_with_expiry_and_refund_workflow() {
        debug::print(&std::string::utf8(b"⏰ === VAULT EXPIRY AND REFUND WORKFLOW TEST ===" ));
        debug::print(&std::string::utf8(b"📚 Complete lifecycle of vault creation, expiry, and refund"));
        debug::print(&std::string::utf8(b""));
        
        let mut scenario = test::begin(DEPOSITOR);
        let mut clock = clock::create_for_testing(ctx(&mut scenario));
        
        // Initialize the module
        vault_manager::init_for_testing(ctx(&mut scenario));
        next_tx(&mut scenario, DEPOSITOR);
        
        debug::print(&std::string::utf8(b"🏦 STEP 1: Creating vault with short expiry for demo"));
        
        // Create test data
        let secret_preimage = b"expiry_demo_secret";
        let cryptographic_commitment = cryptographic_proof::create_commitment(secret_preimage);
        let temporal_deadline = temporal_constraint::create_deadline(ONE_HOUR_MS, &clock);
        let coin = coin::mint_for_testing<SUI>(AMOUNT, ctx(&mut scenario));
        let cross_chain_reference = string::utf8(b"EXPIRY_DEMO_ORDER");
        
        let initial_timestamp = clock::timestamp_ms(&clock);
        debug::print(&std::string::utf8(b"   🕐 Initial timestamp:"));
        debug::print(&initial_timestamp);
        debug::print(&std::string::utf8(b"   ⏰ Expiry timestamp:"));
        debug::print(&temporal_deadline);
        debug::print(&std::string::utf8(b"   ⏱️  Valid duration (ms):"));
        debug::print(&(temporal_deadline - initial_timestamp));
        
        let mut registry = test::take_shared<ConsumedProofRegistry>(&scenario);
        
        // Create and share vault
        let vault_object_id = vault_manager::create_and_share_vault<SUI>(
            coin,
            BENEFICIARY,
            cryptographic_commitment,
            temporal_deadline,
            cross_chain_reference,
            &mut registry,
            &clock,
            ctx(&mut scenario)
        );
        
        debug::print(&std::string::utf8(b"   ✅ Vault created with 1-hour expiry"));
        debug::print(&std::string::utf8(b"   🆔 Vault ID:"));
        debug::print(&object::id_to_address(&vault_object_id));
        
        // Verify vault_object_id is valid
        assert!(object::id_to_address(&vault_object_id) != @0x0);
        
        test::return_shared(registry);
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"⏩ STEP 2: Simulating time passage to expiry"));
        debug::print(&std::string::utf8(b"   ⏰ Advancing time past vault deadline..."));
        
        // Advance time past expiry
        clock::increment_for_testing(&mut clock, ONE_HOUR_MS + 60000); // 1 hour + 1 minute
        
        let time_after_advance = clock::timestamp_ms(&clock);
        debug::print(&std::string::utf8(b"   🕐 Time after advance:"));
        debug::print(&time_after_advance);
        debug::print(&std::string::utf8(b"   📊 Time past deadline (ms):"));
        debug::print(&(time_after_advance - temporal_deadline));
        
        next_tx(&mut scenario, DEPOSITOR);
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"🔍 STEP 3: Vault Status Verification After Expiry"));
        
        // Get shared vault for inspection
        let mut vault = test::take_shared<AtomicSwapVault<SUI>>(&scenario);
        
        // Verify vault is expired
        let has_expired = vault_manager::has_expired(&vault, &clock);
        let can_settle = vault_manager::can_settle(&vault, &clock);
        let available_balance = vault_manager::get_available_balance(&vault);
        
        debug::print(&std::string::utf8(b"   📊 Vault Status After Expiry:"));
        debug::print(&std::string::utf8(b"      ❌ Has expired:"));
        debug::print(&(if (has_expired) { 1 } else { 0 }));
        debug::print(&std::string::utf8(b"      🚫 Can still settle:"));
        debug::print(&(if (can_settle) { 1 } else { 0 }));
        debug::print(&std::string::utf8(b"      💰 Available for refund:"));
        debug::print(&available_balance);
        
        assert_eq(has_expired, true);
        assert_eq(can_settle, false);
        assert_eq(available_balance, AMOUNT);
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"💸 STEP 4: Executing Refund Process"));
        debug::print(&std::string::utf8(b"   🔄 Original depositor claiming refund from expired vault"));
        
        // Refund the vault
        let refund_coin = vault_manager::refund_vault(
            &mut vault,
            &clock,
            ctx(&mut scenario)
        );
        
        debug::print(&std::string::utf8(b"   ✅ Refund executed successfully!"));
        debug::print(&std::string::utf8(b"   💰 Refund amount received:"));
        debug::print(&coin::value(&refund_coin));
        
        // Verify refund was correct amount
        assert_eq(coin::value(&refund_coin), AMOUNT);
        
        // Check vault state after refund
        let balance_after_refund = vault_manager::get_available_balance(&vault);
        let (_, _, _, _, _, _, _, status_after_refund, _, _) = vault_manager::get_vault_info(&vault);
        
        debug::print(&std::string::utf8(b"   📊 Vault State After Refund:"));
        debug::print(&std::string::utf8(b"      💰 Available balance:"));
        debug::print(&balance_after_refund);
        debug::print(&std::string::utf8(b"      📊 Status (2=Refunded):"));
        debug::print(&(status_after_refund as u64));
        
        assert_eq(balance_after_refund, 0);
        assert_eq(status_after_refund, vault_manager::get_status_refunded());
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"💡 EXPIRY AND REFUND WORKFLOW INSIGHTS:"));
        debug::print(&std::string::utf8(b"   ⏰ Temporal constraints protect against indefinite fund locks"));
        debug::print(&std::string::utf8(b"   🔍 Expired vaults can be easily identified with status checks"));
        debug::print(&std::string::utf8(b"   💸 Refund process ensures depositors never lose funds"));
        debug::print(&std::string::utf8(b"   🛡️  Only original depositors can claim refunds"));
        debug::print(&std::string::utf8(b"   📊 Vault status tracking prevents double-refunds"));
        
        // Cleanup
        coin::burn_for_testing(refund_coin);
        test::return_shared(vault);
        clock::destroy_for_testing(clock);
        test::end(scenario);
        debug::print(&std::string::utf8(b""));
    }

    #[test]
    fun test_vault_comprehensive_status_and_capability_checks() {
        debug::print(&std::string::utf8(b"🔍 === COMPREHENSIVE VAULT STATUS CHECKS TEST ===" ));
        debug::print(&std::string::utf8(b"📚 Testing all vault status functions and capability checks"));
        debug::print(&std::string::utf8(b""));
        
        let mut scenario = test::begin(DEPOSITOR);
        let mut clock = clock::create_for_testing(ctx(&mut scenario));
        
        // Initialize the module
        vault_manager::init_for_testing(ctx(&mut scenario));
        next_tx(&mut scenario, DEPOSITOR);
        
        debug::print(&std::string::utf8(b"🏦 STEP 1: Creating vault for comprehensive testing"));
        
        // Create test data
        let secret_preimage = b"status_check_demo_secret";
        let cryptographic_commitment = cryptographic_proof::create_commitment(secret_preimage);
        let temporal_deadline = temporal_constraint::create_deadline(ONE_HOUR_MS, &clock);
        let coin = coin::mint_for_testing<SUI>(AMOUNT, ctx(&mut scenario));
        let cross_chain_reference = string::utf8(b"STATUS_CHECK_DEMO");
        
        let mut registry = test::take_shared<ConsumedProofRegistry>(&scenario);
        
        // Create and share vault
        let vault_object_id = vault_manager::create_and_share_vault<SUI>(
            coin,
            BENEFICIARY,
            cryptographic_commitment,
            temporal_deadline,
            cross_chain_reference,
            &mut registry,
            &clock,
            ctx(&mut scenario)
        );
        
        debug::print(&std::string::utf8(b"   ✅ Vault created for status testing"));
        debug::print(&std::string::utf8(b"   🆔 Vault Object ID:"));
        debug::print(&object::id_to_address(&vault_object_id));
        
        // Verify vault_object_id is valid
        assert!(object::id_to_address(&vault_object_id) != @0x0);
        
        test::return_shared(registry);
        
        next_tx(&mut scenario, BENEFICIARY);
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"⚡ STEP 2: Active Vault Status Checks"));
        
        // Get shared vault
        let vault = test::take_shared<AtomicSwapVault<SUI>>(&scenario);
        
        // Test all status check functions on active vault
        let has_expired_active = vault_manager::has_expired(&vault, &clock);
        let can_settle_active = vault_manager::can_settle(&vault, &clock);
        let available_balance = vault_manager::get_available_balance(&vault);
        let revealed_proof = vault_manager::get_revealed_proof(&vault);
        let settlement_history = vault_manager::get_settlement_history(&vault);
        
        debug::print(&std::string::utf8(b"   📊 Active Vault Status Results:"));
        debug::print(&std::string::utf8(b"      ⏰ Has expired (should be false):"));
        debug::print(&(if (has_expired_active) { 1 } else { 0 }));
        debug::print(&std::string::utf8(b"      ✅ Can settle (should be true):"));
        debug::print(&(if (can_settle_active) { 1 } else { 0 }));
        debug::print(&std::string::utf8(b"      💰 Available balance:"));
        debug::print(&available_balance);
        debug::print(&std::string::utf8(b"      🔓 Revealed proof length (should be 0):"));
        debug::print(&std::vector::length(&revealed_proof));
        debug::print(&std::string::utf8(b"      📜 Settlement history count (should be 0):"));
        debug::print(&std::vector::length(&settlement_history));
        
        assert_eq(has_expired_active, false);
        assert_eq(can_settle_active, true);
        assert_eq(available_balance, AMOUNT);
        assert_eq(std::vector::length(&revealed_proof), 0);
        assert_eq(std::vector::length(&settlement_history), 0);
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"🔐 STEP 3: Cryptographic Proof Verification Tests"));
        
        // Test cryptographic proof verification
        let correct_proof_valid = vault_manager::verify_proof(secret_preimage, cryptographic_commitment);
        let wrong_proof_valid = vault_manager::verify_proof(b"wrong_secret_with_sufficient_length", cryptographic_commitment);
        let empty_proof_valid = vault_manager::verify_proof(b"", cryptographic_commitment);
        
        debug::print(&std::string::utf8(b"   🧪 Proof Verification Results:"));
        debug::print(&std::string::utf8(b"      ✅ Correct proof valid:"));
        debug::print(&(if (correct_proof_valid) { 1 } else { 0 }));
        debug::print(&std::string::utf8(b"      ❌ Wrong proof valid:"));
        debug::print(&(if (wrong_proof_valid) { 1 } else { 0 }));
        debug::print(&std::string::utf8(b"      ❌ Empty proof valid:"));
        debug::print(&(if (empty_proof_valid) { 1 } else { 0 }));
        
        assert_eq(correct_proof_valid, true);
        assert_eq(wrong_proof_valid, false);
        assert_eq(empty_proof_valid, false);
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"📋 STEP 4: Comprehensive Vault Information Extraction"));
        
        // Get comprehensive vault information
        let (vault_id, depositor, beneficiary, total_deposit, current_balance, 
             commitment, deadline, status, creation_time, reference) = 
            vault_manager::get_vault_info(&vault);
        
        debug::print(&std::string::utf8(b"   📝 Complete Vault Information:"));
        debug::print(&std::string::utf8(b"      🆔 Internal Vault ID:"));
        debug::print(&vault_id);
        debug::print(&std::string::utf8(b"      👤 Depositor:"));
        debug::print(&depositor);
        debug::print(&std::string::utf8(b"      🎯 Beneficiary:"));
        debug::print(&beneficiary);
        debug::print(&std::string::utf8(b"      💰 Total deposit:"));
        debug::print(&total_deposit);
        debug::print(&std::string::utf8(b"      💵 Current balance:"));
        debug::print(&current_balance);
        debug::print(&std::string::utf8(b"      📏 Commitment length:"));
        debug::print(&std::vector::length(&commitment));
        debug::print(&std::string::utf8(b"      ⏰ Deadline timestamp:"));
        debug::print(&deadline);
        debug::print(&std::string::utf8(b"      📊 Status code:"));
        debug::print(&(status as u64));
        debug::print(&std::string::utf8(b"      🕐 Creation time:"));
        debug::print(&creation_time);
        
        // Verify all information matches expectations
        assert_eq(depositor, DEPOSITOR);
        assert_eq(beneficiary, BENEFICIARY);
        assert_eq(total_deposit, AMOUNT);
        assert_eq(current_balance, AMOUNT);
        assert_eq(commitment, cryptographic_commitment);
        assert_eq(deadline, temporal_deadline);
        assert_eq(status, vault_manager::get_status_active());
        assert_eq(reference, cross_chain_reference);
        
        debug::print(&std::string::utf8(b"      ✅ All information verified correctly!"));
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"💡 COMPREHENSIVE STATUS CHECK INSIGHTS:"));
        debug::print(&std::string::utf8(b"   🔍 Multiple status functions provide complete vault state"));
        debug::print(&std::string::utf8(b"   ⏰ Temporal checks ensure time-based security"));
        debug::print(&std::string::utf8(b"   🔐 Cryptographic verification maintains proof integrity"));
        debug::print(&std::string::utf8(b"   📊 Comprehensive info extraction enables full vault inspection"));
        debug::print(&std::string::utf8(b"   ✅ All checks provide consistent and reliable results"));
        
        test::return_shared(vault);
        clock::destroy_for_testing(clock);
        test::end(scenario);
        debug::print(&std::string::utf8(b""));
    }
}