import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { requestAiChat } from '../../utils/aiClient'
import {
  Download,
  Eraser,
  Grid3X3,
  Minus,
  Paintbrush,
  Palette,
  Plus,
  RotateCcw,
  ShoppingBag,
  Undo2,
} from 'lucide-react'

import type { Stroke, TemplateId, DrawMode, ComplexTool } from './types'
import {
  FACE_COLORS,
  BRUSH_MIN_SIZE,
  BRUSH_MAX_SIZE,
  BRUSH_DEFAULT_SIZE,
  ERASER_DEFAULT_SIZE,
  CANVAS_SIZE,
  BEAD_CELL,
  BEAD_COLS,
  BEAD_ROWS,
  BEAD_OX,
  BEAD_OY,
  COMPLEX_SPRAY_RADIUS,
  COMPLEX_FILL_TOLERANCE,
  COMPLEX_OPACITY_DEFAULT,
  TEMPLATE_OPTIONS,
  TEMPLATE_INFO,
  WHEEL_SIZE,
} from './constants'
import {
  drawStroke,
  drawFaceTemplate,
  drawBeadGrid,
  drawCalligraphyStroke,
  drawMarkerStroke,
  drawWatercolorStroke,
  floodFill,
  drawSpray,
  hsvToHex,
  hexToHsv,
} from './drawing-utils'

/* ---- ToolButton ---- */

function ToolButton({
  icon,
  label,
  active,
  disabled,
  onClick,
}: {
  icon: ReactNode
  label: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all ${
        active
          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
          : disabled
            ? 'text-white/20 cursor-not-allowed'
            : 'text-white/60 hover:text-white/80 hover:bg-white/5 border border-transparent'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

/* ---- FaceWorkshop Main ---- */

export default function FaceWorkshop({
  initialTemplate,
  onViewShop,
}: {
  initialTemplate?: string
  onViewShop?: (query: string) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Mode
  const [mode, setMode] = useState<DrawMode>('freehand')

  // Freehand state
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [brushSize, setBrushSize] = useState(BRUSH_DEFAULT_SIZE)
  const [isEraser, setIsEraser] = useState(false)
  const [strokeCount, setStrokeCount] = useState(0)

  // Bead state
  const [beadGrid, setBeadGrid] = useState<Record<string, string>>({})
  const [beadHistory, setBeadHistory] = useState<Record<string, string>[]>([])

  // Shared
  const [selectedColor, setSelectedColor] = useState('#CC0000')
  const [customColors, setCustomColors] = useState<string[]>([])
  const [symmetric, setSymmetric] = useState(false)
  const [template, setTemplate] = useState<TemplateId>('blank')

  // Color picker ref
  const colorInputRef = useRef<HTMLInputElement>(null)

  // Complex mode
  const [complexTool, setComplexTool] = useState<ComplexTool>('brush')
  const [opacity, setOpacity] = useState(COMPLEX_OPACITY_DEFAULT)
  const [symmetry4, setSymmetry4] = useState(false)
  const complexToolRef = useRef(complexTool)
  complexToolRef.current = complexTool
  const opacityRef = useRef(opacity)
  opacityRef.current = opacity
  const symmetry4Ref = useRef(symmetry4)
  symmetry4Ref.current = symmetry4

  // AI state
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<{ area: string; color: string; note: string }[]>([])
  const [aiError, setAiError] = useState('')

  // Color wheel
  const wheelRef = useRef<HTMLCanvasElement>(null)
  const wheelIndicatorRef = useRef<HTMLCanvasElement>(null)
  const [wheelHsv, setWheelHsv] = useState(() => hexToHsv('#CC0000'))
  const [brightness, setBrightness] = useState(1)

  // Refs for canvas drawing
  const modeRef = useRef(mode)
  modeRef.current = mode
  const strokesRef = useRef(strokes)
  strokesRef.current = strokes
  const beadGridRef = useRef(beadGrid)
  beadGridRef.current = beadGrid
  const isDrawingRef = useRef(false)
  const currentStrokeRef = useRef<Stroke | null>(null)
  const symmetricRef = useRef(symmetric)
  symmetricRef.current = symmetric
  const brushSizeRef = useRef(brushSize)
  brushSizeRef.current = brushSize
  const isEraserRef = useRef(isEraser)
  isEraserRef.current = isEraser
  const selectedColorRef = useRef(selectedColor)
  selectedColorRef.current = selectedColor
  const templateRef = useRef(template)
  templateRef.current = template

  // Offscreen buffer canvas — caches background (template + completed strokes)
  const bufferRef = useRef<HTMLCanvasElement | null>(null)
  const updateBuffer = useCallback(() => {
    let buf = bufferRef.current
    if (!buf) {
      buf = document.createElement('canvas')
      buf.width = CANVAS_SIZE
      buf.height = CANVAS_SIZE
      bufferRef.current = buf
    }
    const bctx = buf.getContext('2d')!
    bctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
    drawFaceTemplate(bctx, CANVAS_SIZE, CANVAS_SIZE, templateRef.current)
    for (const s of strokesRef.current) {
      drawStroke(bctx, s.points, s.color, s.size, s.isEraser)
    }
  }, [])

  /* ---- Color wheel render & events ---- */

  useEffect(() => {
    const canvas = wheelRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const w = canvas.width, cx = w / 2, cy = w / 2, r = w / 2 - 2
    const img = ctx.createImageData(w, w)
    for (let y = 0; y < w; y++) {
      for (let x = 0; x < w; x++) {
        const dx = x - cx, dy = y - cy
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist <= r) {
          const hue = (Math.atan2(dy, dx) + Math.PI) / (Math.PI * 2)
          const sat = Math.min(dist / r, 1)
          const hex = hsvToHex(hue, sat, 1)
          const ri = parseInt(hex.slice(1,3), 16), gi = parseInt(hex.slice(3,5), 16), bi = parseInt(hex.slice(5,7), 16)
          const px = (y * w + x) * 4
          img.data[px] = ri; img.data[px+1] = gi; img.data[px+2] = bi; img.data[px+3] = 255
        }
      }
    }
    ctx.putImageData(img, 0, 0)
  }, [])

  // Draw wheel indicator
  useEffect(() => {
    const canvas = wheelIndicatorRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const w = canvas.width, cx = w / 2, cy = w / 2, r = w / 2 - 2
    ctx.clearRect(0, 0, w, w)
    const angle = wheelHsv.h * Math.PI * 2 - Math.PI
    const dist = wheelHsv.s * r
    const ix = cx + Math.cos(angle) * dist
    const iy = cy + Math.sin(angle) * dist
    // Outer ring
    ctx.beginPath()
    ctx.arc(ix, iy, 6, 0, Math.PI * 2)
    ctx.fillStyle = 'white'
    ctx.fill()
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'
    ctx.lineWidth = 2
    ctx.stroke()
    // Inner dot
    ctx.beginPath()
    ctx.arc(ix, iy, 2.5, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    ctx.fill()
  }, [wheelHsv])

  const getWheelHsv = useCallback((e: PointerEvent<HTMLCanvasElement>) => {
    const canvas = wheelRef.current!
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) * (canvas.width / rect.width)
    const y = (e.clientY - rect.top) * (canvas.height / rect.height)
    const w = canvas.width, cx = w / 2, cy = w / 2, r = w / 2 - 2
    const dx = x - cx, dy = y - cy
    const dist = Math.min(Math.sqrt(dx * dx + dy * dy), r)
    const hue = (Math.atan2(dy, dx) + Math.PI) / (Math.PI * 2)
    const sat = dist / r
    return { h: hue, s: sat, v: brightness }
  }, [brightness])

  const onWheelPointer = useCallback((e: PointerEvent<HTMLCanvasElement>) => {
    const canvas = wheelRef.current
    if (!canvas) return
    canvas.setPointerCapture(e.pointerId)
    const hsv = getWheelHsv(e)
    const dist = Math.sqrt(Math.pow(e.clientX - canvas.getBoundingClientRect().left - canvas.width/2 * (canvas.width/canvas.getBoundingClientRect().width), 2) + Math.pow(e.clientY - canvas.getBoundingClientRect().top - canvas.height/2 * (canvas.height/canvas.getBoundingClientRect().height), 2))
    const scaledR = (canvas.width/2 - 2) * (canvas.width/canvas.getBoundingClientRect().width)
    if (dist <= scaledR + 10) {
      setWheelHsv(hsv)
      const hex = hsvToHex(hsv.h, hsv.s, hsv.v)
      setSelectedColor(hex)
      setCustomColors((prev) => {
        const filtered = prev.filter((c) => c !== hex)
        return [hex, ...filtered].slice(0, 8)
      })
      if (colorInputRef.current) colorInputRef.current.value = hex
      if (mode === 'freehand') setIsEraser(false)
    }
  }, [getWheelHsv, mode])

  /* ---- Redraw ---- */

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const w = canvas.width
    const h = canvas.height
    ctx.clearRect(0, 0, w, h)

    if (modeRef.current === 'bead') {
      drawFaceTemplate(ctx, w, h, templateRef.current)
      drawBeadGrid(ctx, beadGridRef.current, w, h)
    } else {
      drawFaceTemplate(ctx, w, h, templateRef.current)
      for (const s of strokesRef.current) {
        drawStroke(ctx, s.points, s.color, s.size, s.isEraser)
      }
    }
  }, [])

  useEffect(() => {
    updateBuffer()
    redraw()
  }, [template, mode, redraw, updateBuffer])

  // React to external navigation — select template when navigated from map
  useEffect(() => {
    if (initialTemplate && initialTemplate !== templateRef.current) {
      strokesRef.current = []
      setStrokes([])
      setStrokeCount(0)
      beadGridRef.current = {}
      setBeadGrid({})
      setBeadHistory([])
      setTemplate(initialTemplate as TemplateId)
    }
  }, [initialTemplate])

  /* ---- Bead click handler ---- */

  const getCell = (e: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!
    const r = canvas.getBoundingClientRect()
    const x = (e.clientX - r.left) * (canvas.width / r.width)
    const y = (e.clientY - r.top) * (canvas.height / r.height)
    const col = Math.floor((x - BEAD_OX) / BEAD_CELL)
    const row = Math.floor((y - BEAD_OY) / BEAD_CELL)
    if (col < 0 || col >= BEAD_COLS || row < 0 || row >= BEAD_ROWS) return null
    return { row, col, key: `${row},${col}` }
  }

  const handleBeadPointerDown = useCallback((e: PointerEvent<HTMLCanvasElement>) => {
    const cell = getCell(e)
    if (!cell) return
    const canvas = canvasRef.current!
    canvas.setPointerCapture(e.pointerId)
    const color = selectedColorRef.current
    setBeadGrid((prev) => {
      const next = { ...prev }
      if (next[cell.key]) {
        delete next[cell.key]
      } else {
        next[cell.key] = color
      }
      beadGridRef.current = next
      return next
    })
    redraw()
  }, [redraw])

  const handleBeadPointerMove = useCallback((e: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (e.buttons !== 1) return
    const cell = getCell(e)
    if (!cell) return
    const color = selectedColorRef.current
    setBeadGrid((prev) => {
      const next = { ...prev }
      next[cell.key] = color
      beadGridRef.current = next
      return next
    })
    redraw()
  }, [redraw])

  /* ---- Freehand pointer handlers ---- */

  const getPoint = (e: PointerEvent<HTMLCanvasElement>): { x: number; y: number } => {
    const canvas = canvasRef.current!
    const r = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - r.left) * (canvas.width / r.width),
      y: (e.clientY - r.top) * (canvas.height / r.height),
    }
  }

  const handlePointerDown = useCallback((e: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.setPointerCapture(e.pointerId)
    const pt = getPoint(e)
    const color = isEraserRef.current ? '#000000' : selectedColorRef.current
    const size = isEraserRef.current ? ERASER_DEFAULT_SIZE : brushSizeRef.current
    const stroke: Stroke = { points: [pt], color, size, isEraser: isEraserRef.current }
    currentStrokeRef.current = stroke
    isDrawingRef.current = true
  }, [])

  const handlePointerMove = useCallback((e: PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !currentStrokeRef.current) return
    const pt = getPoint(e)
    const cs = currentStrokeRef.current
    cs.points = [...cs.points, pt]
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const w = canvas.width
    const h = canvas.height
    const buf = bufferRef.current
    if (buf) {
      ctx.clearRect(0, 0, w, h)
      ctx.drawImage(buf, 0, 0)
    } else {
      ctx.clearRect(0, 0, w, h)
      drawFaceTemplate(ctx, w, h, templateRef.current)
      for (const s of strokesRef.current) {
        drawStroke(ctx, s.points, s.color, s.size, s.isEraser)
      }
    }
    const ct = complexToolRef.current
    if (ct === 'calligraphy') {
      drawCalligraphyStroke(ctx, cs.points, cs.color, cs.size, opacityRef.current)
    } else if (ct === 'marker') {
      drawMarkerStroke(ctx, cs.points, cs.color, cs.size, opacityRef.current)
    } else if (ct === 'watercolor') {
      drawWatercolorStroke(ctx, cs.points, cs.color, cs.size, opacityRef.current)
    } else {
      drawStroke(ctx, cs.points, cs.color, cs.size, cs.isEraser)
    }
    if (symmetricRef.current) {
      const cx = w / 2
      const reflected = cs.points.map((p) => ({ x: cx + (cx - p.x), y: p.y }))
      if (ct === 'calligraphy') {
        drawCalligraphyStroke(ctx, reflected, cs.color, cs.size, opacityRef.current)
      } else if (ct === 'marker') {
        drawMarkerStroke(ctx, reflected, cs.color, cs.size, opacityRef.current)
      } else if (ct === 'watercolor') {
        drawWatercolorStroke(ctx, reflected, cs.color, cs.size, opacityRef.current)
      } else {
        drawStroke(ctx, reflected, cs.color, cs.size, cs.isEraser)
      }
    }
  }, [])

  const handlePointerUp = useCallback(() => {
    if (!isDrawingRef.current || !currentStrokeRef.current) return
    isDrawingRef.current = false
    const final = { ...currentStrokeRef.current, points: [...currentStrokeRef.current.points] }
    currentStrokeRef.current = null
    let newStrokes: Stroke[]
    if (symmetricRef.current) {
      const cx = canvasRef.current!.width / 2
      const reflectedPoints = final.points.map((p) => ({ x: cx + (cx - p.x), y: p.y }))
      const reflected: Stroke = { points: reflectedPoints, color: final.color, size: final.size, isEraser: final.isEraser }
      newStrokes = [...strokesRef.current, final, reflected]
    } else {
      newStrokes = [...strokesRef.current, final]
    }
    strokesRef.current = newStrokes
    setStrokes(newStrokes)
    setStrokeCount((c) => c + 1)
    updateBuffer()
    redraw()
  }, [redraw, updateBuffer])

  /* ---- Complex mode fill ---- */

  const handleFillDown = useCallback((e: PointerEvent<HTMLCanvasElement>) => {
    const pt = getPoint(e)
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    floodFill(ctx, pt.x, pt.y, selectedColorRef.current, COMPLEX_FILL_TOLERANCE)
  }, [])

  /* ---- Complex mode spray ---- */

  const sprayPointsRef = useRef<{ x: number; y: number }[]>([])

  const handleSprayDown = useCallback((e: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.setPointerCapture(e.pointerId)
    const pt = getPoint(e)
    sprayPointsRef.current = [pt]
    isDrawingRef.current = true
    const ctx = canvas.getContext('2d')!
    drawSpray(ctx, pt.x, pt.y, selectedColorRef.current, COMPLEX_SPRAY_RADIUS, opacityRef.current)
    if (symmetricRef.current) {
      drawSpray(ctx, canvas.width - pt.x, pt.y, selectedColorRef.current, COMPLEX_SPRAY_RADIUS, opacityRef.current)
    }
    if (symmetry4Ref.current) {
      drawSpray(ctx, pt.x, canvas.height - pt.y, selectedColorRef.current, COMPLEX_SPRAY_RADIUS, opacityRef.current)
      drawSpray(ctx, canvas.width - pt.x, canvas.height - pt.y, selectedColorRef.current, COMPLEX_SPRAY_RADIUS, opacityRef.current)
    }
  }, [])

  const handleSprayMove = useCallback((e: PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return
    const pt = getPoint(e)
    const last = sprayPointsRef.current[sprayPointsRef.current.length - 1]
    const steps = Math.max(1, Math.round(Math.sqrt((pt.x - last.x) ** 2 + (pt.y - last.y) ** 2) / 3))
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const ix = last.x + (pt.x - last.x) * t
      const iy = last.y + (pt.y - last.y) * t
      drawSpray(ctx, ix, iy, selectedColorRef.current, COMPLEX_SPRAY_RADIUS, opacityRef.current)
      if (symmetricRef.current) {
        drawSpray(ctx, canvas.width - ix, iy, selectedColorRef.current, COMPLEX_SPRAY_RADIUS, opacityRef.current)
      }
      if (symmetry4Ref.current) {
        drawSpray(ctx, ix, canvas.height - iy, selectedColorRef.current, COMPLEX_SPRAY_RADIUS, opacityRef.current)
        drawSpray(ctx, canvas.width - ix, canvas.height - iy, selectedColorRef.current, COMPLEX_SPRAY_RADIUS, opacityRef.current)
      }
    }
    sprayPointsRef.current.push(pt)
  }, [])

  const handleSprayUp = useCallback(() => {
    isDrawingRef.current = false
    sprayPointsRef.current = []
  }, [])

  /* ---- Canvas event dispatch ---- */

  const onCanvasPointerDown = mode === 'bead' ? handleBeadPointerDown
    : mode === 'complex' && complexTool === 'fill' ? handleFillDown
    : mode === 'complex' && complexTool === 'spray' ? handleSprayDown
    : handlePointerDown
  const onCanvasPointerMove = mode === 'bead' ? handleBeadPointerMove
    : mode === 'complex' && complexTool === 'spray' ? handleSprayMove
    : handlePointerMove
  const onCanvasPointerUp = mode === 'bead' ? undefined
    : mode === 'complex' && complexTool === 'spray' ? handleSprayUp
    : handlePointerUp

  /* ---- Actions ---- */

  const undo = useCallback(() => {
    if (mode === 'bead') {
      if (beadHistory.length === 0) {
        setBeadGrid((prev) => {
          const keys = Object.keys(prev)
          if (keys.length === 0) return prev
          const lastKey = keys[keys.length - 1]
          const next = { ...prev }
          delete next[lastKey]
          beadGridRef.current = next
          return next
        })
        redraw()
      }
    } else {
      if (strokesRef.current.length === 0) return
      const count = symmetricRef.current ? 2 : 1
      const newStrokes = strokesRef.current.slice(0, -count)
      strokesRef.current = newStrokes
      setStrokes(newStrokes)
      setStrokeCount((c) => Math.max(0, c - 1))
      updateBuffer()
      redraw()
    }
  }, [beadHistory.length, mode, redraw, updateBuffer])

  const clearCanvas = useCallback(() => {
    if (mode === 'bead') {
      beadGridRef.current = {}
      setBeadGrid({})
      setBeadHistory([])
    } else {
      strokesRef.current = []
      setStrokes([])
      setStrokeCount(0)
    }
    updateBuffer()
    redraw()
  }, [mode, redraw, updateBuffer])

  const switchMode = useCallback((m: DrawMode) => {
    if (m === modeRef.current) return
    setMode(m)
    strokesRef.current = []
    setStrokes([])
    setStrokeCount(0)
    beadGridRef.current = {}
    setBeadGrid({})
    setBeadHistory([])
  }, [])

  const changeTemplate = useCallback((t: TemplateId) => {
    if (t === templateRef.current) return
    strokesRef.current = []
    setStrokes([])
    setStrokeCount(0)
    beadGridRef.current = {}
    setBeadGrid({})
    setBeadHistory([])
    setTemplate(t)
  }, [])

  const exportPng = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `faceworkshop-${templateRef.current}-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }, [])

  /* ---- AI ---- */

  const handleAiGenerate = useCallback(async () => {
    const prompt = aiPrompt.trim()
    if (!prompt) return
    setAiLoading(true)
    setAiError('')
    try {
      const templateName = templateRef.current === 'jing' ? '净角' :
        templateRef.current === 'chou' ? '丑角' :
        templateRef.current === 'guanyu' ? '关羽' :
        templateRef.current === 'baozheng' ? '包拯' :
        templateRef.current === 'caocao' ? '曹操' :
        templateRef.current === 'zhangfei' ? '张飞' :
        templateRef.current === 'wukong' ? '悟空' : '空白'
      const systemPrompt = `你是一个中国戏曲脸谱配色专家。用户描述想要的风格，你返回JSON数组建议。每个建议包含：area(面部区域名), color(十六进制色码), note(为什么用这个颜色，一句话)。最多5条。格式：[{"area":"额头","color":"#CC0000","note":"正红色象征忠勇"}]`
      const text = await requestAiChat({
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `当前底版：${templateName}。用户需求：${prompt}` },
          ],
        temperature: 0.8,
        maxTokens: 800,
      })

      if (!text) {
        setAiError('请先配置 AI 代理服务')
        setAiLoading(false)
        return
      }

      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        setAiSuggestions(parsed.slice(0, 5))
      } else {
        setAiError('AI 返回格式异常')
      }
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : '请求失败')
    }
    setAiLoading(false)
  }, [aiPrompt])

  const handleAiPaintFace = useCallback(() => {
    const text = aiPrompt.trim()
    const hasAny = (words: string[]) => words.some(word => text.includes(word))
    const picked: TemplateId =
      hasAny(['关羽', '关公', '忠', '红', '义']) ? 'guanyu' :
      hasAny(['包拯', '包公', '黑', '刚正', '公正']) ? 'baozheng' :
      hasAny(['曹操', '白', '奸', '疑']) ? 'caocao' :
      hasAny(['张飞', '猛', '怒', '勇']) ? 'zhangfei' :
      hasAny(['悟空', '猴', '灵', '金']) ? 'wukong' :
      hasAny(['丑', '喜', '滑稽']) ? 'chou' :
      templateRef.current === 'blank' ? 'jing' : templateRef.current

    const style =
      hasAny(['华丽', '金', '富贵', '宫廷']) ? 'gold' :
      hasAny(['战', '武', '烈', '霸']) ? 'battle' :
      hasAny(['水', '柔', '雅', '青衣']) ? 'soft' :
      hasAny(['神', '妖', '幻', '灵']) ? 'myth' :
      'classic'

    setMode('complex')
    setTemplate(picked)
    templateRef.current = picked
    strokesRef.current = []
    setStrokes([])
    setStrokeCount(0)
    setAiError('')

    const canvas = canvasRef.current
    if (!canvas) return
    updateBuffer()
    const targets = [canvas, bufferRef.current].filter(Boolean) as HTMLCanvasElement[]
    const palettes: Record<string, string[]> = {
      guanyu: ['#CC0000', '#1A1A1A', '#C8922A', '#F5E6C8'],
      baozheng: ['#101010', '#E8E8E8', '#C8922A', '#8B1E1E'],
      caocao: ['#F1EEE8', '#1A1A1A', '#E87777', '#6B7280'],
      zhangfei: ['#111111', '#E8E8E8', '#CC0000', '#DDB800'],
      wukong: ['#CC0000', '#C8922A', '#1A1A1A', '#E87777'],
      chou: ['#F8F1E4', '#CC0000', '#1A1A1A', '#DDB800'],
      jing: ['#CC0000', '#0055AA', '#1A1A1A', '#DDB800'],
      blank: ['#CC0000', '#1A1A1A', '#DDB800', '#F8F1E4'],
    }
    const palette = palettes[picked] || palettes.jing

    const drawSymmetric = (ctx: CanvasRenderingContext2D, draw: () => void) => {
      draw()
      ctx.save()
      ctx.translate(CANVAS_SIZE, 0)
      ctx.scale(-1, 1)
      draw()
      ctx.restore()
    }

    targets.forEach(target => {
      const ctx = target.getContext('2d')
      if (!ctx) return
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
      drawFaceTemplate(ctx, CANVAS_SIZE, CANVAS_SIZE, picked)
      ctx.save()
      ctx.globalAlpha = 0.88
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.lineWidth = style === 'soft' ? 14 : 20
      ctx.strokeStyle = palette[0]
      ctx.beginPath()
      ctx.moveTo(300, 118)
      ctx.bezierCurveTo(245, 160, 238, 252, 300, 322)
      ctx.bezierCurveTo(362, 252, 355, 160, 300, 118)
      ctx.stroke()

      drawSymmetric(ctx, () => {
        ctx.strokeStyle = palette[1]
        ctx.lineWidth = style === 'battle' ? 16 : 11
        ctx.beginPath()
        ctx.moveTo(202, 222)
        ctx.bezierCurveTo(232, 204, 267, 214, 292, 250)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(194, 300)
        ctx.bezierCurveTo(230, 282, 266, 290, 300, 326)
        ctx.stroke()
      })

      ctx.strokeStyle = palette[2]
      ctx.lineWidth = style === 'gold' ? 10 : 7
      ctx.beginPath()
      if (style === 'myth' || picked === 'wukong') {
        ctx.arc(300, 106, 42, Math.PI * 0.12, Math.PI * 0.88)
        ctx.moveTo(258, 138)
        ctx.bezierCurveTo(280, 160, 320, 160, 342, 138)
      } else if (style === 'battle' || picked === 'zhangfei') {
        ctx.moveTo(246, 112)
        ctx.lineTo(300, 72)
        ctx.lineTo(354, 112)
        ctx.moveTo(266, 140)
        ctx.lineTo(334, 140)
      } else {
        ctx.moveTo(300, 76)
        ctx.lineTo(330, 140)
        ctx.lineTo(300, 124)
        ctx.lineTo(270, 140)
        ctx.closePath()
      }
      ctx.stroke()

      drawSymmetric(ctx, () => {
        ctx.strokeStyle = palette[3]
        ctx.lineWidth = 6
        ctx.beginPath()
        ctx.moveTo(214, 360)
        ctx.bezierCurveTo(240, 382, 272, 384, 300, 360)
        ctx.stroke()
      })
      ctx.restore()
    })
  }, [aiPrompt, updateBuffer])

  /* ---- Render ---- */

  const currentColor = FACE_COLORS.find((c) => c.hex === selectedColor)
  const beadCount = useMemo(() => Object.keys(beadGrid).length, [beadGrid])

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 flex-wrap"
      >
        {/* Mode switch */}
        <div className="flex items-center gap-0.5 mr-1 glass-panel rounded-xl p-0.5">
          <button
            type="button"
            onClick={() => switchMode('freehand')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1.5 ${
              mode === 'freehand'
                ? 'bg-amber-500/20 text-amber-300'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            <Paintbrush className="w-4 h-4" />
            <span className="hidden sm:inline">手绘</span>
          </button>
          <button
            type="button"
            onClick={() => switchMode('bead')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1.5 ${
              mode === 'bead'
                ? 'bg-amber-500/20 text-amber-300'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            <Grid3X3 className="w-4 h-4" />
            <span className="hidden sm:inline">拼豆</span>
          </button>
          <button
            type="button"
            onClick={() => switchMode('complex')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1.5 ${
              mode === 'complex'
                ? 'bg-amber-500/20 text-amber-300'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            <span className="text-base">⚙</span>
            <span className="hidden sm:inline">复杂</span>
          </button>
        </div>

        <ToolButton
          icon={<Undo2 className="w-4 h-4" />}
          label="撤销"
          disabled={mode === 'freehand' ? strokes.length === 0 : beadCount === 0}
          onClick={undo}
        />
        <ToolButton
          icon={<RotateCcw className="w-4 h-4" />}
          label="清空"
          disabled={mode === 'freehand' ? strokes.length === 0 : beadCount === 0}
          onClick={clearCanvas}
        />

        {mode === 'complex' && (
          <>
            <div className="flex items-center gap-0.5 mr-0.5 glass-panel rounded-xl p-0.5">
              {(['brush', 'calligraphy', 'marker', 'watercolor'] as ComplexTool[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setComplexTool(t)}
                  className={`px-2 py-1.5 rounded-lg text-xs transition-all ${
                    complexTool === t
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'text-white/40 hover:text-white/60'
                  }`}
                  title={t === 'brush' ? '圆笔' : t === 'calligraphy' ? '书法' : t === 'marker' ? '马克' : '水彩'}
                >
                  {t === 'brush' ? '⚫' : t === 'calligraphy' ? '✒' : t === 'marker' ? '▬' : '💧'}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-0.5 mr-0.5 glass-panel rounded-xl p-0.5">
              {(['fill', 'spray'] as ComplexTool[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setComplexTool(t)}
                  className={`px-2 py-1.5 rounded-lg text-xs transition-all ${
                    complexTool === t
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'text-white/40 hover:text-white/60'
                  }`}
                  title={t === 'fill' ? '填充' : '喷枪'}
                >
                  {t === 'fill' ? '▣' : '◌'}
                </button>
              ))}
            </div>
            {/* Opacity Slider */}
            <div className="flex items-center gap-1.5 px-2">
              <label className="text-[10px] text-white/30">不透明</label>
              <input
                type="range"
                min={0.05}
                max={1}
                step={0.05}
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-16 h-1 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, rgba(255,255,255,0.1), ${selectedColor})`,
                  accentColor: selectedColor,
                }}
              />
            </div>
            {/* Symmetry toggles */}
            <ToolButton
              icon={<span className={`text-base ${symmetric ? '' : 'opacity-40'}`}>⚋</span>}
              label="↔对称"
              active={symmetric}
              onClick={() => setSymmetric((s) => !s)}
            />
            <ToolButton
              icon={<span className={`text-base ${symmetry4 ? '' : 'opacity-40'}`}>⊞</span>}
              label="四向"
              active={symmetry4}
              onClick={() => setSymmetry4((s) => !s)}
            />
          </>
        )}

        {mode === 'freehand' && (
          <>
            <ToolButton
              icon={<span className={`text-base ${symmetric ? '' : 'opacity-40'}`}>⚋</span>}
              label="对称"
              active={symmetric}
              onClick={() => setSymmetric((s) => !s)}
            />
            <ToolButton
              icon={<Minus className="w-4 h-4" />}
              label="减小"
              disabled={brushSize <= BRUSH_MIN_SIZE}
              onClick={() => setBrushSize((s) => Math.max(BRUSH_MIN_SIZE, s - 2))}
            />
            <ToolButton
              icon={<Plus className="w-4 h-4" />}
              label="增大"
              disabled={brushSize >= BRUSH_MAX_SIZE}
              onClick={() => setBrushSize((s) => Math.min(BRUSH_MAX_SIZE, s + 2))}
            />
            <ToolButton
              icon={isEraser ? <Paintbrush className="w-4 h-4" /> : <Eraser className="w-4 h-4" />}
              label={isEraser ? '画笔' : '橡皮'}
              active={isEraser}
              onClick={() => setIsEraser((e) => !e)}
            />
          </>
        )}

        <ToolButton
          icon={<Download className="w-4 h-4" />}
          label="导出"
          onClick={exportPng}
        />
        {onViewShop && template !== 'blank' && (
          <ToolButton
            icon={<ShoppingBag className="w-4 h-4" />}
            label="文创"
            onClick={() => onViewShop(
              template === 'jing' ? '脸谱' :
              template === 'chou' ? '丑角' :
              template === 'guanyu' ? '关羽' :
              template === 'baozheng' ? '包拯' :
              template === 'caocao' ? '曹操' :
              template === 'zhangfei' ? '张飞' : '悟空'
            )}
          />
        )}
      </motion.div>

      {/* Canvas + Controls Row */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Canvas */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel rounded-xl p-3 flex-shrink-0"
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            onPointerDown={onCanvasPointerDown}
            onPointerMove={onCanvasPointerMove}
            onPointerUp={onCanvasPointerUp}
            className={`w-full max-w-[600px] rounded-lg ${
              mode === 'bead' ? 'cursor-pointer' : 'cursor-crosshair'
            }`}
            style={{ touchAction: 'none', background: 'rgba(255,255,255,0.05)' }}
          />
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {TEMPLATE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => changeTemplate(opt.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  template === opt.id
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-white/40 hover:text-white/60 border border-transparent'
                }`}
              >
                {opt.label}
              </button>
            ))}
            <button
              type="button"
              onClick={handleAiPaintFace}
              className="ml-auto rounded-lg bg-amber-500/20 px-3 py-1 text-xs font-medium text-amber-200 transition-all hover:bg-amber-500/30"
            >
              AI生成脸谱
            </button>
          </div>

          {/* Role info card */}
          {template !== 'blank' && TEMPLATE_INFO[template] && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-2 p-2.5 rounded-lg bg-white/[0.03] border border-white/5"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-amber-400/80 font-medium">
                  {TEMPLATE_INFO[template].role}
                </span>
                <span className="text-[10px] text-white/30">
                  {TEMPLATE_INFO[template].play}
                </span>
              </div>
              <p className="text-[11px] text-white/50 leading-relaxed mb-1.5">
                {TEMPLATE_INFO[template].desc}
              </p>
              <p className="text-[10px] text-amber-300/50 leading-relaxed">
                💡 {TEMPLATE_INFO[template].tip}
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Side Panel */}
        <div className="flex flex-col gap-3 min-w-[180px]">
          {/* Color Palette */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-panel rounded-xl p-3"
          >
            <h3 className="text-xs text-white/40 font-medium mb-2 tracking-wide">
              {mode === 'bead' ? '豆色' : '色板'}
            </h3>
            <div className="grid grid-cols-5 gap-1.5">
              {FACE_COLORS.map((c) => (
                <motion.button
                  key={c.hex}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setSelectedColor(c.hex)
                    setWheelHsv(hexToHsv(c.hex))
                    if (mode === 'freehand') setIsEraser(false)
                  }}
                  title={`${c.name} — ${c.meaning}`}
                  className={`w-7 h-7 rounded-lg transition-all border-2 ${
                    selectedColor === c.hex
                      ? 'border-white/80 scale-110 shadow-lg'
                      : 'border-transparent hover:border-white/30'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
              {/* Custom color picker trigger */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => colorInputRef.current?.click()}
                title="自定义颜色"
                className="w-7 h-7 rounded-lg border-2 border-dashed border-white/20 hover:border-white/50 transition-all flex items-center justify-center"
              >
                <Palette className="w-3.5 h-3.5 text-white/40" />
              </motion.button>
              <input
                ref={colorInputRef}
                type="color"
                className="sr-only"
                value={selectedColor}
                onChange={(e) => {
                  const hex = e.target.value
                  setSelectedColor(hex)
                  setWheelHsv(hexToHsv(hex))
                  setCustomColors((prev) => {
                    const filtered = prev.filter((c) => c !== hex)
                    return [hex, ...filtered].slice(0, 8)
                  })
                  if (mode === 'freehand') setIsEraser(false)
                }}
              />
              {/* Recent custom colors */}
              {customColors.map((hex) => (
                <motion.button
                  key={hex}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setSelectedColor(hex)
                    setWheelHsv(hexToHsv(hex))
                    if (mode === 'freehand') setIsEraser(false)
                  }}
                  title={hex}
                  className={`w-7 h-7 rounded-lg transition-all border-2 ${
                    selectedColor === hex
                      ? 'border-white/80 scale-110 shadow-lg'
                      : 'border-transparent hover:border-white/30'
                  }`}
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
            {currentColor ? (
              <p className="text-xs text-white/50 mt-2">
                <span className="text-white/80">{currentColor.name}</span>
                {' · '}
                {currentColor.meaning}
              </p>
            ) : (
              <p className="text-xs text-white/50 mt-2">
                自定义 · {selectedColor}
              </p>
            )}
          </motion.div>

          {/* Color Wheel */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-panel rounded-xl p-3"
          >
            <h3 className="text-xs text-white/40 font-medium mb-2 tracking-wide">色环</h3>
            <div className="relative mx-auto" style={{ width: WHEEL_SIZE, height: WHEEL_SIZE }}>
              <canvas
                ref={wheelRef}
                width={WHEEL_SIZE}
                height={WHEEL_SIZE}
                className="absolute inset-0 rounded-full"
              />
              <canvas
                ref={wheelIndicatorRef}
                width={WHEEL_SIZE}
                height={WHEEL_SIZE}
                onPointerDown={onWheelPointer}
                onPointerMove={(e) => {
                  if (e.buttons === 1) onWheelPointer(e)
                }}
                className="absolute inset-0 rounded-full cursor-crosshair"
                style={{ touchAction: 'none' }}
              />
            </div>
            {/* Brightness slider */}
            <input
              type="range"
              min={0.05}
              max={1}
              step={0.01}
              value={brightness}
              onChange={(e) => {
                const v = parseFloat(e.target.value)
                setBrightness(v)
                const newHsv = { ...wheelHsv, v }
                setWheelHsv(newHsv)
                setSelectedColor(hsvToHex(newHsv.h, newHsv.s, v))
                if (mode === 'freehand') setIsEraser(false)
              }}
              className="w-full mt-2 h-1.5 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #000, ${hsvToHex(wheelHsv.h, wheelHsv.s, 1)})`,
                accentColor: selectedColor,
              }}
            />
          </motion.div>

          {/* AI Color Suggestions - Complex Mode Only */}
          {mode === 'complex' && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-panel rounded-xl p-3"
            >
              <h3 className="text-xs text-white/40 font-medium mb-2 tracking-wide">AI 配色</h3>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="描述想要的风格..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white/70 placeholder-white/20 outline-none focus:border-amber-500/40 transition-colors"
                  onKeyDown={(e) => { if (e.key === 'Enter' && !aiLoading) handleAiGenerate() }}
                />
                <button
                  type="button"
                  onClick={handleAiGenerate}
                  disabled={aiLoading || !aiPrompt.trim()}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    aiLoading
                      ? 'bg-amber-500/10 text-amber-500/50 cursor-wait'
                      : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                  }`}
                >
                  {aiLoading ? '...' : '生成'}
                </button>
              </div>
              {aiError && (
                <p className="text-[10px] text-red-400/70 mt-1.5">{aiError}</p>
              )}
              {aiSuggestions.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {aiSuggestions.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setSelectedColor(s.color)
                        setWheelHsv(hexToHsv(s.color))
                      }}
                      className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <span
                        className="w-5 h-5 rounded-md shrink-0 border border-white/10"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="text-[11px] text-white/60 leading-tight">
                        <span className="text-white/80">{s.area}</span>
                        {' · '}
                        {s.note}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {!aiError && aiSuggestions.length === 0 && !aiLoading && (
                <p className="text-[10px] text-white/20 mt-1.5">输入描述后点击「生成」获取配色建议</p>
              )}
            </motion.div>
          )}

          {/* Tips */}
          <div className="glass-panel rounded-xl p-3">
            <h3 className="text-xs text-white/50 font-medium mb-1 tracking-wide">操作提示</h3>
            <ul className="text-xs text-white/40 space-y-1 leading-relaxed">
              {mode === 'bead' ? (
                <>
                  <li>• 点击网格放置豆子</li>
                  <li>• 按住拖动连续铺豆</li>
                  <li>• 再次点击已铺的豆子可移除</li>
                  <li>• 点击🎨图标打开自定义调色盘</li>
                  <li>• 切换底版作为参考线</li>
                </>
              ) : mode === 'complex' ? (
                <>
                  <li>• 笔刷：自由绘制，支持透明度和对称</li>
                  <li>• 填充：点击封闭区域注色</li>
                  <li>• 喷枪：拖动散布色点，适合晕染</li>
                  <li>• 四向对称：水平+垂直镜像</li>
                  <li>• 导出为透明背景 PNG</li>
                </>
              ) : (
                <>
                  <li>• 打开"对称"可左右镜像绘制</li>
                  <li>• 选底版后沿着参考线铺色</li>
                  <li>• 点击🎨或色环调出自定色</li>
                  <li>• 导出为透明背景 PNG</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-4 text-xs text-white/40 px-1"
      >
        <span className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-full inline-block"
            style={{ backgroundColor: mode === 'bead' || !isEraser ? selectedColor : '#ffffff' }}
          />
          {mode === 'bead'
            ? `拼豆模式 · ${currentColor?.name ?? selectedColor}`
            : isEraser
              ? '橡皮擦'
              : currentColor
                ? `${currentColor.name} · ${currentColor.meaning}`
                : `自定义 · ${selectedColor}`}
        </span>
        <span>|</span>
        {mode === 'freehand' ? (
          <>
            <span>画笔 · {brushSize}px</span>
            <span>|</span>
            <span>对称: {symmetric ? '开' : '关'}</span>
            <span>|</span>
            <span>{strokeCount} 笔</span>
          </>
        ) : mode === 'complex' ? (
          <>
            <span>{complexTool === 'brush' ? '笔刷' : complexTool === 'fill' ? '填充' : '喷枪'} · {Math.round(opacity * 100)}%</span>
            <span>|</span>
            <span>对称二: {symmetric ? '开' : '关'}</span>
            <span>|</span>
            <span>四向: {symmetry4 ? '开' : '关'}</span>
          </>
        ) : (
          <>
            <span>{BEAD_COLS}×{BEAD_ROWS} 网格</span>
            <span>|</span>
            <span>{beadCount} 颗豆</span>
          </>
        )}
      </motion.div>
    </div>
  )
}
