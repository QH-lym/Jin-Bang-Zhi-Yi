import type { HanfuItem, RentalOrder, RentalStatus } from '../../data/hanfuData'

export type HanfuCartItem = HanfuItem & {
  selectedSize: string
  selectedColor: string
  quantity: number
  rentStart: string
  rentEnd: string
  coverUrl?: string
}

export type ViewState = 'list' | 'detail' | 'cart' | 'checkout' | 'orders' | 'order-detail'

export type { HanfuItem, RentalOrder, RentalStatus }
