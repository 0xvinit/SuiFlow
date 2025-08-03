#[test_only]
module fusion_plus_crosschain::dutch_auction_test {
    use sui::test_scenario::{Self as test, next_tx, ctx};
    use sui::clock::{Self};
    use sui::test_utils::assert_eq;
    use std::debug;
    use fusion_plus_crosschain::dutch_auction::{Self as auction, DutchAuction};

    // Test constants
    const PROTOCOL: address = @0xA;
    const ONE_HOUR_MS: u64 = 3600000;
    const START_RATE: u64 = 1000000; // 1.0 with 6 decimal precision
    const END_RATE: u64 = 500000; // 0.5 with 6 decimal precision

    #[test]
    fun test_initialize_auction() {
        debug::print(&std::string::utf8(b"=== Testing Initialize Auction ==="));
        
        let mut scenario = test::begin(PROTOCOL);
        let mut clock = clock::create_for_testing(ctx(&mut scenario));
        
        debug::print(&std::string::utf8(b"1. Initializing Dutch auction system..."));
        auction::init_for_testing(ctx(&mut scenario));
        
        next_tx(&mut scenario, PROTOCOL);
        
        let mut dutch_auction = test::take_shared<DutchAuction>(&scenario);
        
        debug::print(&std::string::utf8(b"2. Setting protocol address..."));
        auction::set_limit_order_protocol(&mut dutch_auction, PROTOCOL, ctx(&mut scenario));
        
        debug::print(&std::string::utf8(b"3. Creating auction with parameters:"));
        debug::print(&std::string::utf8(b"   - Start Rate: 1.0"));
        debug::print(&std::string::utf8(b"   - End Rate: 0.5"));
        debug::print(&std::string::utf8(b"   - Duration: 1 hour"));
        
        let order_hash = b"test_order_hash";
        let current_time = clock::timestamp_ms(&clock);
        let start_time = current_time + 1000;
        let end_time = start_time + ONE_HOUR_MS;
        
        auction::initialize_auction(
            &mut dutch_auction,
            order_hash,
            start_time,
            end_time,
            START_RATE,
            END_RATE,
            0, // Auto-calculate decrease rate
            ctx(&mut scenario)
        );
        
        debug::print(&std::string::utf8(b"4. Verifying auction was created..."));
        let (stored_order_hash, stored_start_time, stored_end_time, stored_start_rate, stored_end_rate, decrease_rate, is_active) = 
            auction::get_auction(&dutch_auction, order_hash);
        
        assert_eq(stored_order_hash, order_hash);
        assert_eq(stored_start_time, start_time);
        assert_eq(stored_end_time, end_time);
        assert_eq(stored_start_rate, START_RATE);
        assert_eq(stored_end_rate, END_RATE);
        assert_eq(is_active, true);
        
        debug::print(&std::string::utf8(b"   - Calculated decrease rate:"));
        debug::print(&decrease_rate);
        
        test::return_shared(dutch_auction);
        clock::destroy_for_testing(clock);
        test::end(scenario);
        
        debug::print(&std::string::utf8(b"=== Test Completed Successfully ==="));
    }

    #[test]
    fun test_calculate_current_rate() {
        debug::print(&std::string::utf8(b"=== Testing Calculate Current Rate ==="));
        
        let mut scenario = test::begin(PROTOCOL);
        let mut clock = clock::create_for_testing(ctx(&mut scenario));
        
        debug::print(&std::string::utf8(b"1. Setting up auction..."));
        auction::init_for_testing(ctx(&mut scenario));
        
        next_tx(&mut scenario, PROTOCOL);
        
        let mut dutch_auction = test::take_shared<DutchAuction>(&scenario);
        auction::set_limit_order_protocol(&mut dutch_auction, PROTOCOL, ctx(&mut scenario));
        
        let order_hash = b"test_order_hash";
        let current_time = clock::timestamp_ms(&clock);
        let start_time = current_time;
        let end_time = start_time + ONE_HOUR_MS;
        
        auction::initialize_auction(
            &mut dutch_auction,
            order_hash,
            start_time,
            end_time,
            START_RATE,
            END_RATE,
            0,
            ctx(&mut scenario)
        );
        
        debug::print(&std::string::utf8(b"2. Testing rate at auction start..."));
        let rate_at_start = auction::calculate_current_rate(&dutch_auction, order_hash, &clock);
        debug::print(&std::string::utf8(b"   - Rate at start:"));
        debug::print(&rate_at_start);
        assert_eq(rate_at_start, START_RATE);
        
        debug::print(&std::string::utf8(b"3. Testing rate at 25% through auction..."));
        clock::increment_for_testing(&mut clock, ONE_HOUR_MS / 4);
        let rate_at_quarter = auction::calculate_current_rate(&dutch_auction, order_hash, &clock);
        debug::print(&std::string::utf8(b"   - Rate at 25%:"));
        debug::print(&rate_at_quarter);
        assert!(rate_at_quarter < START_RATE && rate_at_quarter > END_RATE, 0);
        
        debug::print(&std::string::utf8(b"4. Testing rate at 50% through auction..."));
        clock::increment_for_testing(&mut clock, ONE_HOUR_MS / 4);
        let rate_at_half = auction::calculate_current_rate(&dutch_auction, order_hash, &clock);
        debug::print(&std::string::utf8(b"   - Rate at 50%:"));
        debug::print(&rate_at_half);
        assert!(rate_at_half < rate_at_quarter, 0);
        
        debug::print(&std::string::utf8(b"5. Testing rate at auction end..."));
        clock::increment_for_testing(&mut clock, ONE_HOUR_MS / 2);
        let rate_at_end = auction::calculate_current_rate(&dutch_auction, order_hash, &clock);
        debug::print(&std::string::utf8(b"   - Rate at end:"));
        debug::print(&rate_at_end);
        assert_eq(rate_at_end, END_RATE);
        
        test::return_shared(dutch_auction);
        clock::destroy_for_testing(clock);
        test::end(scenario);
        
        debug::print(&std::string::utf8(b"=== Test Completed Successfully ==="));
    }

    #[test]
    fun test_cancel_auction() {
        debug::print(&std::string::utf8(b"=== Testing Cancel Auction ==="));
        
        let mut scenario = test::begin(PROTOCOL);
        let mut clock = clock::create_for_testing(ctx(&mut scenario));
        
        debug::print(&std::string::utf8(b"1. Setting up auction..."));
        auction::init_for_testing(ctx(&mut scenario));
        
        next_tx(&mut scenario, PROTOCOL);
        
        let mut dutch_auction = test::take_shared<DutchAuction>(&scenario);
        auction::set_limit_order_protocol(&mut dutch_auction, PROTOCOL, ctx(&mut scenario));
        
        let order_hash = b"test_order_hash";
        let current_time = clock::timestamp_ms(&clock);
        let start_time = current_time + 1000;
        let end_time = start_time + ONE_HOUR_MS;
        
        auction::initialize_auction(
            &mut dutch_auction,
            order_hash,
            start_time,
            end_time,
            START_RATE,
            END_RATE,
            0,
            ctx(&mut scenario)
        );
        
        debug::print(&std::string::utf8(b"2. Verifying auction is active..."));
        let (_, _, _, _, _, _, is_active_before) = auction::get_auction(&dutch_auction, order_hash);
        assert_eq(is_active_before, true);
        
        debug::print(&std::string::utf8(b"3. Cancelling auction..."));
        auction::cancel_auction(&mut dutch_auction, order_hash, ctx(&mut scenario));
        
        debug::print(&std::string::utf8(b"4. Verifying auction is cancelled..."));
        let (_, _, _, _, _, _, is_active_after) = auction::get_auction(&dutch_auction, order_hash);
        assert_eq(is_active_after, false);
        
        debug::print(&std::string::utf8(b"5. Verifying cancelled auction returns 0 rate..."));
        let rate_after_cancel = auction::calculate_current_rate(&dutch_auction, order_hash, &clock);
        assert_eq(rate_after_cancel, 0);
        
        test::return_shared(dutch_auction);
        clock::destroy_for_testing(clock);
        test::end(scenario);
        
        debug::print(&std::string::utf8(b"=== Test Completed Successfully ==="));
    }

    #[test]
    fun test_auction_time_functions() {
        debug::print(&std::string::utf8(b"=== Testing Auction Time Functions ==="));
        
        let mut scenario = test::begin(PROTOCOL);
        let mut clock = clock::create_for_testing(ctx(&mut scenario));
        
        debug::print(&std::string::utf8(b"1. Setting up auction..."));
        auction::init_for_testing(ctx(&mut scenario));
        
        next_tx(&mut scenario, PROTOCOL);
        
        let mut dutch_auction = test::take_shared<DutchAuction>(&scenario);
        auction::set_limit_order_protocol(&mut dutch_auction, PROTOCOL, ctx(&mut scenario));
        
        let order_hash = b"test_order_hash";
        let current_time = clock::timestamp_ms(&clock);
        let start_time = current_time + 1000;
        let end_time = start_time + ONE_HOUR_MS;
        
        auction::initialize_auction(
            &mut dutch_auction,
            order_hash,
            start_time,
            end_time,
            START_RATE,
            END_RATE,
            0,
            ctx(&mut scenario)
        );
        
        debug::print(&std::string::utf8(b"2. Testing before auction starts..."));
        assert!(!auction::has_auction_started(&dutch_auction, order_hash, &clock), 0);
        assert!(!auction::has_auction_ended(&dutch_auction, order_hash, &clock), 0);
        assert!(!auction::is_auction_active(&dutch_auction, order_hash, &clock), 0);
        
        debug::print(&std::string::utf8(b"3. Moving to auction start time..."));
        clock::increment_for_testing(&mut clock, 1000);
        assert!(auction::has_auction_started(&dutch_auction, order_hash, &clock), 0);
        assert!(!auction::has_auction_ended(&dutch_auction, order_hash, &clock), 0);
        assert!(auction::is_auction_active(&dutch_auction, order_hash, &clock), 0);
        
        debug::print(&std::string::utf8(b"4. Testing remaining time calculation..."));
        let remaining_time = auction::get_remaining_time(&dutch_auction, order_hash, &clock);
        debug::print(&std::string::utf8(b"   - Remaining time (ms):"));
        debug::print(&remaining_time);
        assert!(remaining_time <= ONE_HOUR_MS, 0);
        
        debug::print(&std::string::utf8(b"5. Testing elapsed time calculation..."));
        let elapsed_time = auction::get_elapsed_time(&dutch_auction, order_hash, &clock);
        debug::print(&std::string::utf8(b"   - Elapsed time (ms):"));
        debug::print(&elapsed_time);
        assert!(elapsed_time >= 0, 0);
        
        debug::print(&std::string::utf8(b"6. Moving to auction end time..."));
        clock::increment_for_testing(&mut clock, ONE_HOUR_MS);
        assert!(auction::has_auction_started(&dutch_auction, order_hash, &clock), 0);
        assert!(auction::has_auction_ended(&dutch_auction, order_hash, &clock), 0);
        assert!(!auction::is_auction_active(&dutch_auction, order_hash, &clock), 0);
        
        test::return_shared(dutch_auction);
        clock::destroy_for_testing(clock);
        test::end(scenario);
        
        debug::print(&std::string::utf8(b"=== Test Completed Successfully ==="));
    }

    #[test]
    fun test_profitability_check() {
        debug::print(&std::string::utf8(b"=== Testing Profitability Check ==="));
        
        let mut scenario = test::begin(PROTOCOL);
        let mut clock = clock::create_for_testing(ctx(&mut scenario));
        
        debug::print(&std::string::utf8(b"1. Setting up auction..."));
        auction::init_for_testing(ctx(&mut scenario));
        
        next_tx(&mut scenario, PROTOCOL);
        
        let mut dutch_auction = test::take_shared<DutchAuction>(&scenario);
        auction::set_limit_order_protocol(&mut dutch_auction, PROTOCOL, ctx(&mut scenario));
        
        let order_hash = b"test_order_hash";
        let current_time = clock::timestamp_ms(&clock);
        let start_time = current_time;
        let end_time = start_time + ONE_HOUR_MS;
        
        auction::initialize_auction(
            &mut dutch_auction,
            order_hash,
            start_time,
            end_time,
            START_RATE,
            END_RATE,
            0,
            ctx(&mut scenario)
        );
        
        debug::print(&std::string::utf8(b"2. Testing with low resolver cost..."));
        let low_cost = 100000; // Low cost
        let is_profitable_low = auction::is_profitable_for_resolver(
            &dutch_auction, 
            order_hash, 
            low_cost, 
            &clock
        );
        debug::print(&std::string::utf8(b"   - Profitable with low cost:"));
        // Convert bool to string for printing  
        if (is_profitable_low) {
            debug::print(&std::string::utf8(b"true"));
        } else {
            debug::print(&std::string::utf8(b"false"));
        };
        
        debug::print(&std::string::utf8(b"3. Testing with high resolver cost..."));
        let high_cost = 2000000; // Very high cost
        let is_profitable_high = auction::is_profitable_for_resolver(
            &dutch_auction, 
            order_hash, 
            high_cost, 
            &clock
        );
        debug::print(&std::string::utf8(b"   - Profitable with high cost:"));

        // Convert bool to string for printing
        if (is_profitable_high) {
            debug::print(&std::string::utf8(b"true"));
        } else {
            debug::print(&std::string::utf8(b"false"));
        };        
        test::return_shared(dutch_auction);
        clock::destroy_for_testing(clock);
        test::end(scenario);
        
        debug::print(&std::string::utf8(b"=== Test Completed Successfully ==="));
    }

    #[test]
    #[expected_failure(abort_code = fusion_plus_crosschain::dutch_auction::E_INVALID_AUCTION_TIMES)]
    fun test_invalid_auction_times() {
        debug::print(&std::string::utf8(b"=== Testing Invalid Auction Times (Should Fail) ==="));
        
        let mut scenario = test::begin(PROTOCOL);
        let mut clock = clock::create_for_testing(ctx(&mut scenario));
        
        auction::init_for_testing(ctx(&mut scenario));
        
        next_tx(&mut scenario, PROTOCOL);
        
        let mut dutch_auction = test::take_shared<DutchAuction>(&scenario);
        auction::set_limit_order_protocol(&mut dutch_auction, PROTOCOL, ctx(&mut scenario));
        
        let order_hash = b"test_order_hash";
        let current_time = clock::timestamp_ms(&clock);
        let start_time = current_time + ONE_HOUR_MS;
        let end_time = start_time - 1000; // End before start (invalid)
        
        debug::print(&std::string::utf8(b"Attempting to create auction with end time before start time..."));
        
        // This should fail
        auction::initialize_auction(
            &mut dutch_auction,
            order_hash,
            start_time,
            end_time,
            START_RATE,
            END_RATE,
            0,
            ctx(&mut scenario)
        );
        
        test::return_shared(dutch_auction);
        clock::destroy_for_testing(clock);
        test::end(scenario);
    }
}