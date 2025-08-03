#[test_only]
module fusion_plus_crosschain::limit_order_protocol_test {
    use sui::test_scenario::{Self as test, next_tx, ctx};
    use sui::coin::{Self};
    use sui::clock::{Self};
    use sui::sui::SUI;
    use sui::test_utils::assert_eq;
    use std::debug;
    use fusion_plus_crosschain::limit_order_protocol::{Self as protocol, LimitOrderProtocol};
    use fusion_plus_crosschain::dutch_auction::{Self as auction, DutchAuction};
    use fusion_plus_crosschain::resolver_network::{Self as resolver, ResolverNetwork};

    // Test constants
    const MAKER: address = @0xA;
    const RESOLVER: address = @0xB;
    const AMOUNT: u64 = 1000000000; // 1 SUI (9 decimals)
    const DESTINATION_AMOUNT: u64 = 2000000; // 0.002 ETH equivalent
    const ONE_HOUR_MS: u64 = 3600000;
    const START_RATE: u64 = 1000000; // 1.0 with 6 decimal precision
    const END_RATE: u64 = 800000; // 0.8 with 6 decimal precision

    #[test]
    fun test_create_limit_order() {
        debug::print(&std::string::utf8(b"=== Testing Create Limit Order ==="));
        
        let mut scenario = test::begin(MAKER);
        let mut clock = clock::create_for_testing(ctx(&mut scenario));
        
        debug::print(&std::string::utf8(b"1. Initializing limit order protocol..."));
        // Initialize protocol
        protocol::init_for_testing(ctx(&mut scenario));
        
        next_tx(&mut scenario, MAKER);
        
        let mut limit_protocol = test::take_shared<LimitOrderProtocol<SUI>>(&scenario);
        
        debug::print(&std::string::utf8(b"2. Creating limit order with parameters:"));
        debug::print(&std::string::utf8(b"   - Source Amount: 1 SUI"));
        debug::print(&std::string::utf8(b"   - Destination Amount: 0.002 ETH"));
        debug::print(&std::string::utf8(b"   - Start Rate: 1.0"));
        debug::print(&std::string::utf8(b"   - End Rate: 0.8"));
        
        let coin = coin::mint_for_testing<SUI>(AMOUNT, ctx(&mut scenario));
        let current_time = clock::timestamp_ms(&clock);
        let auction_start_time = current_time + 1000;
        let auction_end_time = auction_start_time + ONE_HOUR_MS;
        
        let order_hash = protocol::create_cross_chain_order<SUI>(
            &mut limit_protocol,
            coin,
            DESTINATION_AMOUNT,
            auction_start_time,
            auction_end_time,
            START_RATE,
            END_RATE,
            0, // Auto-calculate decrease rate
            &clock,
            ctx(&mut scenario)
        );
        
        debug::print(&std::string::utf8(b"3. Order created successfully!"));
        debug::print(&std::string::utf8(b"   - Order hash length:"));
        debug::print(&(std::vector::length(&order_hash) as u64));
        
        // Verify order hash is not empty
        assert!(std::vector::length(&order_hash) > 0, 0);
        
        test::return_shared(limit_protocol);
        clock::destroy_for_testing(clock);
        test::end(scenario);
        
        debug::print(&std::string::utf8(b"=== Test Completed Successfully ==="));
    }

    #[test]
    fun test_fill_limit_order() {
        debug::print(&std::string::utf8(b"=== Testing Fill Limit Order ==="));
        
        let mut scenario = test::begin(MAKER);
        let mut clock = clock::create_for_testing(ctx(&mut scenario));
        
        debug::print(&std::string::utf8(b"1. Setting up test environment..."));
        // Initialize all required protocols
        protocol::init_for_testing(ctx(&mut scenario));
        auction::init_for_testing(ctx(&mut scenario));
        resolver::init_for_testing(ctx(&mut scenario));
        
        next_tx(&mut scenario, MAKER);
        
        let mut limit_protocol = test::take_shared<LimitOrderProtocol<SUI>>(&scenario);
        let mut dutch_auction = test::take_shared<DutchAuction>(&scenario);
        let mut resolver_network = test::take_shared<ResolverNetwork>(&scenario);
        
        debug::print(&std::string::utf8(b"2. Creating limit order..."));
        let coin = coin::mint_for_testing<SUI>(AMOUNT, ctx(&mut scenario));
        let current_time = clock::timestamp_ms(&clock);
        let auction_start_time = current_time;
        let auction_end_time = auction_start_time + ONE_HOUR_MS;
        
        let order_hash = protocol::create_cross_chain_order<SUI>(
            &mut limit_protocol,
            coin,
            DESTINATION_AMOUNT,
            auction_start_time,
            auction_end_time,
            START_RATE,
            END_RATE,
            0,
            &clock,
            ctx(&mut scenario)
        );
        
        debug::print(&std::string::utf8(b"3. Setting up auction for the order..."));
        // Create auction for the order
        auction::create_test_auction(
            &mut dutch_auction,
            order_hash,
            auction_start_time,
            auction_end_time,
            START_RATE,
            END_RATE,
            ctx(&mut scenario)
        );
        
        debug::print(&std::string::utf8(b"4. Registering resolver..."));
        // Register resolver
        next_tx(&mut scenario, RESOLVER);
        let stake_coin = coin::mint_for_testing<SUI>(resolver::get_min_stake(), ctx(&mut scenario));
        resolver::register_resolver(&mut resolver_network, stake_coin, ctx(&mut scenario));
        
        debug::print(&std::string::utf8(b"5. Attempting to fill order..."));
        next_tx(&mut scenario, RESOLVER);
        
        let mut order = test::take_shared<fusion_plus_crosschain::limit_order_protocol::LimitOrder<SUI>>(&scenario);
        
        let secret = b"test_secret_with_sufficient_length_for_testing";
        let received_coin = protocol::fill_limit_order<SUI>(
            &mut limit_protocol,
            &mut order,
            &dutch_auction,
            &resolver_network,
            secret,
            &clock,
            ctx(&mut scenario)
        );
        
        debug::print(&std::string::utf8(b"6. Order filled successfully!"));
        debug::print(&std::string::utf8(b"   - Received amount:"));
        debug::print(&coin::value(&received_coin));
        
        // Verify we received some coins
        assert!(coin::value(&received_coin) > 0, 0);
        
        coin::burn_for_testing(received_coin);
        test::return_shared(order);
        test::return_shared(limit_protocol);
        test::return_shared(dutch_auction);
        test::return_shared(resolver_network);
        clock::destroy_for_testing(clock);
        test::end(scenario);
        
        debug::print(&std::string::utf8(b"=== Test Completed Successfully ==="));
    }

    #[test]
    fun test_cancel_order() {
        debug::print(&std::string::utf8(b"=== Testing Cancel Order ==="));
        
        let mut scenario = test::begin(MAKER);
        let mut clock = clock::create_for_testing(ctx(&mut scenario));
        
        debug::print(&std::string::utf8(b"1. Setting up test environment..."));
        protocol::init_for_testing(ctx(&mut scenario));
        
        next_tx(&mut scenario, MAKER);
        
        let mut limit_protocol = test::take_shared<LimitOrderProtocol<SUI>>(&scenario);
        
        debug::print(&std::string::utf8(b"2. Creating limit order..."));
        let coin = coin::mint_for_testing<SUI>(AMOUNT, ctx(&mut scenario));
        let current_time = clock::timestamp_ms(&clock);
        let auction_start_time = current_time + 1000;
        let auction_end_time = auction_start_time + ONE_HOUR_MS;
        
        let order_hash = protocol::create_cross_chain_order<SUI>(
            &mut limit_protocol,
            coin,
            DESTINATION_AMOUNT,
            auction_start_time,
            auction_end_time,
            START_RATE,
            END_RATE,
            0,
            &clock,
            ctx(&mut scenario)
        );
        
        debug::print(&std::string::utf8(b"3. Cancelling order..."));
        next_tx(&mut scenario, MAKER);
        
        let mut order = test::take_shared<fusion_plus_crosschain::limit_order_protocol::LimitOrder<SUI>>(&scenario);
        
        let refund_coin = protocol::cancel_order<SUI>(
            &mut limit_protocol,
            &mut order,
            order_hash,
            ctx(&mut scenario)
        );
        
        debug::print(&std::string::utf8(b"4. Order cancelled successfully!"));
        debug::print(&std::string::utf8(b"   - Refund amount:"));
        debug::print(&coin::value(&refund_coin));
        
        // Verify we got our refund
        assert_eq(coin::value(&refund_coin), AMOUNT);
        
        coin::burn_for_testing(refund_coin);
        test::return_shared(order);
        test::return_shared(limit_protocol);
        clock::destroy_for_testing(clock);
        test::end(scenario);
        
        debug::print(&std::string::utf8(b"=== Test Completed Successfully ==="));
    }

    #[test]
    #[expected_failure(abort_code = fusion_plus_crosschain::limit_order_protocol::E_INVALID_SOURCE_AMOUNT)]
    fun test_create_order_with_insufficient_amount() {
        debug::print(&std::string::utf8(b"=== Testing Invalid Source Amount (Should Fail) ==="));
        
        let mut scenario = test::begin(MAKER);
        let mut clock = clock::create_for_testing(ctx(&mut scenario));
        
        protocol::init_for_testing(ctx(&mut scenario));
        
        next_tx(&mut scenario, MAKER);
        
        let mut limit_protocol = test::take_shared<LimitOrderProtocol<SUI>>(&scenario);
        
        debug::print(&std::string::utf8(b"Attempting to create order with insufficient amount..."));
        let coin = coin::mint_for_testing<SUI>(100, ctx(&mut scenario)); // Too small
        let current_time = clock::timestamp_ms(&clock);
        let auction_start_time = current_time + 1000;
        let auction_end_time = auction_start_time + ONE_HOUR_MS;
        
        // This should fail
        protocol::create_cross_chain_order<SUI>(
            &mut limit_protocol,
            coin,
            DESTINATION_AMOUNT,
            auction_start_time,
            auction_end_time,
            START_RATE,
            END_RATE,
            0,
            &clock,
            ctx(&mut scenario)
        );
        
        test::return_shared(limit_protocol);
        clock::destroy_for_testing(clock);
        test::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = fusion_plus_crosschain::limit_order_protocol::E_AUCTION_TOO_SHORT)]
    fun test_create_order_with_invalid_auction_duration() {
        debug::print(&std::string::utf8(b"=== Testing Invalid Auction Duration (Should Fail) ==="));
        
        let mut scenario = test::begin(MAKER);
        let mut clock = clock::create_for_testing(ctx(&mut scenario));
        
        protocol::init_for_testing(ctx(&mut scenario));
        
        next_tx(&mut scenario, MAKER);
        
        let mut limit_protocol = test::take_shared<LimitOrderProtocol<SUI>>(&scenario);
        
        debug::print(&std::string::utf8(b"Attempting to create order with too short auction duration..."));
        let coin = coin::mint_for_testing<SUI>(AMOUNT, ctx(&mut scenario));
        let current_time = clock::timestamp_ms(&clock);
        let auction_start_time = current_time + 1000;
        let auction_end_time = auction_start_time + 60000; // Only 1 minute (too short)
        
        // This should fail
        protocol::create_cross_chain_order<SUI>(
            &mut limit_protocol,
            coin,
            DESTINATION_AMOUNT,
            auction_start_time,
            auction_end_time,
            START_RATE,
            END_RATE,
            0,
            &clock,
            ctx(&mut scenario)
        );
        
        test::return_shared(limit_protocol);
        clock::destroy_for_testing(clock);
        test::end(scenario);
    }
}