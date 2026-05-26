import type { FaceColor, TemplateId } from './types'

export const FACE_COLORS: FaceColor[] = [
  { hex: '#CC0000', name: '红色', meaning: '忠诚正直' },
  { hex: '#1A1A1A', name: '黑色', meaning: '刚直勇猛' },
  { hex: '#E8E8E8', name: '白色', meaning: '奸诈多疑' },
  { hex: '#0055AA', name: '蓝色', meaning: '刚强骁勇' },
  { hex: '#007755', name: '绿色', meaning: '侠肝义胆' },
  { hex: '#DDB800', name: '黄色', meaning: '勇猛凶暴' },
  { hex: '#660099', name: '紫色', meaning: '稳重刚正' },
  { hex: '#C8922A', name: '金色', meaning: '神仙鬼怪' },
  { hex: '#A0A0A0', name: '银色', meaning: '妖魔鬼怪' },
  { hex: '#E87777', name: '粉红', meaning: '年迈衰弱' },
]

export const BRUSH_MIN_SIZE = 2
export const BRUSH_MAX_SIZE = 40
export const BRUSH_DEFAULT_SIZE = 8
export const ERASER_DEFAULT_SIZE = 16
export const CANVAS_SIZE = 600

// Bead mode
export const BEAD_CELL = 15
export const BEAD_COLS = 36
export const BEAD_ROWS = 36
export const BEAD_R = 6.5
export const BEAD_OX = (CANVAS_SIZE - BEAD_COLS * BEAD_CELL) / 2
export const BEAD_OY = (CANVAS_SIZE - BEAD_ROWS * BEAD_CELL) / 2

// Complex mode
export const COMPLEX_SPRAY_RADIUS = 20
export const COMPLEX_FILL_TOLERANCE = 30
export const COMPLEX_OPACITY_DEFAULT = 1

// Color wheel
export const WHEEL_SIZE = 156

export const TEMPLATE_OPTIONS: { id: TemplateId; label: string }[] = [
  { id: 'blank', label: '空白' },
  { id: 'jing', label: '净角' },
  { id: 'chou', label: '丑角' },
  { id: 'guanyu', label: '关羽' },
  { id: 'baozheng', label: '包拯' },
  { id: 'caocao', label: '曹操' },
  { id: 'zhangfei', label: '张飞' },
  { id: 'wukong', label: '悟空' },
]

export const TEMPLATE_INFO: Record<string, { role: string; play: string; desc: string; tip: string }> = {
  jing: { role: '净角', play: '花脸', desc: '性格气质相貌上有特异之处的男性角色，使用各种颜色勾勒脸谱。', tip: '以底色为主，重点填充脸谱轮廓内的区域。' },
  chou: { role: '丑角', play: '小花脸', desc: '喜剧角色，鼻梁上抹白粉，语言幽默、动作滑稽。', tip: '白粉区域是标志，先用白色填鼻梁再做细节。' },
  guanyu: { role: '红脸关公', play: '《单刀会》《千里走单骑》', desc: '以忠义著称的武圣人。红色脸谱代表忠勇正直，卧蚕眉、丹凤眼是标志。', tip: '大面积正红为底，黑色勾眉眼，金色点缀装饰纹样。' },
  baozheng: { role: '黑脸包拯', play: '《铡美案》《探阴山》', desc: '铁面无私的一代名臣。黑色脸谱象征刚正不阿，额头月牙代表明察秋毫。', tip: '黑色铺面，月牙留白，可用灰白渐变渲染刚毅。' },
  caocao: { role: '白脸曹操', play: '《群英会》《战宛城》', desc: '一代枭雄，白脸象征多疑奸诈。面如傅粉，细目长髯。', tip: '白脸打底，用灰黑细线勾勒细长眉眼，体现阴鸷气质。' },
  zhangfei: { role: '黑脸张飞', play: '《长坂坡》《当阳桥》', desc: '勇猛粗犷的猛将。黑色脸谱配虎目，性格直爽暴烈。', tip: '黑色铺面，白色强调环眼，夸张的浓眉表现怒气。' },
  wukong: { role: '猴王悟空', play: '《大闹天宫》《三打白骨精》', desc: '齐天大圣，机灵顽皮。脸谱上金色猴脸配红色桃心，额有金箍。', tip: '红色桃心打底，金色勾眼眶，棕色画猴毛纹理。' },
}
