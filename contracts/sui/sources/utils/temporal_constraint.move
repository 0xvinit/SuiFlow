/// Temporal constraint management for time-locked operations
/// Provides sophisticated time-based access control for atomic swaps
module fusion_plus_crosschain::temporal_constraint {
    use sui::clock::{Clock, timestamp_ms};

    // Enhanced error codes for temporal operations
    const E_INVALID_DEADLINE: u64 = 0x3001;
    const E_DEADLINE_EXPIRED: u64 = 0x3002;
    const E_INSUFFICIENT_TIME_BUFFER: u64 = 0x3003;
    const E_INVALID_DURATION: u64 = 0x3004;
    const E_CONSTRAINT_VIOLATION: u64 = 0x3005;

    // Time constants in milliseconds
    const MIN_CONSTRAINT_DURATION: u64 = 900000;    // 15 minutes
    const STANDARD_DURATION: u64 = 3600000;         // 1 hour
    const EXTENDED_DURATION: u64 = 86400000;        // 24 hours
    const MAX_CONSTRAINT_DURATION: u64 = 604800000; // 7 days
    const SAFETY_BUFFER: u64 = 300000;              // 5 minutes safety buffer

    /// Temporal constraint configuration
    public struct TemporalConfig has copy, drop, store {
        deadline: u64,
        grace_period: u64,
        minimum_advance_notice: u64,
        allows_early_execution: bool,
    }

    /// Validates if deadline is acceptable for new constraints
    public fun is_valid_deadline(deadline: u64, clock: &Clock): bool {
        let current_time = timestamp_ms(clock);
        let time_difference = if (deadline > current_time) {
            deadline - current_time
        } else {
            return false
        };
        
        time_difference >= MIN_CONSTRAINT_DURATION && 
        time_difference <= MAX_CONSTRAINT_DURATION
    }

    /// Checks if temporal constraint has expired
    public fun has_expired(deadline: u64, clock: &Clock): bool {
        timestamp_ms(clock) > deadline
    }

    /// Determines if constraint is still active (not expired)
    public fun is_active(deadline: u64, clock: &Clock): bool {
        !has_expired(deadline, clock)
    }

    /// Calculates remaining time until deadline
    public fun remaining_duration(deadline: u64, clock: &Clock): u64 {
        let current_time = timestamp_ms(clock);
        if (current_time >= deadline) {
            0
        } else {
            deadline - current_time
        }
    }

    /// Creates temporal deadline from current time plus duration
    public fun create_deadline(duration: u64, clock: &Clock): u64 {
        assert!(duration >= MIN_CONSTRAINT_DURATION, E_INSUFFICIENT_TIME_BUFFER);
        assert!(duration <= MAX_CONSTRAINT_DURATION, E_INVALID_DURATION);
        
        timestamp_ms(clock) + duration
    }

    /// Advanced deadline creation with safety checks
    public fun create_secure_deadline(
        base_duration: u64, 
        safety_multiplier: u64,
        clock: &Clock
    ): u64 {
        let adjusted_duration = base_duration + (base_duration * safety_multiplier / 100);
        create_deadline(adjusted_duration, clock)
    }

    /// Checks if execution is allowed within grace period
    public fun within_grace_period(deadline: u64, grace_period: u64, clock: &Clock): bool {
        let current_time = timestamp_ms(clock);
        let grace_deadline = deadline + grace_period;
        current_time <= grace_deadline
    }

    /// Validates temporal constraint configuration
    public fun validate_config(config: &TemporalConfig, clock: &Clock): bool {
        is_valid_deadline(config.deadline, clock) &&
        config.grace_period <= STANDARD_DURATION &&
        config.minimum_advance_notice >= SAFETY_BUFFER
    }

    /// Creates standard temporal configuration
    public fun create_standard_config(clock: &Clock): TemporalConfig {
        TemporalConfig {
            deadline: create_deadline(STANDARD_DURATION, clock),
            grace_period: SAFETY_BUFFER,
            minimum_advance_notice: SAFETY_BUFFER,
            allows_early_execution: false,
        }
    }

    /// Creates extended temporal configuration for longer operations
    public fun create_extended_config(clock: &Clock): TemporalConfig {
        TemporalConfig {
            deadline: create_deadline(EXTENDED_DURATION, clock),
            grace_period: STANDARD_DURATION,
            minimum_advance_notice: SAFETY_BUFFER * 2,
            allows_early_execution: true,
        }
    }

    /// Checks if constraint allows immediate execution
    public fun allows_immediate_execution(config: &TemporalConfig, clock: &Clock): bool {
        if (!config.allows_early_execution) {
            return false
        };
        
        let current_time = timestamp_ms(clock);
        current_time >= (config.deadline - config.minimum_advance_notice)
    }

    /// Gets time until execution is allowed
    public fun time_until_execution(config: &TemporalConfig, clock: &Clock): u64 {
        if (allows_immediate_execution(config, clock)) {
            return 0
        };
        
        let current_time = timestamp_ms(clock);
        let execution_time = config.deadline - config.minimum_advance_notice;
        
        if (current_time >= execution_time) {
            0
        } else {
            execution_time - current_time
        }
    }

    /// Batch validation of multiple deadlines
    public fun batch_validate_deadlines(deadlines: vector<u64>, clock: &Clock): vector<bool> {
        let mut results = vector::empty<bool>();
        let len = std::vector::length(&deadlines);
        let mut i = 0;
        
        while (i < len) {
            let deadline = *std::vector::borrow(&deadlines, i);
            let is_valid = is_valid_deadline(deadline, clock);
            std::vector::push_back(&mut results, is_valid);
            i = i + 1;
        };
        
        results
    }

    /// Emergency extension of deadline (with strict conditions)
    public fun emergency_extend_deadline(
        original_deadline: u64,
        extension_duration: u64,
        clock: &Clock
    ): u64 {
        assert!(has_expired(original_deadline, clock), E_CONSTRAINT_VIOLATION);
        assert!(extension_duration <= STANDARD_DURATION, E_INVALID_DURATION);
        
        let current_time = timestamp_ms(clock);
        current_time + extension_duration
    }

    /// Get standard time durations
    public fun get_min_duration(): u64 { MIN_CONSTRAINT_DURATION }
    public fun get_standard_duration(): u64 { STANDARD_DURATION }
    public fun get_extended_duration(): u64 { EXTENDED_DURATION }
    public fun get_max_duration(): u64 { MAX_CONSTRAINT_DURATION }
    public fun get_safety_buffer(): u64 { SAFETY_BUFFER }

    /// Calculate urgency level based on remaining time
    public fun calculate_urgency_level(deadline: u64, clock: &Clock): u8 {
        let remaining = remaining_duration(deadline, clock);
        
        if (remaining == 0) {
            return 4 // Expired
        } else if (remaining <= SAFETY_BUFFER) {
            return 3 // Critical
        } else if (remaining <= SAFETY_BUFFER * 2) {
            return 2 // High
        } else if (remaining <= STANDARD_DURATION) {
            return 1 // Medium  
        } else {
            return 0 // Low
        }
    }

    #[test_only]
    /// Comprehensive test for temporal constraint functionality
    public fun test_temporal_functionality(clock: &Clock) {
        let duration = get_standard_duration();
        let deadline = create_deadline(duration, clock);
        
        assert!(is_valid_deadline(deadline, clock), E_INVALID_DEADLINE);
        assert!(is_active(deadline, clock), E_DEADLINE_EXPIRED);
        assert!(!has_expired(deadline, clock), E_DEADLINE_EXPIRED);
        
        let config = create_standard_config(clock);
        assert!(validate_config(&config, clock), E_CONSTRAINT_VIOLATION);
    }
}