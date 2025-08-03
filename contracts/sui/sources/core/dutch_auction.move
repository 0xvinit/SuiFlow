module fusion_plus_crosschain::dutch_auction {
    use sui::clock::{Self, Clock};
    use sui::event;

    // Error codes
    const E_AUCTION_ALREADY_EXISTS: u64 = 1;
    const E_INVALID_AUCTION_TIMES: u64 = 2;
    const E_INVALID_RATES: u64 = 3;
    const E_INVALID_RATE_PROGRESSION: u64 = 4;
    const E_AUCTION_NOT_FOUND: u64 = 5;
    const E_AUCTION_NOT_ACTIVE: u64 = 6;
    const E_AUCTION_ALREADY_CANCELLED: u64 = 7;
    const E_ONLY_LIMIT_ORDER_PROTOCOL: u64 = 8;

    // Auction data structure
    public struct AuctionData has copy, drop, store {
        order_hash: vector<u8>,
        start_time: u64,
        end_time: u64,
        start_rate: u64,
        end_rate: u64,
        decrease_rate: u64,
        is_active: bool,
    }

    // Dutch auction registry
    public struct DutchAuction has key {
        id: sui::object::UID,
        auctions: sui::table::Table<vector<u8>, AuctionData>, // order_hash -> AuctionData
        cancelled_auctions: sui::table::Table<vector<u8>, bool>, // order_hash -> cancelled
        limit_order_protocol: address,
    }

    // Events
    public struct AuctionInitialized has copy, drop {
        order_hash: vector<u8>,
        start_time: u64,
        end_time: u64,
        start_rate: u64,
        end_rate: u64,
        decrease_rate: u64,
    }

    public struct AuctionCancelled has copy, drop {
        order_hash: vector<u8>,
    }

    // Initialize function
    fun init(ctx: &mut sui::tx_context::TxContext) {
        let auction = DutchAuction {
            id: sui::object::new(ctx),
            auctions: sui::table::new(ctx),
            cancelled_auctions: sui::table::new(ctx),
            limit_order_protocol: @0x0, // Will be set later
        };
        sui::transfer::share_object(auction);
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut sui::tx_context::TxContext) {
        init(ctx);
    }

    // Set the limit order protocol address (admin function)
    public fun set_limit_order_protocol(
        auction: &mut DutchAuction,
        protocol_address: address,
        _ctx: &mut sui::tx_context::TxContext
    ) {
        // In a production system, you'd want proper admin controls here
        auction.limit_order_protocol = protocol_address;
    }

    // Modifier to check if caller is limit order protocol
    fun assert_only_limit_order_protocol(auction: &DutchAuction, ctx: &sui::tx_context::TxContext) {
        assert!(sui::tx_context::sender(ctx) == auction.limit_order_protocol, E_ONLY_LIMIT_ORDER_PROTOCOL);
    }

    // Initializes a Dutch auction for an order
    public fun initialize_auction(
        auction: &mut DutchAuction,
        order_hash: vector<u8>,
        start_time: u64,
        end_time: u64,
        start_rate: u64,
        end_rate: u64,
        decrease_rate: u64,
        ctx: &mut sui::tx_context::TxContext
    ) {
        assert_only_limit_order_protocol(auction, ctx);
        assert!(!sui::table::contains(&auction.auctions, order_hash), E_AUCTION_ALREADY_EXISTS);
        assert!(start_time < end_time, E_INVALID_AUCTION_TIMES);
        assert!(start_rate > 0 && end_rate > 0, E_INVALID_RATES);
        assert!(start_rate > end_rate, E_INVALID_RATE_PROGRESSION);

        // Calculate decrease rate if not provided
        let calculated_decrease_rate = if (decrease_rate == 0) {
            let duration = end_time - start_time;
            if (duration > 0) {
                (start_rate - end_rate) / duration
            } else {
                0
            }
        } else {
            decrease_rate
        };

        let auction_data = AuctionData {
            order_hash,
            start_time,
            end_time,
            start_rate,
            end_rate,
            decrease_rate: calculated_decrease_rate,
            is_active: true,
        };

        sui::table::add(&mut auction.auctions, order_hash, auction_data);

        event::emit(AuctionInitialized {
            order_hash,
            start_time,
            end_time,
            start_rate,
            end_rate,
            decrease_rate: calculated_decrease_rate,
        });
    }

    // Cancels an active auction
    public fun cancel_auction(
        auction: &mut DutchAuction,
        order_hash: vector<u8>,
        ctx: &mut sui::tx_context::TxContext
    ) {
        assert_only_limit_order_protocol(auction, ctx);
        assert!(sui::table::contains(&auction.auctions, order_hash), E_AUCTION_NOT_FOUND);
        
        let auction_data = sui::table::borrow_mut(&mut auction.auctions, order_hash);
        assert!(auction_data.is_active, E_AUCTION_NOT_ACTIVE);
        assert!(!sui::table::contains(&auction.cancelled_auctions, order_hash), E_AUCTION_ALREADY_CANCELLED);

        auction_data.is_active = false;
        sui::table::add(&mut auction.cancelled_auctions, order_hash, true);

        event::emit(AuctionCancelled {
            order_hash,
        });
    }

    // Calculates the current rate for a Dutch auction
    public fun calculate_current_rate(
        auction: &DutchAuction,
        order_hash: vector<u8>,
        clock: &Clock
    ): u64 {
        if (!sui::table::contains(&auction.auctions, order_hash)) {
            return 0
        };

        let auction_data = sui::table::borrow(&auction.auctions, order_hash);
        
        if (!auction_data.is_active) {
            return 0
        };

        if (sui::table::contains(&auction.cancelled_auctions, order_hash)) {
            return 0
        };

        let current_time = clock::timestamp_ms(clock);
        
        if (current_time < auction_data.start_time) {
            return 0
        };

        if (current_time >= auction_data.end_time) {
            return auction_data.end_rate
        };

        // Linear decrease from start_rate to end_rate
        let time_elapsed = current_time - auction_data.start_time;
        let total_duration = auction_data.end_time - auction_data.start_time;
        
        if (time_elapsed >= total_duration) {
            return auction_data.end_rate
        };

        // Calculate current rate using linear interpolation
        let rate_decrease = ((auction_data.start_rate - auction_data.end_rate) * time_elapsed) / total_duration;
        auction_data.start_rate - rate_decrease
    }

    // Calculates the rate at a specific timestamp
    public fun calculate_rate_at_time(
        auction: &DutchAuction,
        order_hash: vector<u8>,
        timestamp: u64
    ): u64 {
        if (!sui::table::contains(&auction.auctions, order_hash)) {
            return 0
        };

        let auction_data = sui::table::borrow(&auction.auctions, order_hash);
        
        if (!auction_data.is_active) {
            return 0
        };

        if (sui::table::contains(&auction.cancelled_auctions, order_hash)) {
            return 0
        };

        if (timestamp < auction_data.start_time) {
            return 0
        };

        if (timestamp >= auction_data.end_time) {
            return auction_data.end_rate
        };

        // Linear decrease from start_rate to end_rate
        let time_elapsed = timestamp - auction_data.start_time;
        let total_duration = auction_data.end_time - auction_data.start_time;
        
        if (time_elapsed >= total_duration) {
            return auction_data.end_rate
        };

        // Calculate current rate using linear interpolation
        let rate_decrease = ((auction_data.start_rate - auction_data.end_rate) * time_elapsed) / total_duration;
        auction_data.start_rate - rate_decrease
    }

    // Checks if filling the order at current rate is profitable for resolver
    public fun is_profitable_for_resolver(
        auction: &DutchAuction,
        order_hash: vector<u8>,
        resolver_cost: u64,
        clock: &Clock
    ): bool {
        let current_rate = calculate_current_rate(auction, order_hash, clock);
        if (current_rate == 0) {
            return false
        };

        // Simple profitability check: current rate should cover resolver costs plus minimum profit
        let min_profit_margin = 10000; // 1% minimum profit (assuming 1e6 precision)
        current_rate >= resolver_cost + min_profit_margin
    }

    // View functions
    public fun get_auction(auction: &DutchAuction, order_hash: vector<u8>): (
        vector<u8>, // order_hash
        u64, // start_time
        u64, // end_time
        u64, // start_rate
        u64, // end_rate
        u64, // decrease_rate
        bool // is_active
    ) {
        let auction_data = sui::table::borrow(&auction.auctions, order_hash);
        (
            auction_data.order_hash,
            auction_data.start_time,
            auction_data.end_time,
            auction_data.start_rate,
            auction_data.end_rate,
            auction_data.decrease_rate,
            auction_data.is_active
        )
    }

    public fun get_remaining_time(
        auction: &DutchAuction,
        order_hash: vector<u8>,
        clock: &Clock
    ): u64 {
        if (!sui::table::contains(&auction.auctions, order_hash)) {
            return 0
        };

        let auction_data = sui::table::borrow(&auction.auctions, order_hash);
        
        if (!auction_data.is_active) {
            return 0
        };

        let current_time = clock::timestamp_ms(clock);
        
        if (current_time >= auction_data.end_time) {
            return 0
        };

        if (current_time < auction_data.start_time) {
            return auction_data.end_time - auction_data.start_time
        };

        auction_data.end_time - current_time
    }

    public fun get_elapsed_time(
        auction: &DutchAuction,
        order_hash: vector<u8>,
        clock: &Clock
    ): u64 {
        if (!sui::table::contains(&auction.auctions, order_hash)) {
            return 0
        };

        let auction_data = sui::table::borrow(&auction.auctions, order_hash);
        let current_time = clock::timestamp_ms(clock);
        
        if (current_time < auction_data.start_time) {
            return 0
        };

        current_time - auction_data.start_time
    }

    public fun is_auction_active(
        auction: &DutchAuction,
        order_hash: vector<u8>,
        clock: &Clock
    ): bool {
        if (!sui::table::contains(&auction.auctions, order_hash)) {
            return false
        };

        let auction_data = sui::table::borrow(&auction.auctions, order_hash);
        let current_time = clock::timestamp_ms(clock);
        
        auction_data.is_active &&
        !sui::table::contains(&auction.cancelled_auctions, order_hash) &&
        current_time >= auction_data.start_time &&
        current_time < auction_data.end_time
    }

    public fun has_auction_started(
        auction: &DutchAuction,
        order_hash: vector<u8>,
        clock: &Clock
    ): bool {
        if (!sui::table::contains(&auction.auctions, order_hash)) {
            return false
        };

        let auction_data = sui::table::borrow(&auction.auctions, order_hash);
        let current_time = clock::timestamp_ms(clock);
        
        auction_data.is_active &&
        !sui::table::contains(&auction.cancelled_auctions, order_hash) &&
        current_time >= auction_data.start_time
    }

    public fun has_auction_ended(
        auction: &DutchAuction,
        order_hash: vector<u8>,
        clock: &Clock
    ): bool {
        if (!sui::table::contains(&auction.auctions, order_hash)) {
            return false
        };

        let auction_data = sui::table::borrow(&auction.auctions, order_hash);
        let current_time = clock::timestamp_ms(clock);
        
        current_time >= auction_data.end_time
    }

    // Gets the rate progression curve data
    public fun get_rate_progression(
        auction: &DutchAuction,
        order_hash: vector<u8>,
        steps: u64
    ): (vector<u64>, vector<u64>) {
        if (!sui::table::contains(&auction.auctions, order_hash) || steps == 0) {
            return (std::vector::empty<u64>(), std::vector::empty<u64>())
        };

        let auction_data = sui::table::borrow(&auction.auctions, order_hash);
        
        let mut timestamps = std::vector::empty<u64>();
        let mut rates = std::vector::empty<u64>();

        let duration = auction_data.end_time - auction_data.start_time;
        let step_size = duration / steps;

        let mut i = 0;
        while (i < steps) {
            let timestamp = auction_data.start_time + (i * step_size);
            let rate = calculate_rate_at_time(auction, order_hash, timestamp);
            
            std::vector::push_back(&mut timestamps, timestamp);
            std::vector::push_back(&mut rates, rate);
            
            i = i + 1;
        };

        (timestamps, rates)
    }

    // Helper function for testing
    #[test_only]
    public fun create_test_auction(
        auction: &mut DutchAuction,
        order_hash: vector<u8>,
        start_time: u64,
        end_time: u64,
        start_rate: u64,
        end_rate: u64,
        ctx: &mut sui::tx_context::TxContext
    ) {
        // Bypass the protocol check for testing
        auction.limit_order_protocol = sui::tx_context::sender(ctx);
        initialize_auction(
            auction,
            order_hash,
            start_time,
            end_time,
            start_rate,
            end_rate,
            0, // Let it calculate decrease rate
            ctx
        );
    }
}