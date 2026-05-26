import type { Point, TemplateId } from './types'
import { BEAD_R, BEAD_OX, BEAD_OY, BEAD_CELL, BEAD_COLS, BEAD_ROWS } from './constants'

/* ---- Point Utility ---- */

export function midPoint(p1: Point, p2: Point): Point {
  return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }
}

/* ---- Stroke Drawing ---- */

export function drawStroke(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  color: string,
  size: number,
  isEraser: boolean,
) {
  if (points.length < 1) return
  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.lineWidth = size
  if (isEraser) {
    ctx.globalCompositeOperation = 'destination-out'
    ctx.strokeStyle = 'rgba(0,0,0,1)'
  } else {
    ctx.globalCompositeOperation = 'source-over'
    ctx.strokeStyle = color
  }
  if (points.length === 1) {
    ctx.beginPath()
    ctx.arc(points[0].x, points[0].y, size / 2, 0, Math.PI * 2)
    ctx.fill()
  } else {
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      const mid = midPoint(points[i - 1], points[i])
      ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, mid.x, mid.y)
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y)
    ctx.stroke()
  }
  ctx.restore()
}

/* ---- Fill ---- */

export function floodFill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  fillColor: string,
  tolerance: number,
) {
  const w = ctx.canvas.width
  const h = ctx.canvas.height
  const img = ctx.getImageData(0, 0, w, h)
  const src = img.data
  const px = (Math.round(y) * w + Math.round(x)) * 4
  const targetR = src[px], targetG = src[px+1], targetB = src[px+2]
  const r = parseInt(fillColor.slice(1,3), 16)
  const g = parseInt(fillColor.slice(3,5), 16)
  const b = parseInt(fillColor.slice(5,7), 16)

  if (Math.abs(r - targetR) < tolerance && Math.abs(g - targetG) < tolerance && Math.abs(b - targetB) < tolerance) return

  const visited = new Uint8Array(w * h)
  const stack: [number, number][] = [[Math.round(x), Math.round(y)]]

  while (stack.length) {
    const [cx, cy] = stack.pop()!
    if (cx < 0 || cx >= w || cy < 0 || cy >= h) continue
    const idx = cy * w + cx
    if (visited[idx]) continue
    const si = idx * 4
    if (Math.abs(src[si] - targetR) > tolerance || Math.abs(src[si+1] - targetG) > tolerance || Math.abs(src[si+2] - targetB) > tolerance) continue
    visited[idx] = 1
    src[si] = r; src[si+1] = g; src[si+2] = b; src[si+3] = 255
    stack.push([cx+1, cy], [cx-1, cy], [cx, cy+1], [cx, cy-1])
  }

  ctx.putImageData(img, 0, 0)
}

/* ---- Spray ---- */

export function drawSpray(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  radius: number,
  opacity: number,
) {
  ctx.save()
  ctx.globalAlpha = opacity
  ctx.fillStyle = color
  const count = Math.round(radius * 2.5)
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const dist = Math.sqrt(Math.random()) * radius
    const sx = x + Math.cos(angle) * dist
    const sy = y + Math.sin(angle) * dist
    const size = Math.random() * 2.5 + 0.5
    ctx.beginPath()
    ctx.arc(sx, sy, size, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

/* ---- Extra Brush Styles ---- */

export function drawCalligraphyStroke(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  color: string,
  baseSize: number,
  opacity: number,
) {
  if (points.length < 1) return
  ctx.save()
  ctx.globalAlpha = opacity
  ctx.lineCap = 'square'
  ctx.lineJoin = 'bevel'
  ctx.strokeStyle = color
  ctx.fillStyle = color

  if (points.length === 1) {
    ctx.beginPath(); ctx.arc(points[0].x, points[0].y, baseSize * 0.5, 0, Math.PI * 2); ctx.fill()
    ctx.restore()
    return
  }

  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 1], p1 = points[i]
    const dx = p1.x - p0.x, dy = p1.y - p0.y
    const speed = Math.sqrt(dx * dx + dy * dy)
    const width = Math.max(2, Math.min(baseSize * 4, baseSize * (3 - speed * 0.03)))
    const angle = Math.atan2(dy, dx)
    const perpX = Math.cos(angle + Math.PI / 2) * width * 0.5
    const perpY = Math.sin(angle + Math.PI / 2) * width * 0.5
    ctx.beginPath()
    ctx.moveTo(p0.x + perpX, p0.y + perpY)
    ctx.lineTo(p1.x + perpX, p1.y + perpY)
    ctx.lineTo(p1.x - perpX, p1.y - perpY)
    ctx.lineTo(p0.x - perpX, p0.y - perpY)
    ctx.closePath()
    ctx.fill()
    if (i === points.length - 1) {
      ctx.beginPath(); ctx.arc(p1.x, p1.y, width * 0.15, 0, Math.PI * 2); ctx.fill()
    }
  }
  ctx.restore()
}

export function drawMarkerStroke(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  color: string,
  size: number,
  opacity: number,
) {
  if (points.length < 1) return
  ctx.save()
  ctx.globalAlpha = opacity
  ctx.strokeStyle = color
  ctx.lineCap = 'square'
  ctx.lineJoin = 'miter'
  ctx.lineWidth = size
  ctx.setLineDash([])
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y)
  }
  ctx.stroke()
  ctx.restore()
}

export function drawWatercolorStroke(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  color: string,
  size: number,
  opacity: number,
) {
  if (points.length < 1) return
  ctx.save()
  ctx.globalAlpha = opacity * 0.4
  const avgX = points.reduce((s, p) => s + p.x, 0) / points.length
  const avgY = points.reduce((s, p) => s + p.y, 0) / points.length
  const maxDist = Math.max(
    ...points.map(p => Math.sqrt((p.x - avgX)**2 + (p.y - avgY)**2)),
    size * 2,
  )
  const grad = ctx.createRadialGradient(avgX, avgY, 0, avgX, avgY, maxDist)
  grad.addColorStop(0, color)
  grad.addColorStop(0.3, color)
  grad.addColorStop(0.6, ctx.canvas.style.backgroundColor || 'rgba(0,0,0,0)')
  grad.addColorStop(1, 'transparent')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.arc(avgX, avgY, maxDist, 0, Math.PI * 2)
  ctx.fill()
  const dotCount = Math.min(30, points.length * 2)
  ctx.fillStyle = color
  ctx.globalAlpha = opacity * 0.6
  for (let i = 0; i < dotCount; i++) {
    const p = points[Math.floor(Math.random() * points.length)]
    const jx = p.x + (Math.random() - 0.5) * size * 0.8
    const jy = p.y + (Math.random() - 0.5) * size * 0.8
    const dotR = Math.random() * size * 0.3 + 1
    ctx.beginPath(); ctx.arc(jx, jy, dotR, 0, Math.PI * 2); ctx.fill()
  }
  ctx.restore()
}

/* ---- Bead Drawing ---- */

export function drawBead(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string, r = BEAD_R) {
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
  const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, 0, cx, cy, r)
  grad.addColorStop(0, 'rgba(255,255,255,0.45)')
  grad.addColorStop(0.45, 'rgba(255,255,255,0.08)')
  grad.addColorStop(1, 'rgba(0,0,0,0.15)')
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fillStyle = grad
  ctx.fill()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(0,0,0,0.18)'
  ctx.lineWidth = 0.6
  ctx.stroke()
}

export function drawBeadGrid(
  ctx: CanvasRenderingContext2D,
  beadGrid: Record<string, string>,
  w: number,
  h: number,
) {
  ctx.fillStyle = 'rgba(0,0,0,0.35)'
  ctx.fillRect(0, 0, w, h)

  ctx.strokeStyle = 'rgba(255,255,255,0.06)'
  ctx.lineWidth = 0.5
  for (let row = 0; row <= BEAD_ROWS; row++) {
    const y = BEAD_OY + row * BEAD_CELL
    ctx.beginPath()
    ctx.moveTo(BEAD_OX, y)
    ctx.lineTo(BEAD_OX + BEAD_COLS * BEAD_CELL, y)
    ctx.stroke()
  }
  for (let col = 0; col <= BEAD_COLS; col++) {
    const x = BEAD_OX + col * BEAD_CELL
    ctx.beginPath()
    ctx.moveTo(x, BEAD_OY)
    ctx.lineTo(x, BEAD_OY + BEAD_ROWS * BEAD_CELL)
    ctx.stroke()
  }

  for (const [key, color] of Object.entries(beadGrid)) {
    const [row, col] = key.split(',').map(Number)
    const cx = BEAD_OX + col * BEAD_CELL + BEAD_CELL / 2
    const cy = BEAD_OY + row * BEAD_CELL + BEAD_CELL / 2
    drawBead(ctx, cx, cy, color)
  }
}

/* ---- Face Template Drawing ---- */

function drawFaceGuideLines(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save()
  ctx.strokeStyle = 'rgba(0,0,0,0.06)'
  ctx.lineWidth = 1
  ctx.setLineDash([4, 4])
  const cx = w / 2
  const cy = h / 2
  ctx.beginPath()
  ctx.moveTo(cx, 0)
  ctx.lineTo(cx, h)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(0, cy)
  ctx.lineTo(w, cy)
  ctx.stroke()
  ctx.restore()
}

function drawJingTemplate(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const cx = w / 2
  const cy = h / 2
  ctx.save()
  ctx.strokeStyle = '#888'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.ellipse(cx, cy, w * 0.32, h * 0.42, 0, 0, Math.PI * 2)
  ctx.stroke()
  const eyeY = cy - h * 0.12
  const eyeSpacing = w * 0.16
  ctx.strokeStyle = '#666'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.ellipse(cx - eyeSpacing, eyeY, w * 0.06, h * 0.035, 0, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.ellipse(cx + eyeSpacing, eyeY, w * 0.06, h * 0.035, 0, 0, Math.PI * 2)
  ctx.stroke()
  ctx.lineWidth = 3
  const browY = eyeY - h * 0.055
  ctx.beginPath()
  ctx.moveTo(cx - eyeSpacing - w * 0.04, browY - h * 0.02)
  ctx.lineTo(cx - eyeSpacing, browY - h * 0.04)
  ctx.lineTo(cx + eyeSpacing, browY - h * 0.04)
  ctx.lineTo(cx + eyeSpacing + w * 0.04, browY - h * 0.02)
  ctx.stroke()
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(cx, cy - h * 0.03)
  ctx.lineTo(cx, cy + h * 0.06)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(cx, cy + h * 0.06, w * 0.015, 0, Math.PI, true)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(cx, cy + h * 0.14, w * 0.1, 0.1, Math.PI - 0.1)
  ctx.stroke()
  ctx.restore()
}

function drawChouTemplate(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const cx = w / 2
  const cy = h / 2
  ctx.save()
  ctx.strokeStyle = '#888'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.ellipse(cx, cy, w * 0.30, h * 0.38, 0, 0, Math.PI * 2)
  ctx.stroke()
  const eyeY = cy - h * 0.08
  const eyeSpacing = w * 0.14
  ctx.strokeStyle = '#666'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.ellipse(cx - eyeSpacing, eyeY, w * 0.07, h * 0.045, 0, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.ellipse(cx + eyeSpacing, eyeY, w * 0.07, h * 0.045, 0, 0, Math.PI * 2)
  ctx.stroke()
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(cx, cy + h * 0.02, w * 0.025, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(cx, cy + h * 0.14, w * 0.09, 0.05, Math.PI - 0.05)
  ctx.stroke()
  const dotR = 3
  ctx.fillStyle = '#888'
  ctx.beginPath()
  ctx.arc(cx - eyeSpacing - w * 0.04, cy + h * 0.06, dotR, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(cx + eyeSpacing + w * 0.04, cy + h * 0.06, dotR, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawGuanYuTemplate(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const cx = w / 2, cy = h / 2
  ctx.save()
  ctx.strokeStyle = '#c0392b'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.ellipse(cx, cy, w * 0.30, h * 0.42, 0, 0, Math.PI * 2)
  ctx.stroke()
  const eyeY = cy - h * 0.12, es = w * 0.15
  ctx.strokeStyle = '#922b21'
  ctx.lineWidth = 2.5
  ctx.beginPath(); ctx.moveTo(cx - es - w*0.04, eyeY + h*0.02); ctx.lineTo(cx - es, eyeY - h*0.02); ctx.lineTo(cx - es + w*0.04, eyeY + h*0.02); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx + es - w*0.04, eyeY + h*0.02); ctx.lineTo(cx + es, eyeY - h*0.02); ctx.lineTo(cx + es + w*0.04, eyeY + h*0.02); ctx.stroke()
  ctx.beginPath(); ctx.arc(cx - es, eyeY, w*0.025, 0, Math.PI*2); ctx.fill()
  ctx.beginPath(); ctx.arc(cx + es, eyeY, w*0.025, 0, Math.PI*2); ctx.fill()
  ctx.strokeStyle = '#7b241c'
  ctx.lineWidth = 3
  const by = eyeY - h * 0.06
  ctx.beginPath(); ctx.moveTo(cx - es - w*0.06, by + h*0.01); ctx.quadraticCurveTo(cx - es - w*0.01, by - h*0.04, cx - es + w*0.02, by); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx + es - w*0.02, by); ctx.quadraticCurveTo(cx + es + w*0.01, by - h*0.04, cx + es + w*0.06, by + h*0.01); ctx.stroke()
  ctx.strokeStyle = '#888'
  ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(cx, cy - h*0.02); ctx.lineTo(cx, cy + h*0.05); ctx.stroke()
  ctx.beginPath(); ctx.arc(cx, cy + h*0.05, w*0.015, 0, Math.PI, true); ctx.stroke()
  ctx.beginPath(); ctx.arc(cx, cy + h*0.14, w*0.09, 0.05, Math.PI - 0.05); ctx.stroke()
  ctx.strokeStyle = '#641e16'
  ctx.lineWidth = 2
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath(); ctx.moveTo(cx + i * w*0.02, cy + h*0.16); ctx.quadraticCurveTo(cx + i * w*0.03, cy + h*0.30, cx + i * w*0.01, cy + h*0.38); ctx.stroke()
  }
  ctx.restore()
}

function drawBaoZhengTemplate(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const cx = w / 2, cy = h / 2
  ctx.save()
  ctx.strokeStyle = '#888'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.ellipse(cx, cy, w * 0.28, h * 0.40, 0, 0, Math.PI * 2)
  ctx.stroke()
  ctx.strokeStyle = '#bbb'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(cx, cy - h * 0.16, w * 0.045, Math.PI * 0.3, Math.PI * 0.7)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(cx, cy - h * 0.16, w * 0.06, Math.PI * 0.3, Math.PI * 0.7)
  ctx.stroke()
  const eyeY = cy - h * 0.08, es = w * 0.14
  ctx.strokeStyle = '#444'
  ctx.lineWidth = 2.5
  ctx.beginPath(); ctx.ellipse(cx - es, eyeY, w*0.05, h*0.03, 0, 0, Math.PI*2); ctx.stroke()
  ctx.beginPath(); ctx.ellipse(cx + es, eyeY, w*0.05, h*0.03, 0, 0, Math.PI*2); ctx.stroke()
  ctx.fillStyle = '#444'
  ctx.beginPath(); ctx.arc(cx - es, eyeY, w*0.02, 0, Math.PI*2); ctx.fill()
  ctx.beginPath(); ctx.arc(cx + es, eyeY, w*0.02, 0, Math.PI*2); ctx.fill()
  ctx.strokeStyle = '#222'
  ctx.lineWidth = 3
  const by = eyeY - h * 0.055
  ctx.beginPath(); ctx.moveTo(cx - es - w*0.04, by); ctx.lineTo(cx - es + w*0.04, by); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx + es - w*0.04, by); ctx.lineTo(cx + es + w*0.04, by); ctx.stroke()
  ctx.strokeStyle = '#888'
  ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(cx, cy - h*0.02); ctx.lineTo(cx, cy + h*0.05); ctx.stroke()
  ctx.beginPath(); ctx.arc(cx, cy + h*0.14, w*0.07, 0.1, Math.PI - 0.1); ctx.stroke()
  ctx.restore()
}

function drawCaoCaoTemplate(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const cx = w / 2, cy = h / 2
  ctx.save()
  ctx.strokeStyle = '#999'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.ellipse(cx, cy, w * 0.26, h * 0.40, 0, 0, Math.PI * 2)
  ctx.stroke()
  const eyeY = cy - h * 0.10, es = w * 0.13
  ctx.strokeStyle = '#666'
  ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(cx - es - w*0.04, eyeY); ctx.lineTo(cx - es + w*0.04, eyeY); ctx.lineTo(cx - es + w*0.05, eyeY - h*0.01); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx + es - w*0.04, eyeY); ctx.lineTo(cx + es + w*0.04, eyeY); ctx.lineTo(cx + es + w*0.05, eyeY - h*0.01); ctx.stroke()
  ctx.strokeStyle = '#777'
  ctx.lineWidth = 1.5
  const by = eyeY - h * 0.05
  ctx.beginPath(); ctx.moveTo(cx - es - w*0.02, by); ctx.quadraticCurveTo(cx - es, by - h*0.02, cx - es + w*0.02, by); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx + es - w*0.02, by); ctx.quadraticCurveTo(cx + es, by - h*0.02, cx + es + w*0.02, by); ctx.stroke()
  ctx.strokeStyle = '#999'
  ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(cx, cy - h*0.02); ctx.lineTo(cx, cy + h*0.04); ctx.stroke()
  ctx.beginPath(); ctx.arc(cx, cy + h*0.12, w*0.04, 0.15, Math.PI - 0.15); ctx.stroke()
  ctx.strokeStyle = '#666'
  ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(cx - w*0.03, cy + h*0.10); ctx.quadraticCurveTo(cx - w*0.08, cy + h*0.14, cx - w*0.10, cy + h*0.16); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx + w*0.03, cy + h*0.10); ctx.quadraticCurveTo(cx + w*0.08, cy + h*0.14, cx + w*0.10, cy + h*0.16); ctx.stroke()
  ctx.restore()
}

function drawZhangFeiTemplate(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const cx = w / 2, cy = h / 2
  ctx.save()
  ctx.strokeStyle = '#555'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.ellipse(cx, cy, w * 0.32, h * 0.38, 0, 0, Math.PI * 2)
  ctx.stroke()
  const eyeY = cy - h * 0.06, es = w * 0.16
  ctx.strokeStyle = '#333'
  ctx.lineWidth = 2.5
  ctx.beginPath(); ctx.ellipse(cx - es, eyeY, w*0.065, h*0.04, 0, 0, Math.PI*2); ctx.stroke()
  ctx.beginPath(); ctx.ellipse(cx + es, eyeY, w*0.065, h*0.04, 0, 0, Math.PI*2); ctx.stroke()
  ctx.fillStyle = '#000'
  ctx.beginPath(); ctx.arc(cx - es, eyeY, w*0.03, 0, Math.PI*2); ctx.fill()
  ctx.beginPath(); ctx.arc(cx + es, eyeY, w*0.03, 0, Math.PI*2); ctx.fill()
  ctx.strokeStyle = '#222'
  ctx.lineWidth = 3.5
  const by = eyeY - h * 0.065
  ctx.beginPath(); ctx.moveTo(cx - es - w*0.05, by); ctx.quadraticCurveTo(cx - es - w*0.01, by - h*0.04, cx - es + w*0.05, by + h*0.01); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx + es - w*0.05, by + h*0.01); ctx.quadraticCurveTo(cx + es + w*0.01, by - h*0.04, cx + es + w*0.05, by); ctx.stroke()
  ctx.strokeStyle = '#666'
  ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(cx, cy - h*0.02); ctx.lineTo(cx, cy + h*0.04); ctx.stroke()
  ctx.beginPath(); ctx.arc(cx, cy + h*0.04, w*0.02, 0, Math.PI, true); ctx.stroke()
  ctx.strokeStyle = '#555'
  ctx.lineWidth = 2.5
  ctx.beginPath(); ctx.arc(cx, cy + h*0.14, w*0.10, 0.15, Math.PI - 0.15); ctx.stroke()
  ctx.strokeStyle = '#444'
  ctx.lineWidth = 1.5
  for (let i = -4; i <= 4; i++) {
    ctx.beginPath(); ctx.moveTo(cx + i * w*0.025, cy + h*0.18); ctx.lineTo(cx + i * w*0.02, cy + h*0.24); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(cx + i * w*0.025, cy + h*0.14); ctx.lineTo(cx + i * w*0.02, cy + h*0.19); ctx.stroke()
  }
  ctx.restore()
}

function drawWuKongTemplate(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const cx = w / 2, cy = h / 2
  ctx.save()
  ctx.strokeStyle = '#c08'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.ellipse(cx, cy, w * 0.26, h * 0.38, 0, 0, Math.PI * 2)
  ctx.stroke()
  ctx.strokeStyle = '#a06'
  ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.arc(cx - w*0.18, cy + h*0.04, w*0.05, 0, Math.PI*2); ctx.stroke()
  ctx.beginPath(); ctx.arc(cx + w*0.18, cy + h*0.04, w*0.05, 0, Math.PI*2); ctx.stroke()
  const eyeY = cy - h * 0.10, es = w * 0.12
  ctx.strokeStyle = '#330'
  ctx.lineWidth = 2
  ctx.beginPath(); ctx.ellipse(cx - es, eyeY, w*0.055, h*0.03, 0, 0, Math.PI*2); ctx.stroke()
  ctx.beginPath(); ctx.ellipse(cx + es, eyeY, w*0.055, h*0.03, 0, 0, Math.PI*2); ctx.stroke()
  ctx.fillStyle = '#c90'
  ctx.beginPath(); ctx.arc(cx - es, eyeY, w*0.025, 0, Math.PI*2); ctx.fill()
  ctx.beginPath(); ctx.arc(cx + es, eyeY, w*0.025, 0, Math.PI*2); ctx.fill()
  ctx.strokeStyle = '#420'
  ctx.beginPath(); ctx.arc(cx - es, eyeY, w*0.014, 0, Math.PI*2); ctx.stroke()
  ctx.beginPath(); ctx.arc(cx + es, eyeY, w*0.014, 0, Math.PI*2); ctx.stroke()
  ctx.strokeStyle = '#e80'
  ctx.lineWidth = 2
  ctx.beginPath(); ctx.arc(cx, cy - h*0.24, w*0.04, Math.PI*1.2, Math.PI*1.8); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx - w*0.04, cy - h*0.28); ctx.lineTo(cx - w*0.01, cy - h*0.32); ctx.lineTo(cx + w*0.01, cy - h*0.32); ctx.lineTo(cx + w*0.04, cy - h*0.28); ctx.stroke()
  ctx.strokeStyle = '#888'
  ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(cx, cy - h*0.01); ctx.lineTo(cx, cy + h*0.025); ctx.stroke()
  ctx.beginPath(); ctx.arc(cx, cy + h*0.025, w*0.012, 0, Math.PI, true); ctx.stroke()
  ctx.strokeStyle = '#666'
  ctx.lineWidth = 2
  ctx.beginPath(); ctx.arc(cx, cy + h*0.12, w*0.06, 0.1, Math.PI - 0.1); ctx.stroke()
  ctx.strokeStyle = '#c08'
  ctx.lineWidth = 1
  for (let i = 0; i < 3; i++) {
    ctx.beginPath(); ctx.moveTo(cx - w*0.03, cy - h*0.05 + i * h*0.015); ctx.lineTo(cx + w*0.03, cy - h*0.05 + i * h*0.015); ctx.stroke()
  }
  ctx.restore()
}

export function drawFaceTemplate(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  template: TemplateId,
) {
  drawFaceGuideLines(ctx, w, h)
  if (template === 'jing') drawJingTemplate(ctx, w, h)
  else if (template === 'chou') drawChouTemplate(ctx, w, h)
  else if (template === 'guanyu') drawGuanYuTemplate(ctx, w, h)
  else if (template === 'baozheng') drawBaoZhengTemplate(ctx, w, h)
  else if (template === 'caocao') drawCaoCaoTemplate(ctx, w, h)
  else if (template === 'zhangfei') drawZhangFeiTemplate(ctx, w, h)
  else if (template === 'wukong') drawWuKongTemplate(ctx, w, h)
}

/* ---- Color Utilities ---- */

export function hsvToHex(h: number, s: number, v: number): string {
  const i = Math.floor(h * 6)
  const f = h * 6 - i
  const p = v * (1 - s)
  const q = v * (1 - f * s)
  const t = v * (1 - (1 - f) * s)
  let r = 0, g = 0, b = 0
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break
    case 1: r = q; g = v; b = p; break
    case 2: r = p; g = v; b = t; break
    case 3: r = p; g = q; b = v; break
    case 4: r = t; g = p; b = v; break
    case 5: r = v; g = p; b = q; break
  }
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

export function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
  }
  return { h, s: max === 0 ? 0 : d / max, v: max }
}
