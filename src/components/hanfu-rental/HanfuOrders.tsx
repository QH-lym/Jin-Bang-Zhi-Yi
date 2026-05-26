import { useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import type { RentalOrder, RentalStatus } from '../../data/hanfuData'
import { statusConfig, coverGradient, formatDate } from '../../data/hanfuData'
import { CoverImg } from './helpers'

interface HanfuOrdersProps {
  orders: RentalOrder[]
  onBack: () => void
  onSelectOrder: (o: RentalOrder) => void
  onRefresh: () => void
}

export default function HanfuOrders({ orders, onBack, onSelectOrder, onRefresh }: HanfuOrdersProps) {
  const [filterStatus, setFilterStatus] = useState<RentalStatus | 'all'>('all')
  const statusTabs: { key: RentalStatus | 'all'; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'pending_pickup', label: '待取衣' },
    { key: 'renting', label: '租赁中' },
    { key: 'returned', label: '已归还' },
    { key: 'overdue', label: '逾期' },
  ]
  const filtered = filterStatus === 'all' ? orders : orders.filter(o => o.status === filterStatus)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="rounded-2xl p-2 glass-control text-white/70 hover:text-white"><ChevronLeft className="h-5 w-5" /></button>
        <h2 className="text-xl font-bold text-white">📋 租赁订单</h2>
        <button onClick={onRefresh} className="ml-auto rounded-2xl px-3 py-2 text-sm glass-control text-white/50 hover:text-white">刷新</button>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {statusTabs.map(t => (
          <button key={t.key} onClick={() => setFilterStatus(t.key)}
            className={`shrink-0 rounded-2xl px-4 py-2 text-sm transition-all ${filterStatus === t.key ? 'bg-amber-500/30 text-amber-300' : 'glass-control text-white/60'}`}>{t.label}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <div className="text-5xl mb-4">👘</div>
          <p className="text-white/50 text-sm">还没有租赁记录</p>
        </div>
      ) : (
        filtered.map(order => {
          const cfg = statusConfig[order.status]
          const firstItem = order.items[0]
          return (
            <div key={order.id} onClick={() => onSelectOrder(order)} className="glass-panel rounded-2xl p-4 cursor-pointer hover:border-amber-500/20 transition-all">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-white/30 font-mono">{order.id}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ background: cfg.color + '20', color: cfg.color }}>{cfg.label}</span>
              </div>
              {firstItem && (
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: coverGradient(firstItem.coverIdx) }}>
                    <CoverImg coverUrl={firstItem.coverUrl} emojiSize="text-lg" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-white/80">{firstItem.name}</div>
                    <div className="text-xs text-white/40">{firstItem.selectedSize} · ×{firstItem.quantity} {order.items.length > 1 && `+${order.items.length - 1}件`}</div>
                  </div>
                </div>
              )}
              <div className="flex justify-between text-xs text-white/40">
                <span>📅 {formatDate(order.rentStart)} → {formatDate(order.rentEnd)}</span>
                <span className="text-amber-400 font-semibold">¥{order.grandTotal}</span>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
