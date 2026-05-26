export type HanfuItem = {
  id: string
  name: string
  style: string
  coverIdx: number
  coverUrl?: string
  pricePerDay: number
  deposit: number
  stock: number
  sales: number
  sizes: string[]
  colors: string[]
  gender: '男' | '女' | '中性'
  tags: string[]
  desc: string
}

export type RentalOrder = {
  id: string
  items: RentalOrderItem[]
  renter: RenterInfo
  rentStart: string
  rentEnd: string
  totalDays: number
  totalRentalFee: number
  totalDeposit: number
  grandTotal: number
  status: RentalStatus
  statusText: string
  createTime: string
  pickupTime?: string
  returnTime?: string
  notes?: string
}

export type RentalOrderItem = {
  id: string
  name: string
  coverIdx: number
  coverUrl?: string
  selectedSize: string
  selectedColor: string
  quantity: number
  pricePerDay: number
  deposit: number
  rentStart: string
  rentEnd: string
  subtotal: number
}

export type RenterInfo = {
  name: string
  phone: string
  idCard: string
  pickupMethod: 'store' | 'delivery'
  address: string
  notes: string
}

export type RentalStatus = 'pending_pickup' | 'renting' | 'returned' | 'overdue' | 'cancelled'

export const statusConfig: Record<RentalStatus, { label: string; color: string }> = {
  pending_pickup: { label: '待取衣', color: '#E6A23C' },
  renting: { label: '租赁中', color: '#409EFF' },
  returned: { label: '已归还', color: '#67C23A' },
  overdue: { label: '逾期中', color: '#F56C6C' },
  cancelled: { label: '已取消', color: '#999' },
}

export const hanfuList: HanfuItem[] = [
  { id: 'h1', name: '青衣水袖 · 月白', style: '青衣', coverIdx: 1, pricePerDay: 88, deposit: 260, stock: 5, sales: 168, sizes: ['S','M','L','XL'], colors: ['月白','水蓝'], gender: '女', tags: ['热门','青衣','水袖'], desc: '晋剧青衣水袖套装，月白缎面配浅蓝滚边，袖长适合练习云手、亮相和经典唱段展示。' },
  { id: 'h2', name: '花旦短袄 · 桃花粉', style: '花旦', coverIdx: 2, pricePerDay: 78, deposit: 220, stock: 8, sales: 142, sizes: ['S','M','L'], colors: ['桃花粉','柳绿'], gender: '女', tags: ['花旦','俏丽'], desc: '花旦短袄配彩裙，色彩明快，适合《打金枝》等轻快折子戏体验、研学拍摄与舞台走位。' },
  { id: 'h3', name: '老生褶子 · 玄青', style: '老生', coverIdx: 3, pricePerDay: 86, deposit: 260, stock: 4, sales: 96, sizes: ['M','L','XL'], colors: ['玄青','月白'], gender: '男', tags: ['老生','褶子'], desc: '老生褶子沉稳端正，配可拆腰带和袖口内衬，适合须生唱段、身段课和剧目导览演示。' },
  { id: 'h4', name: '武生靠衣 · 赤金', style: '武生', coverIdx: 4, pricePerDay: 128, deposit: 420, stock: 3, sales: 213, sizes: ['M','L','XL'], colors: ['赤金','靛蓝'], gender: '男', tags: ['武生','靠旗','热卖'], desc: '武生靠衣含靠旗、护肩和腰封，视觉冲击强，适合三关点帅类武戏展示和沉浸式打卡。' },
  { id: 'h5', name: '晋剧公主蟒 · 凤穿牡丹', style: '旦角', coverIdx: 5, pricePerDay: 138, deposit: 450, stock: 3, sales: 287, sizes: ['S','M','L','XL'], colors: ['藏蓝','酒红'], gender: '女', tags: ['旦角','蟒袍','爆款'], desc: '公主蟒袍以凤穿牡丹纹样呼应《打金枝》人物气质，织金纹饰饱满，适合舞台体验与主题写真。' },
  { id: 'h6', name: '净角蟒袍 · 绯红', style: '净角', coverIdx: 6, pricePerDay: 148, deposit: 500, stock: 2, sales: 156, sizes: ['L','XL'], colors: ['绯红','玄黑'], gender: '男', tags: ['净角','蟒袍','高端'], desc: '净角蟒袍厚重挺括，肩部纹样夸张，搭配脸谱工坊可完成完整角色造型。' },
  { id: 'h7', name: '小生帔衣 · 葡萄紫', style: '小生', coverIdx: 7, pricePerDay: 96, deposit: 280, stock: 4, sales: 132, sizes: ['M','L','XL'], colors: ['葡萄紫','琥珀黄'], gender: '男', tags: ['小生','帔衣'], desc: '小生帔衣线条清朗，适合书生、公子类角色体验，轻便好穿，适合社交动态与课堂展示。' },
  { id: 'h8', name: '丑角茶衣 · 玄纁', style: '丑角', coverIdx: 8, pricePerDay: 68, deposit: 180, stock: 3, sales: 89, sizes: ['M','L','XL'], colors: ['玄纁'], gender: '中性', tags: ['丑角','经典'], desc: '丑角茶衣行动灵活，便于表演矮步、圆场和插科打诨身段，适合互动体验课程。' },
  { id: 'h9', name: '花旦云肩 · 天水碧', style: '花旦', coverIdx: 9, pricePerDay: 98, deposit: 260, stock: 3, sales: 201, sizes: ['S','M','L'], colors: ['天水碧','胭脂粉'], gender: '女', tags: ['花旦','云肩','爆款'], desc: '花旦云肩套装层次丰富，水钻与绣片点缀，适合亮相拍照和戏曲主题活动。' },
  { id: 'h10', name: '水袖练功衣 · 月华白', style: '水袖', coverIdx: 10, pricePerDay: 72, deposit: 180, stock: 5, sales: 176, sizes: ['均码'], colors: ['月华白','烟灰蓝'], gender: '中性', tags: ['水袖','中性','练功'], desc: '轻量水袖练功衣，袖长适中，便于初学者练习抛袖、收袖、翻袖等基础动作。' },
  { id: 'h11', name: '老生圆领衫 · 竹青', style: '老生', coverIdx: 11, pricePerDay: 76, deposit: 200, stock: 7, sales: 118, sizes: ['M','L','XL'], colors: ['竹青','月白'], gender: '男', tags: ['老生','男装'], desc: '老生圆领衫质感清雅，适合讲解晋剧行当、日常排练和文旅讲解员角色造型。' },
  { id: 'h12', name: '晋剧彩裙 · 杏子黄', style: '旦角', coverIdx: 12, pricePerDay: 82, deposit: 220, stock: 4, sales: 76, sizes: ['S','M','L'], colors: ['杏子黄','藕荷'], gender: '女', tags: ['旦角','彩裙'], desc: '晋剧彩裙配对襟短衫，色彩温婉，便于搭配云肩、披帛和水袖，适合研学换装。' },
]

export const faqList = [
  { q: '租期如何计算？', a: '租赁以天为单位，从取衣日起算至还衣日，不足一天按一天计算。建议预留1天用于试穿调整。' },
  { q: '押金如何退还？', a: '还衣验收无误后，押金于3个工作日内原路退还。如有污损，根据程度酌情扣除。' },
  { q: '支持异地归还吗？', a: '目前仅支持门店取还。山西省内支持顺丰到付寄还，请在使用后3天内寄出。' },
  { q: '可以试穿吗？', a: '欢迎到店试穿！门店提供免费试穿服务，确认尺码后再下单租赁。' },
  { q: '衣服脏了怎么办？', a: '轻微污渍免费清洗。重度污损或不可逆损坏按定价的30%-50%赔偿。' },
]

export const coverGradient = (idx: number): string => {
  const colors = [
    'linear-gradient(135deg, #D44444, #F5A0A0)',
    'linear-gradient(135deg, #2D3E50, #5C7A9A)',
    'linear-gradient(135deg, #B8A0C0, #E8D0F0)',
    'linear-gradient(135deg, #8B6F4E, #C4A97D)',
    'linear-gradient(135deg, #1A3A5C, #4A7A9C)',
    'linear-gradient(135deg, #8B0000, #CC3333)',
    'linear-gradient(135deg, #6B3F8A, #A070C0)',
    'linear-gradient(135deg, #2D2D2D, #6B6B6B)',
    'linear-gradient(135deg, #3B8E8E, #80C0C0)',
    'linear-gradient(135deg, #C0C0C0, #F0F0F0)',
    'linear-gradient(135deg, #5B8E3E, #8BC060)',
    'linear-gradient(135deg, #D4A050, #F0D080)',
  ]
  return colors[(idx - 1) % colors.length]
}

export const colorMap: Record<string, string> = {
  '月白': '#E8F0F0', '水蓝': '#4A90D9', '桃花粉': '#F0A0A0', '柳绿': '#6B8A4E',
  '玄青': '#2D3E50', '赤金': '#C9A84C', '靛蓝': '#1E3A8A', '藏蓝': '#1A3A5C',
  '酒红': '#8B0000', '绯红': '#CC3333', '玄黑': '#2D2D2D', '葡萄紫': '#6B3F8A',
  '琥珀黄': '#C9A84C', '玄纁': '#8B3A3A', '天水碧': '#3B8E8E', '胭脂粉': '#F0A0A0',
  '月华白': '#F0F0F0', '烟灰蓝': '#9090A0', '竹青': '#6B8A4E', '杏子黄': '#E8C860',
  '藕荷': '#B8A0C0',
}

export const styles = ['全部', '青衣', '花旦', '老生', '武生', '旦角', '净角', '小生', '丑角', '水袖']

export function calcDays(start: string, end: string): number {
  if (!start || !end) return 0
  return Math.max(0, Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)))
}

export function formatDate(d: string): string {
  if (!d) return '-'
  const parts = d.split('-')
  return `${parts[0]}.${parts[1]}.${parts[2]}`
}

export function formatDateShort(d: string): string {
  if (!d) return ''
  const parts = d.split('-')
  return `${parts[1]}/${parts[2]}`
}

export function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

export function saveOrders(orders: RentalOrder[]) {
  localStorage.setItem('jh_rental_orders', JSON.stringify(orders))
}

export function loadOrders(): RentalOrder[] {
  try {
    return JSON.parse(localStorage.getItem('jh_rental_orders') || '[]')
  } catch {
    return []
  }
}

// Dexie helpers for rental orders
export async function loadOrdersFromDB(accountId?: string): Promise<RentalOrder[]> {
  try {
    const { getRentalOrders } = await import('./dbStore')
    const dbOrders = await getRentalOrders(accountId)
    return dbOrders.map(o => ({
      id: o.id, items: o.items.map(i => ({ id: i.itemId, name: i.name, coverIdx: 0, selectedSize: i.size, selectedColor: i.color, quantity: i.quantity, pricePerDay: i.dailyPrice, deposit: 0, rentStart: o.rentalStart, rentEnd: o.rentalEnd, subtotal: i.subtotal })),
      renter: { name: o.recipient, phone: o.phone, idCard: '', pickupMethod: 'store' as const, address: o.address || '', notes: '' },
      rentStart: o.rentalStart, rentEnd: o.rentalEnd, totalDays: o.totalDays,
      totalRentalFee: o.subtotal, totalDeposit: o.deposit, grandTotal: o.totalAmount,
      status: (o.status === 'renting' ? 'renting' : o.status === 'returned' || o.status === 'completed' ? 'returned' : o.status === 'cancelled' ? 'cancelled' : 'pending_pickup') as RentalStatus,
      statusText: ({pending:'待取衣',paid:'已支付',shipped:'已发货',renting:'租赁中',returned:'已归还',completed:'已完成',cancelled:'已取消'})[o.status] || o.status,
      createTime: o.createdAt, pickupTime: o.status === 'renting' || o.status === 'returned' ? o.createdAt : undefined, returnTime: o.returnedAt,
    } as RentalOrder))
  } catch {
    return []
  }
}

export async function saveOrderToDB(order: RentalOrder, accountId: string) {
  try {
    const { placeRentalOrder } = await import('./dbStore')
    await placeRentalOrder({
      id: order.id, accountId,
      items: order.items.map(i => ({ itemId: i.id, name: i.name, size: i.selectedSize, color: i.selectedColor, quantity: i.quantity, dailyPrice: i.pricePerDay, days: order.totalDays, subtotal: i.subtotal })),
      totalDays: order.totalDays, rentalStart: order.rentStart, rentalEnd: order.rentEnd,
      subtotal: order.totalRentalFee, deposit: order.totalDeposit, totalAmount: order.grandTotal,
      recipient: order.renter.name, phone: order.renter.phone, address: order.renter.address || '',
      status: 'pending', createdAt: order.createTime,
    })
  } catch (e) { console.warn('DB save failed, using localStorage fallback', e) }
}
