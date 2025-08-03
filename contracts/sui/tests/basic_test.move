#[test_only]
module fusion_plus_crosschain::basic_test {
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
    const DEPOSITOR: address = @0xA;    // The person creating the vault (depositing funds)
    const BENEFICIARY: address = @0xB;  // The person who can claim the funds with correct proof
    const AMOUNT: u64 = 1000000000;     // 1 SUI (in nano SUI units - 1 SUI = 10^9 nano SUI)
    const ONE_HOUR_MS: u64 = 3600000;   // 1 hour in milliseconds for time constraints

    #[test]
    fun test_create_and_settle_vault_with_detailed_logging() {
        debug::print(&std::string::utf8(b"🧪 === STARTING COMPREHENSIVE VAULT TEST ==="));
        debug::print(&std::string::utf8(b"📚 This test demonstrates the complete lifecycle of an AtomicSwapVault"));
        debug::print(&std::string::utf8(b""));
        
        let mut scenario = test::begin(DEPOSITOR);
        let mut clock = clock::create_for_testing(ctx(&mut scenario));
        
        debug::print(&std::string::utf8(b"⚙️  STEP 1: SYSTEM INITIALIZATION"));
        debug::print(&std::string::utf8(b"   - Initializing the AtomicSwapVault system..."));
        debug::print(&std::string::utf8(b"   - This creates a global registry to track all proofs"));
        
        // Initialize the vault system
        vault_manager::init_for_testing(ctx(&mut scenario));
        
        next_tx(&mut scenario, DEPOSITOR);
        
        debug::print(&std::string::utf8(b"✅ System initialized successfully!"));
        debug::print(&std::string::utf8(b""));
        
        debug::print(&std::string::utf8(b"🔐 STEP 2: CRYPTOGRAPHIC SETUP"));
        debug::print(&std::string::utf8(b"   - Creating a secret preimage (like a password)"));
        debug::print(&std::string::utf8(b"   - Generating cryptographic commitment (hash of the secret)"));
        debug::print(&std::string::utf8(b"   - Only someone with the original secret can unlock the vault"));
        
        // Create cryptographic proof system
        let secret_preimage = b"ultra_secure_secret_for_atomic_swap_demo_2024";
        debug::print(&std::string::utf8(b"   📝 Secret created (hidden in real scenarios)"));
        
        let cryptographic_commitment = cryptographic_proof::create_commitment(secret_preimage);
        debug::print(&std::string::utf8(b"   🔒 Cryptographic commitment generated"));
        debug::print(&std::string::utf8(b"   📏 Commitment length:"));
        debug::print(&std::vector::length(&cryptographic_commitment));
        
        // Set up temporal constraint
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"⏰ STEP 3: TEMPORAL CONSTRAINT SETUP"));
        debug::print(&std::string::utf8(b"   - Setting up time-based access control"));
        debug::print(&std::string::utf8(b"   - Vault will expire after 1 hour if not settled"));
        
        let current_time = clock::timestamp_ms(&clock);
        let temporal_deadline = temporal_constraint::create_deadline(ONE_HOUR_MS, &clock);
        debug::print(&std::string::utf8(b"   🕐 Current time (ms):"));
        debug::print(&current_time);
        debug::print(&std::string::utf8(b"   ⏳ Deadline set to (ms):"));
        debug::print(&temporal_deadline);
        debug::print(&std::string::utf8(b"   ⏱️  Time until expiry (ms):"));
        debug::print(&(temporal_deadline - current_time));
        
        // Create test coin
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"💰 STEP 4: FUNDING PREPARATION"));
        let coin = coin::mint_for_testing<SUI>(AMOUNT, ctx(&mut scenario));
        debug::print(&std::string::utf8(b"   💵 Minted test coin with value:"));
        debug::print(&coin::value(&coin));
        debug::print(&std::string::utf8(b"   💡 This represents 1 SUI (1,000,000,000 nano SUI)"));
        
        let cross_chain_reference = string::utf8(b"ETH_ORDER_0x1234567890abcdef");
        debug::print(&std::string::utf8(b"   🔗 Cross-chain reference created for order tracking"));
        
        // Create vault
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"🏦 STEP 5: VAULT CREATION"));
        debug::print(&std::string::utf8(b"   - Creating atomic swap vault with all parameters"));
        debug::print(&std::string::utf8(b"   - Depositor: Creates and funds the vault"));
        debug::print(&std::string::utf8(b"   - Beneficiary: Can claim funds with correct proof"));
        
        let mut registry = test::take_shared<ConsumedProofRegistry>(&scenario);
        let (vault_counter_before, settlements_before) = vault_manager::get_registry_stats(&registry);
        debug::print(&std::string::utf8(b"   📊 Registry stats before vault creation:"));
        debug::print(&std::string::utf8(b"      - Total vaults created:"));
        debug::print(&vault_counter_before);
        debug::print(&std::string::utf8(b"      - Total settlements:"));
        debug::print(&settlements_before);
        
        let vault_id = vault_manager::create_and_share_vault<SUI>(
            coin,
            BENEFICIARY,
            cryptographic_commitment,
            temporal_deadline,
            cross_chain_reference,
            &mut registry,
            &clock,
            ctx(&mut scenario)
        );
        
        let (vault_counter_after, settlements_after) = vault_manager::get_registry_stats(&registry);
        debug::print(&std::string::utf8(b"   📊 Registry stats after vault creation:"));
        debug::print(&std::string::utf8(b"      - Total vaults created:"));
        debug::print(&vault_counter_after);
        debug::print(&std::string::utf8(b"      - Total settlements:"));
        debug::print(&settlements_after);
        
        debug::print(&std::string::utf8(b"✅ Vault created successfully!"));
        debug::print(&std::string::utf8(b"   🆔 Vault ID:"));
        debug::print(&sui::object::id_to_address(&vault_id));
        
        test::return_shared(registry);
        
        // Switch to beneficiary
        next_tx(&mut scenario, BENEFICIARY);
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"🔍 STEP 6: VAULT INSPECTION"));
        debug::print(&std::string::utf8(b"   - Examining vault properties and status"));
        debug::print(&std::string::utf8(b"   - Verifying all parameters are correctly stored"));
        
        // Get shared objects for inspection
        let mut vault = test::take_shared<AtomicSwapVault<SUI>>(&scenario);
        let mut registry = test::take_shared<ConsumedProofRegistry>(&scenario);
        
        // Inspect vault properties
        let (vault_id_stored, depositor, beneficiary, total_deposit, available_balance, 
             stored_commitment, stored_deadline, status, creation_time, stored_reference) = 
            vault_manager::get_vault_info(&vault);
        
        debug::print(&std::string::utf8(b"   📋 Vault Properties:"));
        debug::print(&std::string::utf8(b"      - Vault ID:"));
        debug::print(&vault_id_stored);
        debug::print(&std::string::utf8(b"      - Depositor:"));
        debug::print(&depositor);
        debug::print(&std::string::utf8(b"      - Beneficiary:"));
        debug::print(&beneficiary);
        debug::print(&std::string::utf8(b"      - Total Deposit:"));
        debug::print(&total_deposit);
        debug::print(&std::string::utf8(b"      - Available Balance:"));
        debug::print(&available_balance);
        debug::print(&std::string::utf8(b"      - Status (0=Active, 1=Settled, 2=Refunded):"));
        debug::print(&(status as u64));
        debug::print(&std::string::utf8(b"      - Creation Time:"));
        debug::print(&creation_time);
        
        // Verify all properties
        assert_eq(depositor, DEPOSITOR);
        assert_eq(beneficiary, BENEFICIARY);
        assert_eq(total_deposit, AMOUNT);
        assert_eq(available_balance, AMOUNT);
        assert_eq(stored_commitment, cryptographic_commitment);
        assert_eq(stored_deadline, temporal_deadline);
        assert_eq(status, vault_manager::get_status_active());
        assert_eq(stored_reference, cross_chain_reference);
        
        debug::print(&std::string::utf8(b"✅ All vault properties verified correctly!"));
        
        // Check vault status functions
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"🔧 STEP 7: VAULT STATUS CHECKS"));
        let has_expired = vault_manager::has_expired(&vault, &clock);
        let can_settle = vault_manager::can_settle(&vault, &clock);
        debug::print(&std::string::utf8(b"   ⏰ Has vault expired?"));
        debug::print(&(if (has_expired) { 1 } else { 0 }));
        debug::print(&std::string::utf8(b"   ✅ Can vault be settled?"));
        debug::print(&(if (can_settle) { 1 } else { 0 }));
        
        assert_eq(has_expired, false);
        assert_eq(can_settle, true);
        
        // Verify cryptographic proof before settlement
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"🔐 STEP 8: CRYPTOGRAPHIC VERIFICATION"));
        debug::print(&std::string::utf8(b"   - Testing proof verification before settlement"));
        debug::print(&std::string::utf8(b"   - This ensures only correct secret holders can claim funds"));
        
        let proof_valid = vault_manager::verify_proof(secret_preimage, cryptographic_commitment);
        debug::print(&std::string::utf8(b"   ✅ Proof verification result:"));
        debug::print(&(if (proof_valid) { 1 } else { 0 }));
        assert_eq(proof_valid, true);
        
        let wrong_preimage = b"wrong_secret_should_fail";
        let wrong_proof_valid = vault_manager::verify_proof(wrong_preimage, cryptographic_commitment);
        debug::print(&std::string::utf8(b"   ❌ Wrong proof verification result:"));
        debug::print(&(if (wrong_proof_valid) { 1 } else { 0 }));
        assert_eq(wrong_proof_valid, false);
        
        // Settlement process
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"💸 STEP 9: VAULT SETTLEMENT"));
        debug::print(&std::string::utf8(b"   - Beneficiary is now settling the vault with correct proof"));
        debug::print(&std::string::utf8(b"   - This is the atomic swap completion on SUI side"));
        
        let revealed_proof_before = vault_manager::get_revealed_proof(&vault);
        debug::print(&std::string::utf8(b"   🔍 Revealed proof before settlement (should be empty):"));
        debug::print(&std::vector::length(&revealed_proof_before));
        
        let settlement_coin = vault_manager::settle_vault_complete(
            &mut vault,
            &mut registry,
            secret_preimage,
            &clock,
            ctx(&mut scenario)
        );
        
        debug::print(&std::string::utf8(b"✅ Vault settled successfully!"));
        debug::print(&std::string::utf8(b"   💰 Settlement amount received:"));
        debug::print(&coin::value(&settlement_coin));
        
        // Verify settlement effects
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"🔍 STEP 10: POST-SETTLEMENT VERIFICATION"));
        
        let available_balance_after = vault_manager::get_available_balance(&vault);
        let revealed_proof_after = vault_manager::get_revealed_proof(&vault);
        let settlement_history = vault_manager::get_settlement_history(&vault);
        
        debug::print(&std::string::utf8(b"   📊 Post-settlement vault state:"));
        debug::print(&std::string::utf8(b"      - Available balance (should be 0):"));
        debug::print(&available_balance_after);
        debug::print(&std::string::utf8(b"      - Revealed proof length:"));
        debug::print(&std::vector::length(&revealed_proof_after));
        debug::print(&std::string::utf8(b"      - Settlement history count:"));
        debug::print(&std::vector::length(&settlement_history));
        
        // Check if proof is now consumed in registry
        let is_proof_consumed = vault_manager::is_proof_consumed(&registry, &secret_preimage);
        debug::print(&std::string::utf8(b"   🔒 Is proof consumed in registry?"));
        debug::print(&(if (is_proof_consumed) { 1 } else { 0 }));
        
        let (final_vault_count, final_settlements) = vault_manager::get_registry_stats(&registry);
        debug::print(&std::string::utf8(b"   📈 Final registry statistics:"));
        debug::print(&std::string::utf8(b"      - Total vaults:"));
        debug::print(&final_vault_count);
        debug::print(&std::string::utf8(b"      - Total settlements:"));
        debug::print(&final_settlements);
        
        // Verify all settlement effects
        assert_eq(coin::value(&settlement_coin), AMOUNT);
        assert_eq(available_balance_after, 0);
        assert_eq(revealed_proof_after, secret_preimage);
        assert_eq(is_proof_consumed, true);
        assert_eq(std::vector::length(&settlement_history), 1);
        assert_eq(final_settlements, settlements_before + 1);
        
        debug::print(&std::string::utf8(b"✅ All post-settlement verifications passed!"));
        
        // Cleanup
        coin::burn_for_testing(settlement_coin);
        test::return_shared(vault);
        test::return_shared(registry);
        clock::destroy_for_testing(clock);
        test::end(scenario);
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"🎉 === TEST COMPLETED SUCCESSFULLY ==="));
        debug::print(&std::string::utf8(b"📚 WHAT YOU LEARNED:"));
        debug::print(&std::string::utf8(b"   1. How to create atomic swap vaults with cryptographic commitments"));
        debug::print(&std::string::utf8(b"   2. How temporal constraints protect against indefinite locks"));
        debug::print(&std::string::utf8(b"   3. How cryptographic proofs ensure only authorized parties can claim"));
        debug::print(&std::string::utf8(b"   4. How the registry prevents replay attacks with consumed proofs"));
        debug::print(&std::string::utf8(b"   5. How settlement history provides complete audit trails"));
        debug::print(&std::string::utf8(b""));
    }

    #[test]
    fun test_cryptographic_proof_system_with_explanations() {
        debug::print(&std::string::utf8(b"🔐 === CRYPTOGRAPHIC PROOF SYSTEM TEST ==="));
        debug::print(&std::string::utf8(b"📚 Understanding how cryptographic commitments work in atomic swaps"));
        debug::print(&std::string::utf8(b""));
        
        debug::print(&std::string::utf8(b"🧪 EXPERIMENT 1: Basic Proof Creation and Verification"));
        
        let secret = b"my_secret_atomic_swap_key";
        debug::print(&std::string::utf8(b"   🔑 Created secret (length):"));
        debug::print(&std::vector::length(&secret));
        
        let commitment = vault_manager::create_commitment(secret);
        debug::print(&std::string::utf8(b"   🔒 Generated commitment (SHA3-256 hash length):"));
        debug::print(&std::vector::length(&commitment));
        debug::print(&std::string::utf8(b"   💡 Commitment hides the secret but allows verification"));
        
        // Test correct proof
        let proof_result = vault_manager::verify_proof(secret, commitment);
        debug::print(&std::string::utf8(b"   ✅ Correct secret verification:"));
        debug::print(&(if (proof_result) { 1 } else { 0 }));
        assert_eq(proof_result, true);
        
        // Test wrong proof
        let wrong_secret = b"wrong_secret_key";
        let wrong_proof_result = vault_manager::verify_proof(wrong_secret, commitment);
        debug::print(&std::string::utf8(b"   ❌ Wrong secret verification:"));
        debug::print(&(if (wrong_proof_result) { 1 } else { 0 }));
        assert_eq(wrong_proof_result, false);
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"🧪 EXPERIMENT 2: Batch Cryptographic Operations"));
        debug::print(&std::string::utf8(b"   📝 Creating multiple commitments at once (useful for complex swaps)"));
        
        let secrets = vector[
            b"secret_for_btc_swap",
            b"secret_for_eth_swap", 
            b"secret_for_ada_swap"
        ];
        
        let commitments = vault_manager::batch_create_commitments(secrets);
        debug::print(&std::string::utf8(b"   📦 Batch created commitments count:"));
        debug::print(&std::vector::length(&commitments));
        
        // Verify each commitment works
        let mut i = 0;
        while (i < std::vector::length(&commitments)) {
            let secret = if (i == 0) { b"secret_for_btc_swap" } else if (i == 1) { b"secret_for_eth_swap" } else { b"secret_for_ada_swap" };
            let commitment = *std::vector::borrow(&commitments, i);
            let is_valid = vault_manager::verify_proof(secret, commitment);
            debug::print(&std::string::utf8(b"   ✅ Batch commitment verification:"));
            debug::print(&i);
            debug::print(&(if (is_valid) { 1 } else { 0 }));
            assert_eq(is_valid, true);
            i = i + 1;
        };
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"💡 KEY TAKEAWAYS:"));
        debug::print(&std::string::utf8(b"   - Commitments allow proving knowledge without revealing secrets"));
        debug::print(&std::string::utf8(b"   - Only someone with the original preimage can unlock funds"));
        debug::print(&std::string::utf8(b"   - Batch operations enable complex multi-asset swaps"));
        debug::print(&std::string::utf8(b"   - SHA3-256 provides cryptographic security for commitments"));
        debug::print(&std::string::utf8(b""));
    }

    #[test]
    fun test_temporal_constraints_with_detailed_explanation() {
        debug::print(&std::string::utf8(b"⏰ === TEMPORAL CONSTRAINT SYSTEM TEST ==="));
        debug::print(&std::string::utf8(b"📚 Understanding time-based access control in atomic swaps"));
        debug::print(&std::string::utf8(b""));
        
        let mut scenario = test::begin(DEPOSITOR);
        let mut clock = clock::create_for_testing(ctx(&mut scenario));
        
        debug::print(&std::string::utf8(b"🕐 TIMELINE DEMONSTRATION:"));
        let start_time = clock::timestamp_ms(&clock);
        debug::print(&std::string::utf8(b"   📅 Test start time (ms):"));
        debug::print(&start_time);
        
        // Test different deadline scenarios
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"⏳ SCENARIO 1: Standard 1-hour deadline"));
        let standard_deadline = temporal_constraint::create_deadline(
            temporal_constraint::get_standard_duration(), 
            &clock
        );
        debug::print(&std::string::utf8(b"   ⏰ Standard deadline (ms):"));
        debug::print(&standard_deadline);
        debug::print(&std::string::utf8(b"   ⏱️  Duration (ms):"));
        debug::print(&(standard_deadline - start_time));
        debug::print(&std::string::utf8(b"   🕐 Duration (minutes):"));
        debug::print(&((standard_deadline - start_time) / 60000));
        
        let is_valid = temporal_constraint::is_valid_deadline(standard_deadline, &clock);
        let is_active = temporal_constraint::is_active(standard_deadline, &clock);
        let has_expired = temporal_constraint::has_expired(standard_deadline, &clock);
        
        debug::print(&std::string::utf8(b"   ✅ Is deadline valid?"));
        debug::print(&(if (is_valid) { 1 } else { 0 }));
        debug::print(&std::string::utf8(b"   🟢 Is constraint active?"));
        debug::print(&(if (is_active) { 1 } else { 0 }));
        debug::print(&std::string::utf8(b"   ❌ Has deadline expired?"));
        debug::print(&(if (has_expired) { 1 } else { 0 }));
        
        assert_eq(is_valid, true);
        assert_eq(is_active, true);
        assert_eq(has_expired, false);
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"⏳ SCENARIO 2: Time passage simulation"));
        debug::print(&std::string::utf8(b"   ⏩ Advancing time by 30 minutes..."));
        clock::increment_for_testing(&mut clock, 1800000); // 30 minutes
        
        let current_time = clock::timestamp_ms(&clock);
        let remaining_time = temporal_constraint::remaining_duration(standard_deadline, &clock);
        
        debug::print(&std::string::utf8(b"   🕐 Current time after advance:"));
        debug::print(&current_time);
        debug::print(&std::string::utf8(b"   ⏰ Remaining time (ms):"));
        debug::print(&remaining_time);
        debug::print(&std::string::utf8(b"   🕐 Remaining time (minutes):"));
        debug::print(&(remaining_time / 60000));
        
        let still_active = temporal_constraint::is_active(standard_deadline, &clock);
        debug::print(&std::string::utf8(b"   🟢 Still active after 30 min?"));
        debug::print(&(if (still_active) { 1 } else { 0 }));
        assert_eq(still_active, true);
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"⏳ SCENARIO 3: Deadline expiration"));
        debug::print(&std::string::utf8(b"   ⏩ Advancing time past deadline..."));
        clock::increment_for_testing(&mut clock, 2000000); // 33+ more minutes (past 1 hour total)
        
        let final_time = clock::timestamp_ms(&clock);
        let is_expired_now = temporal_constraint::has_expired(standard_deadline, &clock);
        let is_active_now = temporal_constraint::is_active(standard_deadline, &clock);
        let remaining_now = temporal_constraint::remaining_duration(standard_deadline, &clock);
        
        debug::print(&std::string::utf8(b"   🕐 Final time:"));
        debug::print(&final_time);
        debug::print(&std::string::utf8(b"   📊 Total elapsed (minutes):"));
        debug::print(&((final_time - start_time) / 60000));
        debug::print(&std::string::utf8(b"   ❌ Has expired now?"));
        debug::print(&(if (is_expired_now) { 1 } else { 0 }));
        debug::print(&std::string::utf8(b"   🔴 Is active now?"));
        debug::print(&(if (is_active_now) { 1 } else { 0 }));
        debug::print(&std::string::utf8(b"   ⏰ Remaining time (should be 0):"));
        debug::print(&remaining_now);
        
        assert_eq(is_expired_now, true);
        assert_eq(is_active_now, false);
        assert_eq(remaining_now, 0);
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"💡 TEMPORAL CONSTRAINT INSIGHTS:"));
        debug::print(&std::string::utf8(b"   - Time constraints prevent indefinite fund locks"));
        debug::print(&std::string::utf8(b"   - Expired vaults allow depositors to reclaim funds"));
        debug::print(&std::string::utf8(b"   - Active constraints protect both parties in atomic swaps"));
        debug::print(&std::string::utf8(b"   - Standard duration (1 hour) balances security and usability"));
        
        clock::destroy_for_testing(clock);
        test::end(scenario);
        debug::print(&std::string::utf8(b""));
    }

    #[test]
    fun test_vault_refund_scenario_with_explanation() {
        debug::print(&std::string::utf8(b"🔄 === VAULT REFUND SCENARIO TEST ==="));
        debug::print(&std::string::utf8(b"📚 Understanding how depositors can reclaim funds from expired vaults"));
        debug::print(&std::string::utf8(b""));
        
        let mut scenario = test::begin(DEPOSITOR);
        let mut clock = clock::create_for_testing(ctx(&mut scenario));
        
        // Initialize system
        vault_manager::init_for_testing(ctx(&mut scenario));
        next_tx(&mut scenario, DEPOSITOR);
        
        debug::print(&std::string::utf8(b"🏦 STEP 1: Creating vault that will expire"));
        
        let secret_preimage = b"secret_that_will_never_be_revealed";
        let cryptographic_commitment = cryptographic_proof::create_commitment(secret_preimage);
        let temporal_deadline = temporal_constraint::create_deadline(
            temporal_constraint::get_standard_duration(), 
            &clock
        );
        let coin = coin::mint_for_testing<SUI>(AMOUNT, ctx(&mut scenario));
        let cross_chain_reference = string::utf8(b"FAILED_SWAP_ORDER_0xdeadbeef");
        
        let mut registry = test::take_shared<ConsumedProofRegistry>(&scenario);
        
        debug::print(&std::string::utf8(b"   💰 Deposit amount:"));
        let amount_value = AMOUNT;
        debug::print(&amount_value);
        debug::print(&std::string::utf8(b"   ⏰ Deadline set for 1 hour from now"));
        debug::print(&std::string::utf8(b"   🎯 Simulating a failed cross-chain swap scenario"));
        
        vault_manager::create_and_share_vault<SUI>(
            coin,
            BENEFICIARY,
            cryptographic_commitment,
            temporal_deadline,
            cross_chain_reference,
            &mut registry,
            &clock,
            ctx(&mut scenario)
        );
        
        test::return_shared(registry);
        
        debug::print(&std::string::utf8(b"✅ Failed swap vault created"));
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"⏭️  STEP 2: Time passage simulation"));
        debug::print(&std::string::utf8(b"   ⏰ Scenario: Cross-chain swap partner never provides proof"));
        debug::print(&std::string::utf8(b"   ⏳ Waiting for deadline to pass..."));
        
        // Advance time past deadline
        clock::increment_for_testing(&mut clock, ONE_HOUR_MS + 1000);
        
        let current_time = clock::timestamp_ms(&clock);
        debug::print(&std::string::utf8(b"   🕐 Time advanced past deadline"));
        debug::print(&std::string::utf8(b"   📊 Current timestamp:"));
        debug::print(&current_time);
        
        next_tx(&mut scenario, DEPOSITOR);
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"🔍 STEP 3: Vault status verification"));
        
        let mut vault = test::take_shared<AtomicSwapVault<SUI>>(&scenario);
        
        let has_expired = vault_manager::has_expired(&vault, &clock);
        let can_settle = vault_manager::can_settle(&vault, &clock);
        let available_balance = vault_manager::get_available_balance(&vault);
        
        debug::print(&std::string::utf8(b"   ❌ Has vault expired?"));
        debug::print(&(if (has_expired) { 1 } else { 0 }));
        debug::print(&std::string::utf8(b"   🚫 Can vault still be settled?"));
        debug::print(&(if (can_settle) { 1 } else { 0 }));
        debug::print(&std::string::utf8(b"   💰 Available balance for refund:"));
        debug::print(&available_balance);
        
        assert_eq(has_expired, true);
        assert_eq(can_settle, false);
        assert_eq(available_balance, AMOUNT);
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"💸 STEP 4: Executing refund"));
        debug::print(&std::string::utf8(b"   🔄 Depositor reclaiming funds from expired vault"));
        debug::print(&std::string::utf8(b"   ⚖️  This protects depositors from permanent fund loss"));
        
        let refund_coin = vault_manager::refund_vault(
            &mut vault,
            &clock,
            ctx(&mut scenario)
        );
        
        debug::print(&std::string::utf8(b"✅ Refund executed successfully!"));
        debug::print(&std::string::utf8(b"   💰 Refund amount:"));
        debug::print(&coin::value(&refund_coin));
        
        // Verify refund effects
        let balance_after_refund = vault_manager::get_available_balance(&vault);
        let (_, _, _, _, _, _, _, status_after, _, _) = vault_manager::get_vault_info(&vault);
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"🔍 STEP 5: Post-refund verification"));
        debug::print(&std::string::utf8(b"   💰 Vault balance after refund:"));
        debug::print(&balance_after_refund);
        debug::print(&std::string::utf8(b"   📊 Vault status (2=Refunded):"));
        debug::print(&(status_after as u64));
        
        assert_eq(coin::value(&refund_coin), AMOUNT);
        assert_eq(balance_after_refund, 0);
        assert_eq(status_after, vault_manager::get_status_refunded());
        
        debug::print(&std::string::utf8(b""));
        debug::print(&std::string::utf8(b"💡 REFUND MECHANISM INSIGHTS:"));
        debug::print(&std::string::utf8(b"   - Expired vaults protect depositors from permanent loss"));
        debug::print(&std::string::utf8(b"   - Only original depositors can claim refunds"));
        debug::print(&std::string::utf8(b"   - Refund changes vault status to prevent double-spending"));
        debug::print(&std::string::utf8(b"   - Time constraints balance security with fund safety"));
        
        // Cleanup
        coin::burn_for_testing(refund_coin);
        test::return_shared(vault);
        clock::destroy_for_testing(clock);
        test::end(scenario);
        
        debug::print(&std::string::utf8(b"✅ Refund scenario test completed successfully!"));
        debug::print(&std::string::utf8(b""));
    }
}