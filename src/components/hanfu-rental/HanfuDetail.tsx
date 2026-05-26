import { useState } from 'react'
import { ChevronLeft, Minus, Plus } from 'lucide-react'
import type { HanfuItem } from '../../data/hanfuData'
import { coverGradient, colorMap, calcDays, todayStr, addDays } from '../../data/hanfuData'
import type { HanfuCartItem } from './types'
import { coverObjectPosition } from './helpers'

interface HanfuDetailProps {
  item: HanfuItem
  onBack: () => void
  onAddToCart: (item: HanfuCartItem) => void
  onGoCart: () => void
}

export default function HanfuDetail({ item, onBack, onAddToCart, onGoCart }: HanfuDetailProps) {
  const today = todayStr()
  const [size, setSize] = useState(item.sizes[0] || '')
  const [color, setColor] = useState(item.colors[0] || '')
  const [rentStart, setRentStart] = useState(addDays(today, 1))
  const [rentEnd, setRentEnd] = useState(addDays(today, 3))
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  const days = calcDays(rentStart, rentEnd)
  const rental = item.pricePerDay * days * qty
  const deposit = item.deposit * qty

  const handleAdd = () => {
    onAddToCart({ ...item, selectedSize: size, selectedColor: color, quantity: qty, rentStart, rentEnd, coverUrl: item.coverUrl })
    setAdded(true)
  }

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="inline-flex items-center gap-1 rounded-2xl px-4 py-2 text-sm glass-control text-white/70 hover:text-white">
        <ChevronLeft className="h-4 w-4" /> 返回列表
      </button>

      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="h-64 flex items-center justify-center relative" style={{ background: item.coverUrl ? 'transparent' : coverGradient(item.coverIdx) }}>
          {item.coverUrl ? <img src={item.coverUrl} alt={item.name} className="w-full h-full object-cover" style={{ objectPosition: coverObjectPosition(item.id) }} /> : <span className="text-7xl" style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.4))' }}>👘</span>}
        </div>
        <div className="p-5">
          <div className="flex gap-2 mb-2">
            <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs text-amber-300">{item.style}</span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/60">{item.gender === '男' ? '♂ 男款' : item.gender === '女' ? '♀ 女款' : '⚤ 中性'}</span>
          </div>
          <h2 className="text-2xl font-bold text-white">{item.name}</h2>
          <p className="mt-2 text-sm text-white/60">{item.desc}</p>
          <div className="mt-4 flex items-center justify-between p-4 rounded-2xl bg-white/5">
            <div>
              <span className="text-3xl font-bold text-amber-400">¥{item.pricePerDay}</span>
              <span className="text-sm text-white/40 ml-1">/天</span>
            </div>
            <div className="text-right">
              <div className="text-xs text-white/40">押金</div>
              <div className="text-lg font-bold text-amber-300">¥{item.deposit}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Size */}
      <div className="glass-panel rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white/80 mb-3">📏 选择尺码</h3>
        <div className="flex gap-2">
          {item.sizes.map(s => (
            <button key={s} onClick={() => setSize(s)}
              className={`flex-1 rounded-2xl py-3 text-sm font-semibold transition-all ${size === s ? 'bg-amber-500/30 text-amber-300 border border-amber-500/30' : 'glass-control text-white/60'}`}>{s}</button>
          ))}
        </div>
      </div>

      {/* Color */}
      {item.colors.length > 0 && (
        <div className="glass-panel rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white/80 mb-3">🎨 选择颜色</h3>
          <div className="flex gap-2 flex-wrap">
            {item.colors.map(c => (
              <button key={c} onClick={() => setColor(c)}
                className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm transition-all ${color === c ? 'bg-amber-500/30 text-amber-300 border border-amber-500/30' : 'glass-control text-white/60'}`}>
                <span className="w-3.5 h-3.5 rounded-full" style={{ background: colorMap[c] || '#999' }} />
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dates */}
      <div className="glass-panel rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white/80 mb-3">📅 选择租期</h3>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="text-xs text-white/40 mb-1 block">取衣</label>
            <input type="date" value={rentStart} min={today} onChange={e => { setRentStart(e.target.value); if (rentEnd <= e.target.value) setRentEnd(addDays(e.target.value, 2)) }}
              className="w-full rounded-2xl px-4 py-2.5 text-sm text-white glass-control" />
          </div>
          <span className="text-white/30 mt-5">→</span>
          <div className="flex-1">
            <label className="text-xs text-white/40 mb-1 block">还衣</label>
            <input type="date" value={rentEnd} min={rentStart || today} onChange={e => setRentEnd(e.target.value)}
              className="w-full rounded-2xl px-4 py-2.5 text-sm text-white glass-control" />
          </div>
        </div>
        {days > 0 && (
          <div className="mt-3 p-3 rounded-2xl bg-white/5 space-y-1 text-sm">
            <div className="flex justify-between text-white/60"><span>租赁天数</span><span className="text-white">{days}天</span></div>
            <div className="flex justify-between"><span className="text-white/60">租金</span><span className="text-amber-400 font-semibold">¥{rental}</span></div>
            <div className="flex justify-between"><span className="text-white/60">押金</span><span className="text-amber-300 font-semibold">¥{deposit}</span></div>
            <div className="flex justify-between pt-2 border-t border-white/10"><span className="text-white font-semibold">合计</span><span className="text-amber-400 font-bold text-lg">¥{rental + deposit}</span></div>
          </div>
        )}
      </div>

      {/* Qty */}
      <div className="glass-panel rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white/80 mb-3">🔢 数量</h3>
        <div className="flex items-center gap-3">
          <button onClick={() => setQty(p => Math.max(1, p - 1))} className="rounded-2xl p-2 glass-control"><Minus className="h-5 w-5" /></button>
          <span className="text-xl font-bold text-white w-8 text-center">{qty}</span>
          <button onClick={() => setQty(p => Math.min(item.stock, p + 1))} className="rounded-2xl p-2 glass-control"><Plus className="h-5 w-5" /></button>
          <span className="text-xs text-white/30 ml-auto">库存 {item.stock} 件</span>
        </div>
      </div>

      {/* Add to cart */}
      <div className="flex gap-3 sticky bottom-0 py-3">
        <button onClick={handleAdd}
          className="flex-1 rounded-2xl bg-gradient-to-r from-amber-500/30 to-red-900/40 py-3.5 font-bold text-amber-300 hover:from-amber-500/40">
          {added ? '✅ 已加入' : '加入租赁清单'}
        </button>
        <button onClick={onGoCart}
          className="rounded-2xl bg-gradient-to-r from-red-800 to-red-600 px-6 py-3.5 font-bold text-white hover:from-red-700 hover:to-red-500">
          去结算
        </button>
      </div>
    </div>
  )
}
