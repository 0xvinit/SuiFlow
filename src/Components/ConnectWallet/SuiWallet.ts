import { useState, useEffect } from 'react'
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import { getFaucetHost, requestSuiFromFaucetV2 } from '@mysten/sui/faucet'

export function useSuiWallet() {
  const account = useCurrentAccount()
  const suiClient = useSuiClient()
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction()
  const [balance, setBalance] = useState<string>('0')
  const [isLoading, setIsLoading] = useState(false)

  // Sign and execute transaction
  const executeTransaction = async (transaction: Transaction): Promise<string> => {
    return new Promise((resolve, reject) => {
      signAndExecuteTransaction(
        {
          transaction,
        },
        {
          onSuccess: (result) => {
            resolve(result.digest)
          },
          onError: (error) => {
            reject(error)
          },
        }
      )
    })
  }

  return {
    account,
    balance,
    isLoading,
    executeTransaction,
    isConnected: !!account?.address,
  }
}