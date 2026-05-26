import { Minus, Plus, ChevronLeft } from 'lucide-react'
import type { HanfuCartItem } from './types'
import { CoverImg } from './helpers'
import { coverGradient, calcDays, formatDateShort } from '../../data/hanfuData'

interface HanfuCartProps {
  cart: HanfuCartItem[]
  onBack: () => void
  onRemove: (idx: number) => void
  onUpdateQty: (idx: number, delta: number) => void
  totalFee: number
  totalDeposit: number
  onCheckout: () => void
}

export default function HanfuCart({ cart, onBack, onRemove, onUpdateQty, totalFee, totalDeposit, onCheckout }: HanfuCartProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="rounded-2xl p-2 glass-control text-white/70 hover:text-white"><ChevronLeft className="h-5 w-5" /></button>
        <h2 className="text-xl font-bold text-white">🧺 租赁清单</h2>
      </div>

      {cart.length === 0 ? (
        <div className="py-20 text-center">
          <div className="text-5xl mb-4">👘</div>
          <p className="text-white/50 text-sm">租赁清单还是空的</p>
        </div>
      ) : (
        <>
          <div className="rounded-2xl glass-panel p-3 text-sm text-white/60">
            📌 请确认尺码和租期无误后再提交
          </div>

          {cart.map((item, idx) => {
            const days = calcDays(item.rentStart, item.rentEnd)
            return (
              <div key={idx} className="glass-panel rounded-2xl p-4 flex gap-3 items-start">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0" style={{ background: item.coverUrl ? "#transparent" : coverGradient(item.coverIdx) }}>
                  <CoverImg coverUrl={item.coverUrl} emojiSize="text-2xl" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white/90 text-sm">{item.name}</h4>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-white/50">📏 {item.selectedSize}</span>
                    {item.selectedColor && <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-white/50">🎨 {item.selectedColor}</span>}
                  </div>
                  <div className="text-xs text-white/40 mt-1">{formatDateShort(item.rentStart)} → {formatDateShort(item.rentEnd)} <span className="bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded ml-1">{days}天</span></div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-white/40">¥{item.pricePerDay}/天 × {item.quantity}</span>
                    <span className="text-amber-400 font-semibold">¥{item.pricePerDay * days * item.quantity}</span>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-1">
                    <button onClick={() => onUpdateQty(idx, -1)} className="w-6 h-6 rounded-full glass-control flex items-center justify-center text-xs"><Minus className="h-3 w-3" /></button>
                    <span className="text-sm font-bold text-white w-5 text-center">{item.quantity}</span>
                    <button onClick={() => onUpdateQty(idx, 1)} className="w-6 h-6 rounded-full glass-control flex items-center justify-center text-xs"><Plus className="h-3 w-3" /></button>
                  </div>
                  <button onClick={() => onRemove(idx)} className="text-xs text-white/30 hover:text-red-400">🗑️</button>
                </div>
              </div>
            )
          })}

          <div className="glass-panel rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white/80 mb-3">💰 费用明细</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-white/60"><span>租金总计</span><span className="text-white">¥{totalFee}</span></div>
              <div className="flex justify-between text-white/60"><span>押金总计（可退）</span><span className="text-amber-300">¥{totalDeposit}</span></div>
              <div className="flex justify-between pt-2 border-t border-white/10 text-base">
                <span className="text-white font-semibold">需预付</span>
                <span className="text-amber-400 font-bold text-xl">¥{totalFee + totalDeposit}</span>
              </div>
              <p className="text-xs text-white/30 mt-1">* 押金还衣验收后3个工作日内退还</p>
            </div>
          </div>

          <button onClick={onCheckout}
            className="w-full rounded-2xl bg-gradient-to-r from-red-800 to-red-600 py-3.5 font-bold text-white hover:from-red-700 hover:to-red-500">
            提交租赁（¥{totalFee + totalDeposit}）
          </button>
        </>
      )}
    </div>
  )
}
