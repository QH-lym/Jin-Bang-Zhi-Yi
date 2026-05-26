export interface Point {
  x: number
  y: number
}

export interface Stroke {
  points: Point[]
  color: string
  size: number
  isEraser: boolean
}

export type TemplateId = 'blank' | 'jing' | 'chou' | 'guanyu' | 'baozheng' | 'caocao' | 'zhangfei' | 'wukong'

export type DrawMode = 'freehand' | 'bead' | 'complex'

export type ComplexTool = 'brush' | 'fill' | 'spray' | 'calligraphy' | 'marker' | 'watercolor'

export interface FaceColor {
  hex: string
  name: string
  meaning: string
}
