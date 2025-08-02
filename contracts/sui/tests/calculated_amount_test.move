#[test_only]
module fusion_plus_crosschain::calculated_amount_test {
    use sui::test_scenario::{Self as test, next_tx, ctx};
    use sui::clock::{Self};
    use sui::coin::{Self};
    use sui::sui::SUI;
    use std::string;
    use fusion_plus_crosschain::cross_chain_escrow::{
        Self as vault_manager, AtomicSwapVault, ConsumedProofRegistry
    };
    use fusion_plus_crosschain::cryptographic_proof;

    const ALICE: address = @0xa11ce;
    const BOB: address = @0xb0b;

    #[test]
    fun test_calculated_amount_fill_escrow() {
        let mut scenario = test::begin(ALICE);
        let mut clock = clock::create_for_testing(ctx(&mut scenario));
        
        // 現在時刻を設定
        clock::set_for_testing(&mut clock, 1000);
        
        // レジストリの初期化
        next_tx(&mut scenario, ALICE);
        vault_manager::init_for_testing(ctx(&mut scenario));

        // シミュレーション：
        // 入力: 0.00001 ETH
        // レート: 887.30 SUI/ETH
        // 手数料: 0.3%
        // 計算後見積額: 0.00001 * 887.30 * 0.997 = 0.008846991 SUI
        // MIST換算: 8846991 MIST (1 SUI = 1e9 MIST)
        
        let calculated_sui_amount = 8846991; // 0.008846991 SUI in MIST
        
        // ALICEがエスクロー作成（計算後の金額でcoinを作成）
        next_tx(&mut scenario, ALICE);
        
        // 計算後の金額でSUIコインを作成
        let coin = coin::mint_for_testing<SUI>(calculated_sui_amount, ctx(&mut scenario));
        
        // シークレットとハッシュロック作成
        let secret = b"test_secret_123_with_sufficient_length";
        let hash_lock = cryptographic_proof::create_commitment(secret);
        
        // 1時間後の期限
        let time_lock = 1000 + 3600000;
        
        let mut registry = test::take_shared<ConsumedProofRegistry>(&scenario);
        let vault_id = vault_manager::create_and_share_vault<SUI>(
            coin,
            BOB,
            hash_lock,
            time_lock,
            string::utf8(b"eth_order_hash_123"),
            &mut registry,
            &clock,
            ctx(&mut scenario)
        );
        test::return_shared(registry);
        
        // エスクロー情報の確認
        next_tx(&mut scenario, BOB);
        let vault = test::take_shared_by_id<AtomicSwapVault<SUI>>(&scenario, vault_id);
        let (_vault_id, depositor, beneficiary, total_deposit, available_balance, _cryptographic_commitment, _temporal_deadline, settlement_status, _creation_timestamp, _cross_chain_reference) = 
            vault_manager::get_vault_info(&vault);
        
        // エスクローに格納された金額が計算後の金額と一致することを確認
        assert!(total_deposit == calculated_sui_amount, 0);
        assert!(available_balance == calculated_sui_amount, 0);
        assert!(depositor == ALICE, 1);
        assert!(beneficiary == BOB, 2);
        assert!(settlement_status == 0, 3); // STATUS_ACTIVE
        
        test::return_shared(vault);

        // BOBがエスクローをfill（シークレットを明かして受け取り）
        next_tx(&mut scenario, BOB);
        let mut registry = test::take_shared<ConsumedProofRegistry>(&scenario);
        let mut vault = test::take_shared<AtomicSwapVault<SUI>>(&scenario);
        let secret = b"test_secret_123_with_sufficient_length";
        
        // エスクローをfillして計算後の金額を受け取る
        let received_coin = vault_manager::settle_vault_complete<SUI>(
            &mut vault,
            &mut registry,
            secret,
            &clock,
            ctx(&mut scenario)
        );
        
        // 受け取った金額が計算後の見積額と一致することを確認
        let received_amount = coin::value(&received_coin);
        assert!(received_amount == calculated_sui_amount, 4);
        
        // エスクローがfill済みになっていることを確認
        let (_, _, _, _, _, _, _, settlement_status, _, _) = vault_manager::get_vault_info(&vault);
        assert!(settlement_status == 1, 5); // STATUS_SETTLED
        
        coin::burn_for_testing(received_coin);
        test::return_shared(registry);
        test::return_shared(vault);

        clock::destroy_for_testing(clock);
        test::end(scenario);
    }

    #[test]
    fun test_different_input_calculated_amounts() {
        let mut scenario = test::begin(ALICE);
        let mut clock = clock::create_for_testing(ctx(&mut scenario));
        
        clock::set_for_testing(&mut clock, 1000);
        
        next_tx(&mut scenario, ALICE);
        vault_manager::init_for_testing(ctx(&mut scenario));

        // ケース1: より大きな入力額
        // 入力: 0.0001 ETH
        // レート: 887.30 SUI/ETH  
        // 計算後見積額: 0.0001 * 887.30 * 0.997 = 0.08846991 SUI
        let calculated_sui_amount_1 = 88469910; // 0.08846991 SUI in MIST
        
        next_tx(&mut scenario, ALICE);
        
        let coin = coin::mint_for_testing<SUI>(calculated_sui_amount_1, ctx(&mut scenario));
        let secret = b"secret_case_1_with_sufficient_length_for_testing";
        let hash_lock = cryptographic_proof::create_commitment(secret);
        let time_lock = 1000 + 3600000;
        
        let mut registry = test::take_shared<ConsumedProofRegistry>(&scenario);
        let vault_id = vault_manager::create_and_share_vault<SUI>(
            coin,
            BOB,
            hash_lock,
            time_lock,
            string::utf8(b"eth_order_hash_case1"),
            &mut registry,
            &clock,
            ctx(&mut scenario)
        );
        test::return_shared(registry);
        
        next_tx(&mut scenario, BOB);
        let mut registry = test::take_shared<ConsumedProofRegistry>(&scenario);
        let mut vault = test::take_shared_by_id<AtomicSwapVault<SUI>>(&scenario, vault_id);
        
        let received_coin = vault_manager::settle_vault_complete<SUI>(
            &mut vault,
            &mut registry,
            secret,
            &clock,
            ctx(&mut scenario)
        );
        
        // より大きな計算後金額を正確に受け取れることを確認
        assert!(coin::value(&received_coin) == calculated_sui_amount_1, 6);
        
        coin::burn_for_testing(received_coin);
        test::return_shared(registry);
        test::return_shared(vault);

        clock::destroy_for_testing(clock);
        test::end(scenario);
    }
}