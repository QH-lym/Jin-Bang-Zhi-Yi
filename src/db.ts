import Dexie, { type EntityTable } from 'dexie'

export interface DbAccount {
  id: string
  username: string
  displayName: string
  email: string
  phone: string
  password: string
  role: 'admin' | 'user'
  avatar?: string
  createdAt: string
  lastLoginAt?: string
}

export interface DbProduct {
  id: string
  name: string
  category: string
  price: number
  originalPrice?: number
  description: string
  image: string
  rating: number
  sales: number
  tags: string[]
  isNew?: boolean
  isHot?: boolean
}

export interface DbOrder {
  id: string
  accountId: string
  items: { productId: string; name: string; price: number; quantity: number }[]
  total: number
  recipient: string
  phone: string
  address: string
  status: 'pending' | 'paid' | 'shipped' | 'delivered'
  createdAt: string
}

export interface DbDrawing {
  id: string
  accountId: string
  name: string
  canvasData: string
  template: string
  createdAt: string
}

export interface DbFavorite {
  accountId: string
  productIds: string[]
}

export interface DbHanfuItem {
  id: string
  name: string
  dynasty: string       // 行当风格：青衣/花旦/老生/武生/净角
  category: string      // 款式：水袖/蟒袍/靠衣/褶子/整套
  gender: '男' | '女' | '通用'
  sizes: string[]       // 可用尺码
  colors: { name: string; hex: string }[]
  rentalPrice: number   // 日租价格
  deposit: number       // 押金
  originalPrice: number // 原价
  description: string
  images: string[]
  tags: string[]
  stock: Record<string, number>  // { "M-红色": 3, "L-红色": 2 }
  isNew?: boolean
  isHot?: boolean
  isAvailable: boolean
}

export interface DbRentalOrder {
  id: string
  accountId: string
  items: {
    itemId: string
    name: string
    size: string
    color: string
    quantity: number
    dailyPrice: number
    days: number
    subtotal: number
  }[]
  totalDays: number
  rentalStart: string   // ISO date
  rentalEnd: string     // ISO date
  subtotal: number
  deposit: number
  totalAmount: number
  recipient: string
  phone: string
  address: string
  status: 'pending' | 'paid' | 'shipped' | 'renting' | 'returned' | 'completed' | 'cancelled'
  createdAt: string
  returnedAt?: string
}

const db = new Dexie('JinbangDB') as Dexie & {
  accounts: EntityTable<DbAccount, 'id'>
  products: EntityTable<DbProduct, 'id'>
  orders: EntityTable<DbOrder, 'id'>
  drawings: EntityTable<DbDrawing, 'id'>
  favorites: EntityTable<DbFavorite, 'accountId'>
  hanfuItems: EntityTable<DbHanfuItem, 'id'>
  rentalOrders: EntityTable<DbRentalOrder, 'id'>
}

db.version(1).stores({
  accounts: 'id, username, email, role',
  products: 'id, name, category, price',
  orders: 'id, accountId, status, createdAt',
  drawings: 'id, accountId, createdAt',
  favorites: 'accountId',
})

db.version(2).stores({
  accounts: 'id, username, email, role',
  products: 'id, name, category, price',
  orders: 'id, accountId, status, createdAt',
  drawings: 'id, accountId, createdAt',
  favorites: 'accountId',
  hanfuItems: 'id, name, dynasty, category, gender, rentalPrice, isAvailable',
  rentalOrders: 'id, accountId, status, createdAt, rentalStart, rentalEnd',
})

// Seed default data on first open
db.on('populate', () => {
  db.accounts.add({
    id: 'admin-root',
    username: 'admin',
    displayName: '系统管理员',
    email: 'admin@jhfyjxpt.local',
    phone: '13800000000',
    password: btoa('123456'.split('').map(c => String.fromCharCode(c.charCodeAt(0) ^ 0x2a)).join('')),
    role: 'admin',
    createdAt: '2026-05-07T00:00:00.000Z',
  })

  const products: DbProduct[] = [
    { id: '1', name: '晋剧脸谱盲盒', category: '文创周边', price: 68, originalPrice: 88, description: '精选晋剧经典脸谱造型，随机抽取惊喜款，附赠收藏证书，', image: 'product-1.png', rating: 4.8, sales: 1256, tags: ['盲盒', '脸谱', '限量'], isNew: true },
    { id: '2', name: '剪纸艺术书签套装', category: '文创周边', price: 35, description: '传统晋北剪纸技艺，精选12款非遗图案，金属质感', image: 'product-2.png', rating: 4.6, sales: 892, tags: ['剪纸', '书签', '文艺'] },
    { id: '3', name: '皮影戏人偶套装', category: '手作体验', price: 128, originalPrice: 168, description: '手工上色皮影人物，含舞台架，可动手操作表演，', image: 'product-3.png', rating: 4.9, sales: 567, tags: ['皮影', '手作', '亲子'], isHot: true },
    { id: '4', name: '木版年画装饰画', category: '艺术收藏', price: 198, description: '朱仙镇木版年画复刻，手工刷色，装裱完成可直接悬挂', image: 'product-4.png', rating: 4.7, sales: 334, tags: ['年画', '装饰', '装裱'] },
    { id: '5', name: '戏曲主题丝巾', category: '服饰配件', price: 88, originalPrice: 128, description: '真丝材质，晋剧旦角图案数码印花，优雅大方', image: 'product-5.png', rating: 4.5, sales: 1523, tags: ['丝巾', '真丝', '时尚'], isHot: true },
    { id: '6', name: '青铜纹饰文创摆件', category: '家居装饰', price: 256, description: '晋侯墓地青铜器纹饰复刻，树脂材质，精致仿古，', image: 'product-6.png', rating: 4.8, sales: 245, tags: ['青铜', '摆件', '收藏'] },
    { id: '7', name: '刺绣香囊挂件', category: '手作体验', price: 45, description: '平遥刺绣工艺，内含中药香囊，可作车挂/包挂', image: 'product-7.png', rating: 4.4, sales: 2134, tags: ['刺绣', '香囊', '传统'] },
    { id: '8', name: '非遗陶瓷茶具套装', category: '家居生活', price: 368, originalPrice: 428, description: '大同陶瓷工艺，手工拉坯，包含茶壶+6茶杯', image: 'product-8.png', rating: 4.9, sales: 678, tags: ['陶瓷', '茶具', '非遗'], isNew: true },
    { id: '9', name: '晋剧唱腔CD专辑', category: '音像制品', price: 58, description: '收录经典唱段15首，老艺人原声录制，精装盒装', image: 'product-9.png', rating: 4.7, sales: 456, tags: ['CD', '唱腔', '经典'] },
  ]
  products.forEach(p => db.products.add(p))

  db.favorites.add({ accountId: 'admin-root', productIds: [] })

  const hanfuItems: DbHanfuItem[] = [
    { id: 'h1', name: '青衣水袖·月白', dynasty: '青衣', category: '水袖', gender: '女', sizes: ['S','M','L','XL'], colors: [{name:'月白',hex:'#E2E8F0'},{name:'水蓝',hex:'#4A90D9'}], rentalPrice: 88, deposit: 260, originalPrice: 699, description: '晋剧青衣水袖套装，月白缎面配浅蓝滚边，适合唱段展示、研学拍摄与身段练习。', images: ['./generated/costume-rental.png','./generated/costume-rental.png'], tags: ['青衣','水袖','热门'], stock: {'S-月白':2,'M-月白':3,'L-月白':2,'XL-月白':1,'S-水蓝':2,'M-水蓝':3,'L-水蓝':1}, isNew: true, isHot: true, isAvailable: true },
    { id: 'h2', name: '花旦短袄·桃花粉', dynasty: '花旦', category: '整套', gender: '女', sizes: ['S','M','L'], colors: [{name:'桃花粉',hex:'#F0A0A0'},{name:'柳绿',hex:'#6B8A4E'}], rentalPrice: 78, deposit: 220, originalPrice: 599, description: '花旦短袄配彩裙，色彩明快，适合轻快折子戏体验、课堂展示与舞台走位。', images: ['./generated/costume-rental.png','./generated/costume-rental.png'], tags: ['花旦','俏丽','彩裙'], stock: {'S-桃花粉':3,'M-桃花粉':3,'L-桃花粉':2,'S-柳绿':1,'M-柳绿':2,'L-柳绿':1}, isNew: true, isAvailable: true },
    { id: 'h3', name: '老生褶子·玄青', dynasty: '老生', category: '褶子', gender: '男', sizes: ['M','L','XL'], colors: [{name:'玄青',hex:'#2D3E50'},{name:'月白',hex:'#E2E8F0'}], rentalPrice: 86, deposit: 260, originalPrice: 659, description: '老生褶子沉稳端正，配可拆腰带和袖口内衬，适合须生唱段和剧目导览演示。', images: ['./generated/costume-rental.png','./generated/costume-rental.png'], tags: ['老生','褶子','男装'], stock: {'M-玄青':2,'L-玄青':2,'XL-玄青':1,'M-月白':2,'L-月白':2,'XL-月白':1}, isHot: true, isAvailable: true },
    { id: 'h4', name: '武生靠衣·赤金', dynasty: '武生', category: '靠衣', gender: '男', sizes: ['M','L','XL'], colors: [{name:'赤金',hex:'#C9A84C'},{name:'靛蓝',hex:'#1E3A8A'}], rentalPrice: 128, deposit: 420, originalPrice: 999, description: '武生靠衣含靠旗、护肩和腰封，视觉冲击强，适合武戏展示和沉浸式打卡。', images: ['./generated/costume-rental.png','./generated/costume-rental.png'], tags: ['武生','靠旗','热卖'], stock: {'M-赤金':2,'L-赤金':3,'XL-赤金':1,'M-靛蓝':2,'L-靛蓝':2,'XL-靛蓝':1}, isHot: true, isAvailable: true },
    { id: 'h5', name: '晋剧公主蟒·凤穿牡丹', dynasty: '旦角', category: '蟒袍', gender: '女', sizes: ['S','M','L','XL'], colors: [{name:'藏蓝',hex:'#1A3A5C'},{name:'酒红',hex:'#8B0000'}], rentalPrice: 138, deposit: 450, originalPrice: 1099, description: '公主蟒袍以凤穿牡丹纹样呼应《打金枝》人物气质，适合舞台体验与主题写真。', images: ['./generated/costume-rental.png'], tags: ['旦角','蟒袍','爆款'], stock: {'S-藏蓝':3,'M-藏蓝':4,'L-藏蓝':3,'XL-藏蓝':2,'S-酒红':3,'M-酒红':3,'L-酒红':2}, isNew: true, isAvailable: true },
    { id: 'h6', name: '净角蟒袍·绯红', dynasty: '净角', category: '蟒袍', gender: '男', sizes: ['M','L','XL','2XL'], colors: [{name:'绯红',hex:'#CC3333'},{name:'玄黑',hex:'#2D2D2D'}], rentalPrice: 148, deposit: 500, originalPrice: 1199, description: '净角蟒袍厚重挺括，肩部纹样夸张，搭配脸谱工坊可完成完整角色造型。', images: ['./generated/costume-rental.png','./generated/costume-rental.png'], tags: ['净角','蟒袍','高端'], stock: {'M-绯红':2,'L-绯红':3,'XL-绯红':2,'2XL-绯红':1,'M-玄黑':1,'L-玄黑':2,'XL-玄黑':1}, isHot: true, isAvailable: true },
    { id: 'h7', name: '小生帔衣·葡萄紫', dynasty: '小生', category: '帔衣', gender: '男', sizes: ['M','L','XL'], colors: [{name:'葡萄紫',hex:'#6B3F8A'},{name:'琥珀黄',hex:'#C9A84C'}], rentalPrice: 96, deposit: 280, originalPrice: 699, description: '小生帔衣线条清朗，适合书生、公子类角色体验，轻便好穿。', images: ['./generated/costume-rental.png'], tags: ['小生','帔衣','清雅'], stock: {'M-葡萄紫':2,'L-葡萄紫':3,'XL-葡萄紫':2,'M-琥珀黄':1,'L-琥珀黄':2}, isAvailable: true },
    { id: 'h8', name: '水袖练功衣·月华白', dynasty: '水袖', category: '练功衣', gender: '通用', sizes: ['均码'], colors: [{name:'月华白',hex:'#F0F0F0'},{name:'烟灰蓝',hex:'#9090A0'}], rentalPrice: 72, deposit: 180, originalPrice: 399, description: '轻量水袖练功衣，袖长适中，便于初学者练习抛袖、收袖、翻袖等基础动作。', images: ['./generated/costume-rental.png','./generated/costume-rental.png'], tags: ['水袖','练功','中性'], stock: {'均码-月华白':3,'均码-烟灰蓝':2}, isNew: true, isAvailable: true },
  ]
  hanfuItems.forEach(h => db.hanfuItems.add(h))
})

export default db
