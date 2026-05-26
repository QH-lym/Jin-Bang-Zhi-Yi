// ---- Shared Types ----

/** 用户/账号 */
export interface Account {
  id: string
  username: string
  email?: string
  phone?: string
  role: 'user' | 'admin'
  avatar?: string
  createdAt: string
}

/** 订单状态 */
export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled'

/** 商城订单商品项 */
export interface OrderItem {
  productId: string
  name: string
  price: number
  quantity: number
}

/** 商城订单 */
export interface ShopOrder {
  id: string
  accountId: string
  items: OrderItem[]
  total: number
  recipient: string
  phone: string
  address: string
  status: OrderStatus
  createdAt: string
}

/** 购物车商品 */
export interface CartItem {
  id: string
  name: string
  price: number
  qty: number
}

/** API 响应基础结构 */
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

/** Auth 接口返回 */
export interface AuthResponse {
  token: string
  user: Account
}
