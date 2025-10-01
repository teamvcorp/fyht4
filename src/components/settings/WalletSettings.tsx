'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@/hooks/useWallet'

interface WalletTransaction {
  id: string
  type: 'credit' | 'debit'
  amount: number
  amountDollars: string
  description: string
  date: string
  relatedProject?: {
    id: string
    title: string
    status: string
  } | null
  balanceAfterDollars: string
}

export function WalletSettings() {
  const { wallet, addFunds, fetchBalance } = useWallet()
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [showAddFunds, setShowAddFunds] = useState(false)
  const [fundAmount, setFundAmount] = useState<number>(25)
  
  // Auto-refill state
  const [autoRefill, setAutoRefill] = useState({
    enabled: false,
    amount: 25,
    threshold: 10,
    hasPaymentMethod: false
  })
  const [loadingAutoRefill, setLoadingAutoRefill] = useState(false)
  const [savingAutoRefill, setSavingAutoRefill] = useState(false)

  useEffect(() => {
    fetchTransactions()
    fetchAutoRefillSettings()
  }, [])

  const fetchAutoRefillSettings = async () => {
    setLoadingAutoRefill(true)
    try {
      const response = await fetch('/api/wallet/auto-refill')
      if (response.ok) {
        const data = await response.json()
        setAutoRefill({
          enabled: data.enabled,
          amount: parseFloat(data.amountDollars),
          threshold: parseFloat(data.thresholdDollars),
          hasPaymentMethod: data.hasPaymentMethod
        })
      }
    } catch (error) {
      console.error('Failed to fetch auto-refill settings:', error)
    } finally {
      setLoadingAutoRefill(false)
    }
  }

  const saveAutoRefillSettings = async () => {
    setSavingAutoRefill(true)
    try {
      const response = await fetch('/api/wallet/auto-refill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: autoRefill.enabled,
          amount: autoRefill.amount,
          threshold: autoRefill.threshold
        })
      })

      if (response.ok) {
        const data = await response.json()
        setAutoRefill({
          enabled: data.enabled,
          amount: parseFloat(data.amountDollars),
          threshold: parseFloat(data.thresholdDollars),
          hasPaymentMethod: autoRefill.hasPaymentMethod
        })
        alert('Auto-refill settings saved!')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Failed to save auto-refill settings:', error)
      alert('Failed to save settings')
    } finally {
      setSavingAutoRefill(false)
    }
  }

  const triggerAutoRefill = async () => {
    try {
      const response = await fetch('/api/wallet/trigger-auto-refill', {
        method: 'POST'
      })

      const data = await response.json()
      
      if (response.ok) {
        alert(data.message)
        await fetchBalance() // Refresh wallet balance
        await fetchTransactions() // Refresh transactions
      } else {
        alert(data.error || 'Auto-refill failed')
      }
    } catch (error) {
      console.error('Auto-refill trigger error:', error)
      alert('Failed to trigger auto-refill')
    }
  }

  const fetchTransactions = async () => {
    setLoadingTransactions(true)
    try {
      const response = await fetch('/api/wallet/transactions?limit=10')
      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions || [])
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    } finally {
      setLoadingTransactions(false)
    }
  }

  const handleAddFunds = async (amount: number) => {
    try {
      const data = await addFunds(amount, false, '/settings')
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error: any) {
      alert(error.message || 'Failed to add funds')
    }
  }

  if (!wallet) {
    return (
      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h3 className="font-display text-lg font-semibold text-neutral-900 mb-3">
          💰 Impact Wallet
        </h3>
        <p className="text-sm text-neutral-600">Loading wallet information...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Wallet Balance */}
      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold text-neutral-900">
            💰 Impact Wallet
          </h3>
          <button
            onClick={() => setShowAddFunds(!showAddFunds)}
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Add Funds
          </button>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-600">Current Balance</span>
            <span className="text-lg font-bold text-neutral-900">${wallet.balanceDollars}</span>
          </div>
          
          {wallet.isLowBalance && (
            <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="text-orange-600">⚠️</div>
              <div className="text-sm">
                <span className="font-medium text-orange-800">Low Balance</span>
                <span className="text-orange-600 ml-2">
                  Consider adding funds for instant donations
                </span>
              </div>
            </div>
          )}
          
          <div className="text-xs text-neutral-500 pt-2 border-t border-neutral-200">
            Use your wallet for one-click donations to any project. Unused funds automatically support approved projects in your ZIP code.
          </div>
        </div>

        {/* Quick add funds section */}
        {showAddFunds && (
          <div className="mt-4 pt-4 border-t border-neutral-200">
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[25, 50, 100, 200].map(amount => (
                <button
                  key={amount}
                  onClick={() => handleAddFunds(amount)}
                  className="text-xs px-3 py-2 border border-neutral-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition"
                >
                  +${amount}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                min="25"
                value={fundAmount}
                onChange={(e) => setFundAmount(Math.max(25, parseInt(e.target.value) || 25))}
                className="flex-1 text-sm px-3 py-2 border border-neutral-300 rounded-lg"
                placeholder="Custom amount"
              />
              <button
                onClick={() => handleAddFunds(fundAmount)}
                className="text-sm px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
              >
                Add Funds
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Auto-refill Settings */}
      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h3 className="font-display text-lg font-semibold text-neutral-900 mb-3">
          🔄 Auto-Refill Settings
        </h3>
        
        {loadingAutoRefill ? (
          <p className="text-sm text-neutral-600">Loading auto-refill settings...</p>
        ) : (
          <div className="space-y-4">
            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-neutral-900">Monthly Auto-Refill</span>
                <p className="text-xs text-neutral-600">Automatically add funds when balance gets low</p>
              </div>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefill.enabled}
                  onChange={(e) => setAutoRefill(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="sr-only"
                />
                <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoRefill.enabled ? 'bg-emerald-600' : 'bg-neutral-300'
                }`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoRefill.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </div>
              </label>
            </div>

            {autoRefill.enabled && (
              <div className="space-y-3 pt-3 border-t border-neutral-200">
                {/* Refill Amount */}
                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-1">
                    Refill Amount
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-neutral-600">$</span>
                    <input
                      type="number"
                      min="25"
                      step="5"
                      value={autoRefill.amount}
                      onChange={(e) => setAutoRefill(prev => ({ 
                        ...prev, 
                        amount: Math.max(25, parseFloat(e.target.value) || 25) 
                      }))}
                      className="flex-1 text-sm px-3 py-2 border border-neutral-300 rounded-lg"
                    />
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">Minimum $25</p>
                </div>

                {/* Threshold */}
                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-1">
                    Low Balance Threshold
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-neutral-600">$</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={autoRefill.threshold}
                      onChange={(e) => setAutoRefill(prev => ({ 
                        ...prev, 
                        threshold: Math.max(1, parseFloat(e.target.value) || 10) 
                      }))}
                      className="flex-1 text-sm px-3 py-2 border border-neutral-300 rounded-lg"
                    />
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    Auto-refill triggers when balance drops below this amount
                  </p>
                </div>

                {/* Payment Method Status */}
                <div className="flex items-center gap-2 p-3 rounded-lg bg-neutral-50">
                  <div className={`w-2 h-2 rounded-full ${autoRefill.hasPaymentMethod ? 'bg-emerald-500' : 'bg-orange-500'}`}></div>
                  <span className="text-sm text-neutral-700">
                    {autoRefill.hasPaymentMethod 
                      ? 'Payment method saved for auto-refill' 
                      : 'Add funds once to enable auto-refill'
                    }
                  </span>
                </div>

                {/* Test Auto-Refill */}
                <div className="flex gap-2">
                  <button
                    onClick={saveAutoRefillSettings}
                    disabled={savingAutoRefill}
                    className="flex-1 text-sm px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                  >
                    {savingAutoRefill ? 'Saving...' : 'Save Settings'}
                  </button>
                  
                  {autoRefill.hasPaymentMethod && wallet && wallet.balance < (autoRefill.threshold * 100) && (
                    <button
                      onClick={triggerAutoRefill}
                      className="text-sm px-4 py-2 border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 transition"
                    >
                      Test Refill
                    </button>
                  )}
                </div>
              </div>
            )}

            {!autoRefill.enabled && (
              <p className="text-xs text-neutral-500 pt-2 border-t border-neutral-200">
                Enable auto-refill to never miss a donation opportunity. Your wallet will automatically top up when the balance gets low.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold text-neutral-900">
            📊 Recent Transactions
          </h3>
          <button
            onClick={fetchTransactions}
            disabled={loadingTransactions}
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium disabled:opacity-50"
          >
            {loadingTransactions ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {transactions.length === 0 ? (
          <p className="text-sm text-neutral-600 text-center py-4">
            No transactions yet. Add funds to start making a difference!
          </p>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${tx.type === 'credit' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {tx.type === 'credit' ? '↗️' : '↙️'}
                    </span>
                    <span className="text-sm font-medium text-neutral-900">
                      {tx.type === 'credit' ? '+' : '-'}${tx.amountDollars}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 mt-1">{tx.description}</p>
                  {tx.relatedProject && (
                    <p className="text-xs text-emerald-600 mt-1">
                      Project: {tx.relatedProject.title}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xs text-neutral-500">
                    {new Date(tx.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                  <div className="text-xs text-neutral-600">
                    Balance: ${tx.balanceAfterDollars}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}