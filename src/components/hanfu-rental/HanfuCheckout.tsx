import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import PaymentModal from '../PaymentModal'
import type { Account } from '../../accountStore'
import type { RenterInfo, RentalOrder } from '../../data/hanfuData'
import { calcDays, coverGradient, loadOrders, saveOrders, saveOrderToDB } from '../../data/hanfuData'
import type { HanfuCartItem } from './types'
import { genOrderId, CoverImg } from './helpers'

interface HanfuCheckoutProps {
  cart: HanfuCartItem[]
  totalFee: number
  totalDeposit: number
  onBack: () => void
  onSuccess: (order: RentalOrder) => void
  currentAccount?: Account
}

export default function HanfuCheckout({ cart, totalFee, totalDeposit, onBack, onSuccess, currentAccount }: HanfuCheckoutProps) {
  const acct = currentAccount
  const [renter, setRenter] = useState<RenterInfo>(() => {
    return { name: acct?.displayName || acct?.username || '', phone: '', idCard: '', pickupMethod: 'store', address: '', notes: '' }
  })
  const [selectedSlot, setSelectedSlot] = useState('10:00-12:00')
  const [agreed, setAgreed] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [paymentView, setPaymentView] = useState(false)
  const [pendingOrder, setPendingOrder] = useState<RentalOrder | null>(null)
  const timeSlots = ['10:00-12:00', '12:00-14:00', '14:00-16:00', '16:00-18:00']
  const pickupMethods = [
    { id: 'store' as const, icon: '🏪', label: '到店自取', desc: '免费试穿，当场确认尺码' },
    { id: 'delivery' as const, icon: '📦', label: '邮寄（到付）', desc: '仅限山西省内，顺丰到付' },
  ]
  const canSubmit = agreed && renter.name.trim() && renter.phone.trim() && renter.idCard.trim()

  const genOrder = (): RentalOrder => {
    const orderId = genOrderId()
    const start = cart[0]?.rentStart || ''
    const end = cart[0]?.rentEnd || ''
    const days = calcDays(start, end)
    return {
      id: orderId, items: cart.map(i => ({ id: i.id, name: i.name, coverIdx: i.coverIdx, selectedSize: i.selectedSize, selectedColor: i.selectedColor, quantity: i.quantity, pricePerDay: i.pricePerDay, deposit: i.deposit, rentStart: i.rentStart, rentEnd: i.rentEnd, subtotal: i.pricePerDay * days * i.quantity })),
      renter: { ...renter }, rentStart: start, rentEnd: end, totalDays: days,
      totalRentalFee: totalFee, totalDeposit: totalDeposit, grandTotal: totalFee + totalDeposit,
      status: 'pending_pickup', statusText: '待取衣', createTime: new Date().toISOString(),
    }
  }

  const handlePlace = () => {
    if (!canSubmit) return
    setSubmitting(true)
    setTimeout(() => {
      setPendingOrder(genOrder())
      setSubmitting(false)
      setPaymentView(true)
    }, 800)
  }

  const handlePaid = () => {
    setTimeout(() => {
      if (pendingOrder) {
        saveOrderToDB(pendingOrder, currentAccount?.id || 'guest').then(() => {
          const orders = loadOrders()
          orders.unshift(pendingOrder)
          saveOrders(orders)
        }).catch(() => {
          const orders = loadOrders()
          orders.unshift(pendingOrder)
          saveOrders(orders)
        })
        setPaymentView(false)
        onSuccess(pendingOrder)
      }
    }, 600)
  }

  const updateRenter = (k: keyof RenterInfo, v: string) => setRenter(p => ({ ...p, [k]: v }))

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="rounded-2xl p-2 glass-control text-white/70 hover:text-white"><ChevronLeft className="h-5 w-5" /></button>
        <h2 className="text-xl font-bold text-white">确认租赁订单</h2>
      </div>

      {/* 租客信息 */}
      <div className="glass-panel rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white/80">👤 租客信息</h3>
        {(['name', 'phone', 'idCard', 'notes'] as const).map(field => (
          <div key={field}>
            <label className="text-xs text-white/40 mb-1 block">
              {field === 'name' ? '姓名' : field === 'phone' ? '手机号' : field === 'idCard' ? '身份证号' : '备注（选填）'}
            </label>
            <input value={renter[field]} onChange={e => updateRenter(field, e.target.value)}
              placeholder={field === 'name' ? '请输入真实姓名' : field === 'phone' ? '请输入手机号' : field === 'idCard' ? '租赁需登记身份信息' : '如有特殊需求请备注'}
              className="w-full rounded-2xl px-4 py-2.5 text-sm text-white glass-control" />
          </div>
        ))}
      </div>

      {/* 取衣方式 */}
      <div className="glass-panel rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white/80 mb-3">取衣方式</h3>
        <div className="space-y-2">
          {pickupMethods.map(m => (
            <div key={m.id} onClick={() => updateRenter('pickupMethod', m.id)}
              className={`flex items-center gap-3 rounded-2xl p-3 cursor-pointer transition-all ${renter.pickupMethod === m.id ? 'bg-amber-500/10 border border-amber-500/20' : 'glass-control'}`}>
              <span className="text-2xl">{m.icon}</span>
              <div className="flex-1"><div className="text-sm text-white/80 font-medium">{m.label}</div><div className="text-xs text-white/40">{m.desc}</div></div>
            </div>
          ))}
        </div>
        {renter.pickupMethod === 'delivery' && (
          <textarea value={renter.address} onChange={e => updateRenter('address', e.target.value)}
            placeholder="请填写详细收货地址（仅限山西省内）"
            className="w-full mt-3 rounded-2xl px-4 py-2.5 text-sm text-white glass-control" rows={2} />
        )}
      </div>

      {/* 预约时间 */}
      <div className="glass-panel rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white/80 mb-3">⏰ 预约取衣时间</h3>
        <div className="flex gap-2 flex-wrap">
          {timeSlots.map(s => (
            <button key={s} onClick={() => setSelectedSlot(s)}
              className={`rounded-2xl px-4 py-2 text-sm transition-all ${selectedSlot === s ? 'bg-amber-500/30 text-amber-300 border border-amber-500/30' : 'glass-control text-white/60'}`}>{s}</button>
          ))}
        </div>
      </div>

      {/* 租赁物品 */}
      <div className="glass-panel rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white/80 mb-3">👘 租赁清单</h3>
        {cart.map((item, idx) => {
          const days = calcDays(item.rentStart, item.rentEnd)
          return (
            <div key={idx} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 overflow-hidden" style={{ background: item.coverUrl ? "#transparent" : coverGradient(item.coverIdx) }}>
                <CoverImg coverUrl={item.coverUrl} emojiSize="text-lg" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white/80">{item.name}</div>
                <div className="text-xs text-white/40">{item.selectedSize} · {item.selectedColor} · ×{item.quantity}</div>
              </div>
              <div className="text-sm text-amber-400 font-semibold">¥{item.pricePerDay * days * item.quantity}</div>
            </div>
          )
        })}
      </div>

      {/* 费用 */}
      <div className="glass-panel rounded-2xl p-5">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-white/60"><span>租金</span><span>¥{totalFee}</span></div>
          <div className="flex justify-between text-white/60"><span>押金</span><span className="text-amber-300">¥{totalDeposit}</span></div>
          <div className="flex justify-between text-white/60"><span>取衣方式</span><span>{renter.pickupMethod === 'store' ? '到店自取' : '邮寄（到付）'}</span></div>
          <div className="flex justify-between pt-2 border-t border-white/10 text-base">
            <span className="text-white font-semibold">需预付</span>
            <span className="text-amber-400 font-bold text-xl">¥{totalFee + totalDeposit}</span>
          </div>
        </div>
      </div>

      {/* 协议 */}
      <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
        <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="rounded accent-amber-500" />
        <span>我已阅读并同意 <span className="text-amber-400 underline cursor-pointer" onClick={e => { e.preventDefault(); setShowTerms(true) }}>《戏服租赁协议》</span></span>
      </label>

      {/* Terms Modal */}
      <AnimatePresence>
        {showTerms && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setShowTerms(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-sm rounded-2xl p-6 glass-window" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-white mb-3">📋 戏服租赁协议</h3>
              <div className="space-y-2 text-sm text-white/60">
                <p>1. 租客需提供真实身份信息进行实名登记。</p>
                <p>2. 租赁期间请爱惜衣物，避免污损、撕裂、染色等损坏。</p>
                <p>3. 轻微污渍无需赔偿，重度污损按定价的30%-50%赔偿。</p>
                <p>4. 逾期归还按日租金的2倍收取超期费用。</p>
                <p>5. 押金在还衣验收无误后3个工作日内退还。</p>
                <p>6. 如因特殊原因无法按时取衣，请提前24小时联系客服改期。</p>
              </div>
              <button onClick={() => { setShowTerms(false); setAgreed(true) }} className="w-full mt-4 rounded-2xl bg-amber-500/20 py-3 text-sm font-bold text-amber-300">我已阅读并同意</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <button onClick={handlePlace} disabled={!canSubmit || submitting}
        className="w-full rounded-2xl bg-gradient-to-r from-red-800 to-red-600 py-3.5 font-bold text-white disabled:opacity-50 hover:from-red-700 hover:to-red-500">
        {submitting ? '提交中...' : `提交租赁订单（¥${totalFee + totalDeposit}）`}
      </button>

      {/* Payment Modal */}
      <AnimatePresence>
        {paymentView && pendingOrder && (
          <PaymentModal
            config={{ orderId: pendingOrder.id, amount: totalFee + totalDeposit, type: 'rental', summary: [
              { label: '租金', value: '¥' + totalFee },
              { label: '押金（可退）', value: '¥' + totalDeposit },
            ]}}
            onClose={() => setPaymentView(false)}
            onSuccess={handlePaid}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
