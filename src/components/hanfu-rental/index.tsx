import { useState, useMemo, useEffect, useCallback, type ChangeEvent } from 'react'
import { Search, ShoppingBag } from 'lucide-react'
import type { Account } from '../../accountStore'
import type { HanfuItem, RentalOrder, RentalStatus } from '../../data/hanfuData'
import { hanfuList, statusConfig, calcDays, loadOrders, loadOrdersFromDB, saveOrders } from '../../data/hanfuData'
import { updateHanfuItem } from '../../data/dbStore'
import type { HanfuCartItem, ViewState } from './types'
import { withGeneratedCover } from './helpers'
import HanfuList from './HanfuList'
import HanfuDetail from './HanfuDetail'
import HanfuCart from './HanfuCart'
import HanfuCheckout from './HanfuCheckout'
import HanfuOrders from './HanfuOrders'
import HanfuOrderDetail from './HanfuOrderDetail'

export default function HanfuRental({ currentAccount }: { currentAccount?: Account }) {
  const isAdmin = currentAccount?.role === 'admin'
  const [view, setView] = useState<ViewState>('list')
  const [activeStyle, setActiveStyle] = useState('全部')
  const [activeGender, setActiveGender] = useState('')
  const [query, setQuery] = useState('')
  const [showFaq, setShowFaq] = useState(false)
  const [selectedItem, setSelectedItem] = useState<HanfuItem | null>(null)

  // Cart — in-memory only
  const [cart, setCart] = useState<HanfuCartItem[]>([])

  // Orders
  const [orders, setOrders] = useState<RentalOrder[]>([])
  const [selectedOrder, setSelectedOrder] = useState<RentalOrder | null>(null)

  // Admin: custom image management — stored in IndexedDB
  const [hanfuItems, setHanfuItems] = useState<HanfuItem[]>(() => hanfuList.map(withGeneratedCover))
  const [editImgId, setEditImgId] = useState<string | null>(null)
  const [editImgVal, setEditImgVal] = useState('')

  const startEditImg = useCallback((id: string, img: string) => { setEditImgId(id); setEditImgVal(img) }, [])
  const saveEditImg = useCallback(() => {
    if (!editImgId || !editImgVal.trim()) return
    try {
      setHanfuItems(prev => prev.map(x => x.id === editImgId ? { ...x, coverIdx: 0, coverUrl: editImgVal.trim() } as HanfuItem : x))
      updateHanfuItem(editImgId, { images: [editImgVal.trim()] }).catch(() => {})
      setEditImgId(null)
    } catch (e) {
      console.error('保存图片失败', e)
    }
  }, [editImgId, editImgVal])

  const filteredList = useMemo(() => {
    return hanfuItems.filter(item => {
      const m1 = activeStyle === '全部' || item.style === activeStyle
      const m2 = !activeGender || item.gender === activeGender
      const m3 = !query || item.name.includes(query) || item.desc.includes(query) || item.tags.some(t => t.includes(query))
      return m1 && m2 && m3
    })
  }, [activeStyle, activeGender, hanfuItems, query])

  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart])
  const totalRentalFee = useMemo(() => cart.reduce((s, i) => s + i.pricePerDay * calcDays(i.rentStart, i.rentEnd) * i.quantity, 0), [cart])
  const totalDeposit = useMemo(() => cart.reduce((s, i) => s + i.deposit * i.quantity, 0), [cart])

  const addToCart = useCallback((item: HanfuCartItem) => {
    setCart(prev => {
      const idx = prev.findIndex(i =>
        i.id === item.id && i.selectedSize === item.selectedSize &&
        i.selectedColor === item.selectedColor && i.rentStart === item.rentStart && i.rentEnd === item.rentEnd
      )
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], quantity: next[idx].quantity + item.quantity }
        return next
      }
      return [...prev, item]
    })
  }, [])

  const removeFromCart = useCallback((idx: number) => {
    setCart(prev => prev.filter((_, i) => i !== idx))
  }, [])

  const updateCartQty = useCallback((idx: number, delta: number) => {
    setCart(prev => prev.map((item, i) => {
      if (i !== idx) return item
      const q = item.quantity + delta
      return q <= 0 ? { ...item, quantity: 0 } : { ...item, quantity: q }
    }).filter(item => item.quantity > 0))
  }, [])

  const loadOrderList = useCallback(() => {
    loadOrdersFromDB().then(dbOrders => {
      if (dbOrders.length > 0) {
        setOrders(dbOrders)
      } else {
        setOrders(loadOrders())
      }
    }).catch(() => setOrders(loadOrders()))
  }, [])

  useEffect(() => {
    if (view === 'orders' || view === 'order-detail') loadOrderList()
  }, [view, loadOrderList])

  return (
    <div className="space-y-5">
      {/* Header with cart/orders buttons */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
          <input
            value={query}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            placeholder="搜索戏服款式..."
            className="w-full rounded-2xl pl-12 pr-4 py-3 text-white outline-none placeholder-white/40 glass-control focus:border-amber-500/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { loadOrderList(); setView('orders') }}
            className="rounded-2xl px-4 py-3 text-sm glass-control hover:text-amber-400">📋 租赁订单</button>
          <button onClick={() => setView('cart')}
            className="relative rounded-2xl px-4 py-3 glass-control hover:text-amber-400">
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">{cartCount}</span>}
          </button>
        </div>
      </div>

      {/* ─── Views ─── */}
      {view === 'list' && (
        <HanfuList
          filteredList={filteredList}
          activeStyle={activeStyle}
          activeGender={activeGender}
          showFaq={showFaq}
          isAdmin={isAdmin}
          editImgId={editImgId}
          editImgVal={editImgVal}
          onStyleChange={setActiveStyle}
          onGenderChange={setActiveGender}
          onToggleFaq={() => setShowFaq(p => !p)}
          onSelectItem={(item) => { setSelectedItem(item); setView('detail') }}
          onStartEditImg={startEditImg}
          onEditImgValChange={setEditImgVal}
          onSaveEditImg={saveEditImg}
          onCancelEditImg={() => setEditImgId(null)}
        />
      )}

      {view === 'detail' && selectedItem && (
        <HanfuDetail
          item={selectedItem}
          onBack={() => setView('list')}
          onAddToCart={addToCart}
          onGoCart={() => setView('cart')}
        />
      )}

      {view === 'cart' && (
        <HanfuCart
          cart={cart}
          onBack={() => setView('list')}
          onRemove={removeFromCart}
          onUpdateQty={updateCartQty}
          totalFee={totalRentalFee}
          totalDeposit={totalDeposit}
          onCheckout={() => setView('checkout')}
        />
      )}

      {view === 'checkout' && (
        <HanfuCheckout
          cart={cart}
          totalFee={totalRentalFee}
          totalDeposit={totalDeposit}
          onBack={() => setView('cart')}
          onSuccess={(order) => { setCart([]); setSelectedOrder(order); setView('order-detail') }}
          currentAccount={currentAccount}
        />
      )}

      {view === 'orders' && (
        <HanfuOrders
          orders={orders}
          onBack={() => setView('list')}
          onSelectOrder={(o) => { setSelectedOrder(o); setView('order-detail') }}
          onRefresh={loadOrderList}
        />
      )}

      {view === 'order-detail' && selectedOrder && (
        <HanfuOrderDetail
          order={selectedOrder}
          onBack={() => setView('orders')}
          onCancel={() => { cancelOrder(selectedOrder.id); loadOrderList(); setView('orders') }}
          onStatusChange={(id, status) => { updateOrderStatus(id, status); loadOrderList() }}
          isAdmin={isAdmin}
        />
      )}
    </div>
  )

  // ─── Internal helpers (hoisted) ───
  function cancelOrder(orderId: string) {
    const list = loadOrders()
    const o = list.find(x => x.id === orderId)
    if (o) { o.status = 'cancelled'; o.statusText = '已取消'; saveOrders(list) }
    import('../../data/dbStore').then(({ updateRentalOrder }) =>
      updateRentalOrder(orderId, { status: 'cancelled' }).catch(() => {})
    ).catch(() => {})
  }

  function updateOrderStatus(orderId: string, newStatus: RentalStatus) {
    const list = loadOrders()
    const o = list.find(x => x.id === orderId)
    if (o) {
      o.status = newStatus
      o.statusText = statusConfig[newStatus].label
      if (newStatus === 'renting') o.pickupTime = new Date().toISOString()
      if (newStatus === 'returned') o.returnTime = new Date().toISOString()
      saveOrders(list)
    }
    const statusMap: Record<string, string> = { pending_pickup: 'pending', renting: 'renting', returned: 'completed', overdue: 'renting', cancelled: 'cancelled' }
    import('../../data/dbStore').then(({ updateRentalOrder }) =>
      updateRentalOrder(orderId, { status: statusMap[newStatus] as any, returnedAt: newStatus === 'returned' ? new Date().toISOString() : undefined }).catch(() => {})
    ).catch(() => {})
  }
}
