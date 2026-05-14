import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import db from '../db'
import { syncOrderToCloud, syncRentalOrderToCloud } from '../utils/cloudSync'

// 建默认示例日志
function buildDefaultLogs() {
  const logs: { id: number; city: string; goods: string; quantity: number; time: string }[] = []
  let idCounter = 1
  logs.push(
    { id: idCounter++, city: '浙江省杭州市', goods: '晋剧脸谱盲盒 x2', quantity: 2, time: '刚刚' },
    { id: idCounter++, city: '北京市朝阳区', goods: '皮影戏人偶套装 x1', quantity: 1, time: '2分钟前' },
    { id: idCounter++, city: '广东省广州市', goods: '汉服租赁·明制 x3', quantity: 3, time: '5分钟前' },
    { id: idCounter++, city: '四川省成都市', goods: '戏曲主题丝巾 x1', quantity: 1, time: '8分钟前' },
    { id: idCounter++, city: '山西省太原市', goods: '剪纸艺术书签套装 x2', quantity: 2, time: '10分钟前' },
    { id: idCounter++, city: '上海市浦东新区', goods: '非遗陶瓷茶具 x1', quantity: 1, time: '12分钟前' },
    { id: idCounter++, city: '江苏省南京市', goods: '刺绣香囊挂件 x4', quantity: 4, time: '15分钟前' },
    { id: idCounter++, city: '湖北省武汉市', goods: '汉服租赁·唐制 x2', quantity: 2, time: '18分钟前' },
    { id: idCounter++, city: '陕西省西安市', goods: '木版年画装饰画 x1', quantity: 1, time: '20分钟前' },
    { id: idCounter++, city: '湖南省长沙市', goods: '青铜纹饰文创摆件 x1', quantity: 1, time: '22分钟前' },
  )
  return logs
}

// 从 Dexie (IndexedDB) 读取订单数据生成发货日志
async function buildLogsFromDB() {
  const logs: { id: number; city: string; goods: string; quantity: number; time: string }[] = []
  let idCounter = 1
  const cityPool = ['浙江省杭州市', '北京市朝阳区', '广东省广州市', '四川省成都市', '上海市浦东新区', '陕西省西安市', '江苏省南京市', '湖北省武汉市', '广东省深圳市', '湖南省长沙市', '重庆市渝中区']

  try {
    const shopOrders = await db.orders.toArray()
    for (const o of shopOrders) {
      if (o.items && o.items.length > 0) {
        const city = cityPool[Math.floor(Math.random() * cityPool.length)]
        for (const item of o.items) {
          logs.push({
            id: idCounter++,
            city,
            goods: item.name || '文创商品',
            quantity: item.quantity || 1,
            time: o.createdAt ? `${Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 60000)}分钟前` : '刚刚'
          })
        }
      }
    }
  } catch { /* ignore */ }

  try {
    const rentalOrders = await db.rentalOrders.toArray()
    for (const o of rentalOrders) {
      if (o.items && o.items.length > 0) {
        for (const item of o.items) {
          logs.push({
            id: idCounter++,
            city: o.address?.includes('北京') ? '北京市' : o.address?.includes('上海') ? '上海市' : o.address?.includes('广州') ? '广州市' : o.address?.includes('杭州') ? '浙江省杭州市' : '山西省太原市',
            goods: item.name || '汉服租赁',
            quantity: item.quantity || 1,
            time: o.createdAt ? `${Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 60000)}分钟前` : '刚刚'
          })
        }
      }
    }
  } catch { /* ignore */ }

  if (logs.length === 0) return buildDefaultLogs()
  return logs
}

// 中国城市坐标数据
const cityCoords: Record<string, { lng: number; lat: number }> = {
  '浙江省杭州市': { lng: 120.1551, lat: 30.2741 },
  '北京市朝阳区': { lng: 116.4074, lat: 39.9042 },
  '广东省广州市': { lng: 113.2644, lat: 23.1291 },
  '四川省成都市': { lng: 104.0665, lat: 30.5723 },
  '上海市浦东新区': { lng: 121.4737, lat: 31.2304 },
  '陕西省西安市': { lng: 108.9398, lat: 34.3416 },
  '江苏省南京市': { lng: 118.7969, lat: 32.0603 },
  '湖北省武汉市': { lng: 114.3054, lat: 30.5931 },
  '广东省深圳市': { lng: 114.0579, lat: 22.5431 },
  '湖南省长沙市': { lng: 112.9388, lat: 28.2282 },
  '重庆市渝中区': { lng: 106.5516, lat: 29.5630 },
  '山西省太原市': { lng: 112.5489, lat: 37.8706 },
}

// 高德地图加载
async function loadAMap(): Promise<any> {
  if ((window as any).AMap) return (window as any).AMap

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${import.meta.env.VITE_AMAP_KEY_1 || 'a8fa95b350347b80d35952a0354c8622'}`
    script.async = true
    script.onload = () => {
      if ((window as any).AMap) {
        resolve((window as any).AMap)
      } else {
        reject(new Error('AMap not loaded'))
      }
    }
    script.onerror = () => reject(new Error('Failed to load AMap'))
    document.head.appendChild(script)
  })
}

export default function SalesFlowMap() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const polylinesRef = useRef<any[]>([])
  const animDotsRef = useRef<any[]>([])
  const [logs, setLogs] = useState<{ id: number; city: string; goods: string; quantity: number; time: string }[]>(() => buildDefaultLogs())
  const [orderCount, setOrderCount] = useState(0)
  const [mapStatus, setMapStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  // 初始化：从 Dexie 读取订单数据
  useEffect(() => {
    buildLogsFromDB().then(setLogs)
    Promise.all([db.orders.count(), db.rentalOrders.count()]).then(([s, r]) => setOrderCount(s + r)).catch(() => {})
  }, [])

  // 订单数据同步到 CloudBase
  useEffect(() => {
    const syncInterval = setInterval(async () => {
      try {
        const shopOrders = await db.orders.toArray()
        const rentalOrders = await db.rentalOrders.toArray()
        for (const order of shopOrders) { await syncOrderToCloud(order) }
        for (const order of rentalOrders) { await syncRentalOrderToCloud(order) }
      } catch (err) {
        console.error('订单同步到 CloudBase 失败:', err)
      }
    }, 10000)
    return () => clearInterval(syncInterval)
  }, [])

  // 模拟实时订单更新
  useEffect(() => {
    const interval = setInterval(() => {
      setOrderCount((prev: number) => prev + 1)
      const newLog = {
        id: Date.now(),
        city: Object.keys(cityCoords)[Math.floor(Math.random() * Object.keys(cityCoords).length)],
        goods: ['晋剧脸谱盲盒', '皮影戏人偶套装', '汉服租赁·明制', '戏曲主题丝巾', '剪纸艺术书签套装'][Math.floor(Math.random() * 5)],
        quantity: Math.floor(Math.random() * 3) + 1,
        time: '刚刚'
      } as const
      setLogs(prev => [newLog, ...prev.slice(0, 19)])
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // 初始化高德地图 + 流向动画
  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        if (!mapContainer.current) return

        ;(window as any)._AMapSecurityConfig = {
          securityJsCode: import.meta.env.VITE_AMAP_SECURITY_JSCODE_1 || '3c709401bd41805fad01259802e16754',
        }

        const AMap = await loadAMap()
        if (cancelled || !mapContainer.current) return

        const map = new AMap.Map(mapContainer.current, {
          zoom: 5,
          center: [110, 32],
          viewMode: '2D',
          mapStyle: 'amap://styles/darkblue',
        })

        if (cancelled) { map.destroy(); return }

        mapInstance.current = map
        setMapStatus('ready')

        const taiyuan = cityCoords['山西省太原市']

        // 绘制城市标记
        Object.entries(cityCoords).forEach(([city, { lng, lat }]) => {
          const isTaiyuan = city === '山西省太原市'
          const markerContent = isTaiyuan
            ? `<div style="
                width: 18px; height: 18px;
                background: radial-gradient(circle, #fbbf24 0%, #d97706 70%);
                border: 2px solid rgba(251,191,36,0.8);
                border-radius: 50%;
                box-shadow: 0 0 16px rgba(251,191,36,0.7);
              "></div>`
            : `<div style="
                width: 10px; height: 10px;
                background: radial-gradient(circle, #60a5fa 0%, #3b82f6 70%);
                border: 1.5px solid rgba(96,165,250,0.6);
                border-radius: 50%;
                box-shadow: 0 0 8px rgba(59,130,246,0.5);
              "></div>`

          const marker = new AMap.Marker({
            position: [lng, lat],
            content: markerContent,
            offset: new AMap.Pixel(isTaiyuan ? -9 : -5, isTaiyuan ? -9 : -5),
            zIndex: isTaiyuan ? 200 : 100,
          })

          // 城市名称标签
          const label = city.replace(/省|市|区/g, '')
          marker.setLabel({
            content: `<div style="
              color: ${isTaiyuan ? '#fbbf24' : 'rgba(255,255,255,0.85)'};
              font-size: ${isTaiyuan ? '13px' : '11px'};
              font-weight: ${isTaiyuan ? 'bold' : 'normal'};
              padding: 2px 6px;
              background: rgba(0,0,0,0.5);
              border-radius: 4px;
              white-space: nowrap;
              text-shadow: 0 1px 2px rgba(0,0,0,0.8);
            ">${isTaiyuan ? '📦 ' + label : label}</div>`,
            direction: 'top',
            offset: new AMap.Pixel(0, -8),
          })

          marker.setMap(map)
          markersRef.current.push(marker)
        })

        // 绘制从太原到各城市的流向线
        Object.entries(cityCoords).forEach(([city, { lng, lat }]) => {
          if (city === '山西省太原市') return

          // 底层静态线
          const line = new AMap.Polyline({
            path: [
              new AMap.LngLat(taiyuan.lng, taiyuan.lat),
              new AMap.LngLat(lng, lat),
            ],
            strokeColor: 'rgba(239, 68, 68, 0.25)',
            strokeWeight: 1.5,
            strokeStyle: 'dashed',
            strokeDasharray: [8, 6],
            lineJoin: 'round',
            zIndex: 50,
          })
          line.setMap(map)
          polylinesRef.current.push(line)

          // 动态流向点
          const dot = new AMap.CircleMarker({
            center: [taiyuan.lng, taiyuan.lat],
            radius: 4,
            fillColor: '#fbbf24',
            fillOpacity: 0.9,
            strokeColor: '#f59e0b',
            strokeWeight: 1,
            strokeOpacity: 0.6,
            zIndex: 150,
          })
          dot.setMap(map)

          // 动画：沿路线移动
          const speed = 0.3 + Math.random() * 0.4 // 每条线不同速度
          const offset = Math.random() * 2 // 随机初始偏移
          const animate = () => {
            if (cancelled) return
            const t = ((Date.now() / 1000 * speed + offset) % 2) / 2
            const curLng = taiyuan.lng + (lng - taiyuan.lng) * t
            const curLat = taiyuan.lat + (lat - taiyuan.lat) * t
            dot.setCenter([curLng, curLat])
            // 接近终点时变淡
            dot.setOptions({
              radius: 3 + t * 2,
              fillOpacity: 0.9 - t * 0.5,
            })
            requestAnimationFrame(animate)
          }
          requestAnimationFrame(animate)
          animDotsRef.current.push(dot)
        })

        // 太原脉冲效果
        const pulseMarker = new AMap.CircleMarker({
          center: [taiyuan.lng, taiyuan.lat],
          radius: 12,
          fillColor: '#fbbf24',
          fillOpacity: 0.15,
          strokeColor: '#fbbf24',
          strokeWeight: 1,
          strokeOpacity: 0.3,
          zIndex: 90,
        })
        pulseMarker.setMap(map)

        const pulseAnimate = () => {
          if (cancelled) return
          const t = (Date.now() / 1000 % 2) / 2
          pulseMarker.setOptions({
            radius: 12 + t * 18,
            fillOpacity: 0.15 * (1 - t),
            strokeOpacity: 0.3 * (1 - t),
          })
          requestAnimationFrame(pulseAnimate)
        }
        requestAnimationFrame(pulseAnimate)

      } catch (err: unknown) {
        if (!cancelled) {
          console.error('SalesFlowMap init failed:', err)
          setMapStatus('error')
        }
      }
    })()

    return () => {
      cancelled = true
      markersRef.current.forEach(m => { try { m.setMap(null) } catch {} })
      polylinesRef.current.forEach(p => { try { p.setMap(null) } catch {} })
      animDotsRef.current.forEach(d => { try { d.setMap(null) } catch {} })
      markersRef.current = []
      polylinesRef.current = []
      animDotsRef.current = []
      if (mapInstance.current) {
        try { mapInstance.current.destroy() } catch {}
        mapInstance.current = null
      }
    }
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white/70">📦 订单流向图</h3>
        <div className="flex items-center gap-2">
          {mapStatus === 'loading' && <div className="text-xs text-amber-400/60 animate-pulse">地图加载中...</div>}
          {mapStatus === 'ready' && <div className="text-xs text-emerald-400/60">实时同步中</div>}
          {mapStatus === 'error' && <div className="text-xs text-red-400/60">地图加载失败</div>}
        </div>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden relative">
        <div
          ref={mapContainer}
          className="w-full"
          style={{ height: '420px', background: 'linear-gradient(135deg, #0f172a, #1e293b)' }}
        />

        {/* 右下角图例 */}
        <div className="absolute bottom-4 right-4 glass-panel rounded-lg p-3 z-10">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.7)]" />
              <span className="text-white/60">发货中心</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_6px_rgba(59,130,246,0.5)]" />
              <span className="text-white/60">覆盖城市</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0 border-t border-dashed border-red-500/40" />
              <span className="text-white/60">路线</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-white/60">流向</span>
            </div>
          </div>
        </div>

        {/* 左上角提示 */}
        <div className="absolute top-4 left-4 z-10">
          <div className="glass-panel rounded-lg px-3 py-2 text-xs text-white/50">
            📦 山西太原 → 全国 12 城
          </div>
        </div>
      </div>

      {/* 订单统计 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-panel rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-amber-400">{orderCount}</div>
          <div className="text-xs text-white/40">总订单数</div>
        </div>
        <div className="glass-panel rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-emerald-400">¥{(orderCount * 128).toLocaleString()}</div>
          <div className="text-xs text-white/40">总销售额</div>
        </div>
        <div className="glass-panel rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-sky-400">12</div>
          <div className="text-xs text-white/40">覆盖城市</div>
        </div>
      </div>

      {/* 滚动日志 */}
      <AnimatedLogList logs={logs} />
    </div>
  )
}

// 滚动日志组件
function AnimatedLogList({ logs }: { logs: { id: number; city: string; goods: string; quantity: number; time: string }[] }) {
  return (
    <div className="space-y-2">
      {logs.slice(0, 8).map((log, index) => (
        <motion.div
          key={log.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center justify-between text-xs"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-1 h-1 rounded-full bg-amber-500 shrink-0" />
            <span className="text-white/70 truncate">发往 {log.city}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-amber-400/60">{log.goods}</span>
            <span className="text-white/40">{log.time}</span>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
