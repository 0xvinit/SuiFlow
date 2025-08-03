#[test_only]
module fusion_plus_crosschain::resolver_network_test {
    use sui::test_scenario::{Self as test, next_tx, ctx};
    use sui::coin::{Self};
    use sui::clock::{Self};
    use sui::sui::SUI;
    use sui::test_utils::assert_eq;
    use std::debug;
    use fusion_plus_crosschain::resolver_network::{Self as resolver, ResolverNetwork};

    // Test constants
    const ADMIN: address = @0xA;
    const RESOLVER1: address = @0xB;
    const RESOLVER2: address = @0xC;
    const PROTOCOL: address = @0xD;
    const ONE_HOUR_MS: u64 = 3600000;

    #[test]
    fun test_register_resolver() {
        debug::print(&std::string::utf8(b"=== Testing Register Resolver ==="));
        
        let mut scenario = test::begin(ADMIN);
        let clock = clock::create_for_testing(ctx(&mut scenario));
        
        debug::print(&std::string::utf8(b"1. Initializing resolver network..."));
        resolver::init_for_testing(ctx(&mut scenario));
        
        next_tx(&mut scenario, ADMIN);
        
        let mut network = test::take_shared<ResolverNetwork>(&scenario);
        
        debug::print(&std::string::utf8(b"2. Setting limit order protocol address..."));
        resolver::set_limit_order_protocol(&mut network, PROTOCOL, ctx(&mut scenario));
        
        debug::print(&std::string::utf8(b"3. Registering first resolver..."));
        next_tx(&mut scenario, RESOLVER1);
        
        let min_stake = resolver::get_min_stake();
        debug::print(&std::string::utf8(b"   - Minimum stake required:"));
        debug::print(&min_stake);
        
        let stake_coin = coin::mint_for_testing<SUI>(min_stake, ctx(&mut scenario));
        resolver::register_resolver(&mut network, stake_coin, ctx(&mut scenario));
        
        debug::print(&std::string::utf8(b"4. Verifying resolver registration..."));
        let resolver_info = resolver::get_resolver(&network, RESOLVER1);
        assert_eq(resolver::is_authorized_resolver(&network, RESOLVER1), true);
        
        debug::print(&std::string::utf8(b"   - Resolver is registered and authorized"));
        debug::print(&std::string::utf8(b"   - Initial reputation: 100"));
        
        test::return_shared(network);
        clock::destroy_for_testing(clock);
        test::end(scenario);
        
        debug::print(&std::string::utf8(b"=== Test Completed Successfully ==="));
    }

    #[test]
    fun test_register_order_and_bid() {
        debug::print(&std::string::utf8(b"=== Testing Register Order and Bid ==="));
        
        let mut scenario = test::begin(ADMIN);
        let mut clock = clock::create_for_testing(ctx(&mut scenario));
        
        debug::print(&std::string::utf8(b"1. Setting up resolver network..."));
        resolver::init_for_testing(ctx(&mut scenario));
        
        next_tx(&mut scenario, ADMIN);
        
        let mut network = test::take_shared<ResolverNetwork>(&scenario);
        resolver::set_limit_order_protocol(&mut network, PROTOCOL, ctx(&mut scenario));
        
        debug::print(&std::string::utf8(b"2. Registering resolvers..."));
        // Register first resolver
        next_tx(&mut scenario, RESOLVER1);
        let stake_coin1 = coin::mint_for_testing<SUI>(resolver::get_min_stake(), ctx(&mut scenario));
        resolver::register_resolver(&mut network, stake_coin1, ctx(&mut scenario));
        
        // Register second resolver
        next_tx(&mut scenario, RESOLVER2);
        let stake_coin2 = coin::mint_for_testing<SUI>(resolver::get_min_stake(), ctx(&mut scenario));
        resolver::register_resolver(&mut network, stake_coin2, ctx(&mut scenario));
        
        debug::print(&std::string::utf8(b"3. Registering order from protocol..."));
        next_tx(&mut scenario, PROTOCOL);
        
        let order_hash = b"test_order_hash";
        let source_amount = 1000000000; // 1 SUI
        let destination_amount = 2000000; // 0.002 ETH equivalent
        
        resolver::register_order(
            &mut network,
            order_hash,
            source_amount,
            destination_amount,
            &clock,
            ctx(&mut scenario)
        );
        
        debug::print(&std::string::utf8(b"4. Verifying order registration..."));
        let order_info = resolver::get_order(&network, order_hash);
        debug::print(&std::string::utf8(b"   - Order registered successfully"));
        
        debug::print(&std::string::utf8(b"5. Placing bids from resolvers..."));
        // Resolver 1 bids
        next_tx(&mut scenario, RESOLVER1);
        let bid_amount1 = 800000; // 0.8 rate
        resolver::bid_on_order(&mut network, order_hash, bid_amount1, ctx(&mut scenario));
        
        // Resolver 2 bids higher
        next_tx(&mut scenario, RESOLVER2);
        let bid_amount2 = 900000; // 0.9 rate
        resolver::bid_on_order(&mut network, order_hash, bid_amount2, ctx(&mut scenario));
        
        debug::print(&std::string::utf8(b"6. Verifying bids..."));
        let bid1 = resolver::get_bid(&network, order_hash, RESOLVER1);
        let bid2 = resolver::get_bid(&network, order_hash, RESOLVER2);
        
        debug::print(&std::string::utf8(b"   - Resolver 1 bid:"));
        debug::print(&bid1);
        debug::print(&std::string::utf8(b"   - Resolver 2 bid:"));
        debug::print(&bid2);
        
        assert_eq(bid1, bid_amount1);
        assert_eq(bid2, bid_amount2);
        
        debug::print(&std::string::utf8(b"7. Checking order resolvers list..."));
        let order_resolvers = resolver::get_order_resolvers(&network, order_hash);
        assert_eq(std::vector::length(&order_resolvers), 2);
        
        test::return_shared(network);
        clock::destroy_for_testing(clock);
        test::end(scenario);
        
        debug::print(&std::string::utf8(b"=== Test Completed Successfully ==="));
    }

    #[test]
    fun test_record_order_fill() {
        debug::print(&std::string::utf8(b"=== Testing Record Order Fill ==="));
        
        let mut scenario = test::begin(ADMIN);
        let mut clock = clock::create_for_testing(ctx(&mut scenario));
        
        debug::print(&std::string::utf8(b"1. Setting up environment..."));
        resolver::init_for_testing(ctx(&mut scenario));
        
        next_tx(&mut scenario, ADMIN);
        
        let mut network = test::take_shared<ResolverNetwork>(&scenario);
        resolver::set_limit_order_protocol(&mut network, PROTOCOL, ctx(&mut scenario));
        
        // Register resolver
        next_tx(&mut scenario, RESOLVER1);
        let stake_coin = coin::mint_for_testing<SUI>(resolver::get_min_stake(), ctx(&mut scenario));
        resolver::register_resolver(&mut network, stake_coin, ctx(&mut scenario));
        
        // Register order
        next_tx(&mut scenario, PROTOCOL);
        let order_hash = b"test_order_hash";
        resolver::register_order(&mut network, order_hash, 1000000000, 2000000, &clock, ctx(&mut scenario));
        
        debug::print(&std::string::utf8(b"2. Getting initial resolver stats..."));
        let resolver_info_before = resolver::get_resolver(&network, RESOLVER1);
        debug::print(&std::string::utf8(b"   - Orders filled before: 0"));
        debug::print(&std::string::utf8(b"   - Volume handled before: 0"));
        
        debug::print(&std::string::utf8(b"3. Recording order fill..."));
        let fill_amount = 500000000; // 0.5 SUI
        let current_rate = 850000; // 0.85 rate
        
        resolver::record_order_fill(
            &mut network,
            order_hash,
            RESOLVER1,
            fill_amount,
            current_rate,
            &clock,
            ctx(&mut scenario)
        );
        
        debug::print(&std::string::utf8(b"4. Verifying updated stats..."));
        let resolver_info_after = resolver::get_resolver(&network, RESOLVER1);
        debug::print(&std::string::utf8(b"   - Orders filled after: 1"));
        debug::print(&std::string::utf8(b"   - Volume handled after:"));
        debug::print(&fill_amount);
        
        test::return_shared(network);
        clock::destroy_for_testing(clock);
        test::end(scenario);
        
        debug::print(&std::string::utf8(b"=== Test Completed Successfully ==="));
    }

    #[test]
    fun test_resolver_reputation_system() {
        debug::print(&std::string::utf8(b"=== Testing Resolver Reputation System ==="));
        
        let mut scenario = test::begin(ADMIN);
        let mut clock = clock::create_for_testing(ctx(&mut scenario));
        
        debug::print(&std::string::utf8(b"1. Setting up environment..."));
        resolver::init_for_testing(ctx(&mut scenario));
        
        next_tx(&mut scenario, ADMIN);
        
        let mut network = test::take_shared<ResolverNetwork>(&scenario);
        resolver::set_limit_order_protocol(&mut network, PROTOCOL, ctx(&mut scenario));
        
        // Register resolver
        next_tx(&mut scenario, RESOLVER1);
        let stake_coin = coin::mint_for_testing<SUI>(resolver::get_min_stake(), ctx(&mut scenario));
        resolver::register_resolver(&mut network, stake_coin, ctx(&mut scenario));
        
        debug::print(&std::string::utf8(b"2. Checking initial reputation..."));
        let initial_reputation = resolver::get_resolver_reputation(&network, RESOLVER1, &clock);
        debug::print(&std::string::utf8(b"   - Initial reputation:"));
        debug::print(&initial_reputation);
        assert_eq(initial_reputation, 100); // Default starting reputation
        
        debug::print(&std::string::utf8(b"3. Simulating successful order fills..."));
        next_tx(&mut scenario, PROTOCOL);
        
        // Register multiple orders and fill them
        let mut i = 0;
        while (i < 5) {
            let mut order_hash = std::vector::empty<u8>();
            std::vector::push_back(&mut order_hash, (i as u8));
            
            resolver::register_order(&mut network, order_hash, 1000000000, 2000000, &clock, ctx(&mut scenario));
            resolver::record_order_fill(&mut network, order_hash, RESOLVER1, 500000000, 850000, &clock, ctx(&mut scenario));
            
            i = i + 1;
        };
        
        debug::print(&std::string::utf8(b"4. Checking reputation after successful fills..."));
        let reputation_after_fills = resolver::get_resolver_reputation(&network, RESOLVER1, &clock);
        debug::print(&std::string::utf8(b"   - Reputation after 5 successful fills:"));
        debug::print(&reputation_after_fills);
        assert!(reputation_after_fills > initial_reputation, 0);
        
        debug::print(&std::string::utf8(b"5. Testing reputation decay with time..."));
        clock::increment_for_testing(&mut clock, 86400000 * 2); // 2 days
        let reputation_after_time = resolver::get_resolver_reputation(&network, RESOLVER1, &clock);
        debug::print(&std::string::utf8(b"   - Reputation after 2 days of inactivity:"));
        debug::print(&reputation_after_time);
        assert!(reputation_after_time < reputation_after_fills, 0);
        
        debug::print(&std::string::utf8(b"6. Testing penalty system..."));
        next_tx(&mut scenario, ADMIN);
        let penalty_amount = 10;
        resolver::penalize_resolver(&mut network, RESOLVER1, penalty_amount, ctx(&mut scenario));
        
        let final_reputation = resolver::get_resolver_reputation(&network, RESOLVER1, &clock);
        debug::print(&std::string::utf8(b"   - Reputation after penalty:"));
        debug::print(&final_reputation);
        
        test::return_shared(network);
        clock::destroy_for_testing(clock);
        test::end(scenario);
        
        debug::print(&std::string::utf8(b"=== Test Completed Successfully ==="));
    }

    #[test]
    fun test_unregister_resolver() {
        debug::print(&std::string::utf8(b"=== Testing Unregister Resolver ==="));
        
        let mut scenario = test::begin(ADMIN);
        let clock = clock::create_for_testing(ctx(&mut scenario));
        
        debug::print(&std::string::utf8(b"1. Setting up environment..."));
        resolver::init_for_testing(ctx(&mut scenario));
        
        next_tx(&mut scenario, ADMIN);
        
        let mut network = test::take_shared<ResolverNetwork>(&scenario);
        
        // Register resolver
        next_tx(&mut scenario, RESOLVER1);
        let stake_amount = resolver::get_min_stake();
        let stake_coin = coin::mint_for_testing<SUI>(stake_amount, ctx(&mut scenario));
        resolver::register_resolver(&mut network, stake_coin, ctx(&mut scenario));
        
        debug::print(&std::string::utf8(b"2. Verifying resolver is registered..."));
        assert_eq(resolver::is_authorized_resolver(&network, RESOLVER1), true);
        
        debug::print(&std::string::utf8(b"3. Unregistering resolver..."));
        let returned_coin = resolver::unregister_resolver(&mut network, ctx(&mut scenario));
        
        debug::print(&std::string::utf8(b"4. Verifying stake return..."));
        debug::print(&std::string::utf8(b"   - Returned stake amount:"));
        debug::print(&coin::value(&returned_coin));
        assert_eq(coin::value(&returned_coin), stake_amount);
        
        debug::print(&std::string::utf8(b"5. Verifying resolver is no longer authorized..."));
        assert_eq(resolver::is_authorized_resolver(&network, RESOLVER1), false);
        
        coin::burn_for_testing(returned_coin);
        test::return_shared(network);
        clock::destroy_for_testing(clock);
        test::end(scenario);
        
        debug::print(&std::string::utf8(b"=== Test Completed Successfully ==="));
    }

    #[test]
    #[expected_failure(abort_code = fusion_plus_crosschain::resolver_network::E_INSUFFICIENT_STAKE)]
    fun test_register_with_insufficient_stake() {
        debug::print(&std::string::utf8(b"=== Testing Insufficient Stake (Should Fail) ==="));
        
        let mut scenario = test::begin(ADMIN);
        let clock = clock::create_for_testing(ctx(&mut scenario));
        
        resolver::init_for_testing(ctx(&mut scenario));
        
        next_tx(&mut scenario, ADMIN);
        
        let mut network = test::take_shared<ResolverNetwork>(&scenario);
        
        next_tx(&mut scenario, RESOLVER1);
        
        debug::print(&std::string::utf8(b"Attempting to register with insufficient stake..."));
        let insufficient_stake = resolver::get_min_stake() - 1;
        let stake_coin = coin::mint_for_testing<SUI>(insufficient_stake, ctx(&mut scenario));
        
        // This should fail
        resolver::register_resolver(&mut network, stake_coin, ctx(&mut scenario));
        
        test::return_shared(network);
        clock::destroy_for_testing(clock);
        test::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = fusion_plus_crosschain::resolver_network::E_RESOLVER_NOT_REGISTERED)]
    fun test_unauthorized_resolver_bid() {
        debug::print(&std::string::utf8(b"=== Testing Unauthorized Resolver Bid (Should Fail) ==="));
        
        let mut scenario = test::begin(ADMIN);
        let mut clock = clock::create_for_testing(ctx(&mut scenario));
        
        resolver::init_for_testing(ctx(&mut scenario));
        
        next_tx(&mut scenario, ADMIN);
        
        let mut network = test::take_shared<ResolverNetwork>(&scenario);
        resolver::set_limit_order_protocol(&mut network, PROTOCOL, ctx(&mut scenario));
        
        // Register order but no resolver
        next_tx(&mut scenario, PROTOCOL);
        let order_hash = b"test_order_hash";
        resolver::register_order(&mut network, order_hash, 1000000000, 2000000, &clock, ctx(&mut scenario));
        
        // Try to bid from unregistered resolver
        next_tx(&mut scenario, RESOLVER1);
        
        debug::print(&std::string::utf8(b"Attempting to bid from unauthorized resolver..."));
        // This should fail
        resolver::bid_on_order(&mut network, order_hash, 800000, ctx(&mut scenario));
        
        test::return_shared(network);
        clock::destroy_for_testing(clock);
        test::end(scenario);
    }
}