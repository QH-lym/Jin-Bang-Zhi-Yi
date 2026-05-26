import { ChevronLeft } from 'lucide-react'
import type { RentalOrder, RentalStatus } from '../../data/hanfuData'
import { statusConfig, coverGradient, formatDate } from '../../data/hanfuData'
import { CoverImg } from './helpers'

interface HanfuOrderDetailProps {
  order: RentalOrder
  onBack: () => void
  onCancel: () => void
  onStatusChange: (id: string, status: RentalStatus) => void
  isAdmin: boolean
}

export default function HanfuOrderDetail({ order, onBack, onCancel, onStatusChange, isAdmin }: HanfuOrderDetailProps) {
  const cfg = statusConfig[order.status]
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="rounded-2xl p-2 glass-control text-white/70 hover:text-white"><ChevronLeft className="h-5 w-5" /></button>
        <h2 className="text-xl font-bold text-white">订单详情</h2>
      </div>

      <div className="glass-panel rounded-2xl p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-xs text-white/30 font-mono">{order.id}</div>
            <div className="text-xs text-white/40 mt-1">{new Date(order.createTime).toLocaleString('zh-CN')}</div>
          </div>
          <span className="text-sm font-semibold px-3 py-1 rounded" style={{ background: cfg.color + '20', color: cfg.color }}>{cfg.label}</span>
        </div>

        {/* Items */}
        <div className="space-y-2 mb-4">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 overflow-hidden" style={{ background: item.coverUrl ? "#transparent" : coverGradient(item.coverIdx) }}>
                <CoverImg coverUrl={item.coverUrl} emojiSize="text-lg" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white/80">{item.name}</div>
                <div className="text-xs text-white/40">{item.selectedSize} · {item.selectedColor} · ×{item.quantity}</div>
              </div>
              <div className="text-sm text-amber-400 font-semibold">¥{item.subtotal}</div>
            </div>
          ))}
        </div>

        {/* Timeline */}
        {(order.pickupTime || order.returnTime) && (
          <div className="mb-4 p-3 rounded-2xl bg-white/5 space-y-2">
            {order.pickupTime && (
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                <span className="text-white/50">已取衣</span>
                <span className="text-white/30">{new Date(order.pickupTime).toLocaleString('zh-CN')}</span>
              </div>
            )}
            {order.returnTime && (
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                <span className="text-white/50">已归还</span>
                <span className="text-white/30">{new Date(order.returnTime).toLocaleString('zh-CN')}</span>
              </div>
            )}
          </div>
        )}

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-white/5">
            <div className="text-xs text-white/40">取衣</div>
            <div className="text-sm text-white/80 mt-1">{formatDate(order.rentStart)}</div>
          </div>
          <div className="p-3 rounded-2xl bg-white/5">
            <div className="text-xs text-white/40">还衣</div>
            <div className="text-sm text-white/80 mt-1">{formatDate(order.rentEnd)}</div>
          </div>
        </div>

        {/* Pricing */}
        <div className="space-y-1 text-sm mb-4">
          <div className="flex justify-between text-white/60"><span>租金</span><span>¥{order.totalRentalFee}</span></div>
          <div className="flex justify-between text-white/60"><span>押金</span><span className="text-amber-300">¥{order.totalDeposit}</span></div>
          <div className="flex justify-between text-white/60"><span>租期</span><span>{order.totalDays}天</span></div>
          <div className="flex justify-between pt-2 border-t border-white/10 text-base">
            <span className="text-white">预付合计</span>
            <span className="text-amber-400 font-bold text-lg">¥{order.grandTotal}</span>
          </div>
        </div>

        {/* Renter Info */}
        <div className="p-3 rounded-2xl bg-white/5 text-sm space-y-1">
          <div className="text-xs text-white/40 mb-1">租客信息</div>
          <div className="text-white/70">{order.renter.name} · {order.renter.phone}</div>
          <div className="text-white/40 text-xs">取衣：{order.renter.pickupMethod === 'store' ? '到店自取' : '邮寄'}</div>
          {order.renter.notes && <div className="text-white/40 text-xs">备注：{order.renter.notes}</div>}
        </div>

        {/* User Action */}
        {order.status === 'pending_pickup' && !isAdmin && (
          <button onClick={() => { if (confirm('确定取消订单吗？')) onCancel() }}
            className="w-full mt-4 rounded-2xl glass-control py-3 text-sm text-white/50 hover:text-red-400">取消订单</button>
        )}

        {/* Admin Actions */}
        {isAdmin && (
          <div className="mt-4 space-y-2">
            <div className="text-xs text-white/40 mb-2">🔧 管理操作</div>
            {order.status === 'pending_pickup' && (
              <button onClick={() => { if (confirm('确认租客已取衣？')) onStatusChange(order.id, 'renting') }}
                className="w-full rounded-2xl bg-blue-500/20 hover:bg-blue-500/30 py-2.5 text-sm font-bold text-blue-300">✅ 确认取衣</button>
            )}
            {order.status === 'renting' && (
              <button onClick={() => { if (confirm('确认衣物已归还？')) onStatusChange(order.id, 'returned') }}
                className="w-full rounded-2xl bg-green-500/20 hover:bg-green-500/30 py-2.5 text-sm font-bold text-green-300">📦 确认归还</button>
            )}
            {order.status === 'pending_pickup' && (
              <button onClick={() => { if (confirm('确定取消此订单？')) onCancel() }}
                className="w-full rounded-2xl bg-red-500/10 hover:bg-red-500/20 py-2.5 text-sm text-red-400">❌ 取消订单</button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
