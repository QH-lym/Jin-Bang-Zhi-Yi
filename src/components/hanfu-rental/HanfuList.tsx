import { motion } from 'framer-motion'
import { Search, Clock3, CheckCircle, Edit } from 'lucide-react'
import type { HanfuItem } from '../../data/hanfuData'
import { styles, faqList, coverGradient } from '../../data/hanfuData'
import { uploadFile } from '../../utils/cloudbase'
import { costumeHeroStyle, coverObjectPosition } from './helpers'

interface HanfuListProps {
  filteredList: HanfuItem[]
  activeStyle: string
  activeGender: string
  showFaq: boolean
  isAdmin: boolean
  editImgId: string | null
  editImgVal: string
  onStyleChange: (style: string) => void
  onGenderChange: (gender: string) => void
  onToggleFaq: () => void
  onSelectItem: (item: HanfuItem) => void
  onStartEditImg: (id: string, img: string) => void
  onEditImgValChange: (val: string) => void
  onSaveEditImg: () => void
  onCancelEditImg: () => void
}

export default function HanfuList({
  filteredList,
  activeStyle,
  activeGender,
  showFaq,
  isAdmin,
  editImgId,
  editImgVal,
  onStyleChange,
  onGenderChange,
  onToggleFaq,
  onSelectItem,
  onStartEditImg,
  onEditImgValChange,
  onSaveEditImg,
  onCancelEditImg,
}: HanfuListProps) {
  return (
    <>
      {/* Hero Banner */}
      <div className="hanfu-hero relative rounded-2xl overflow-hidden p-6 md:p-10 text-center border border-amber-200/15" style={costumeHeroStyle}>
        <div className="relative z-10">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[1.4rem] border border-amber-100/25 bg-white/10 shadow-2xl shadow-amber-500/20 backdrop-blur-xl">
            <span className="text-4xl">👘</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">戏服租赁馆</h1>
          <p className="text-sm text-white/60 mb-3">青衣 · 花旦 · 老生 · 武生 · 净角 | 多款晋剧戏服可选，到店免费试穿</p>
          <div className="flex justify-center gap-3 text-xs text-white/40">
            <span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />租金 ¥58/天起</span>
            <span className="flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" />押金可退</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {styles.map(s => (
          <button key={s} onClick={() => onStyleChange(s)}
            className={`rounded-2xl px-4 py-2 text-sm font-medium transition-all ${activeStyle === s ? 'bg-amber-500/30 text-amber-300' : 'glass-control text-white/60 hover:text-white'}`}>{s}</button>
        ))}
      </div>
      <div className="flex gap-2">
        {[{ k: '', l: '全部' }, { k: '女', l: '👩 女款' }, { k: '男', l: '👨 男款' }, { k: '中性', l: '⚤ 中性' }].map(g => (
          <button key={g.k} onClick={() => onGenderChange(g.k)}
            className={`flex-1 rounded-2xl px-4 py-2.5 text-sm font-medium transition-all ${activeGender === g.k ? 'bg-amber-500/30 text-amber-300' : 'glass-control text-white/60 hover:text-white'}`}>{g.l}</button>
        ))}
      </div>

      {/* FAQ */}
      <div className="rounded-2xl glass-panel p-3 cursor-pointer" onClick={onToggleFaq}>
        <div className="flex justify-between items-center text-sm text-white/70">
          <span>📋 租赁须知 & FAQ</span>
          <span className="text-white/40">{showFaq ? '▲' : '▼'}</span>
        </div>
      </div>
      {showFaq && (
        <div className="rounded-2xl glass-panel p-4 space-y-3">
          {faqList.map((f, i) => (
            <details key={i} className="text-sm">
              <summary className="text-white/80 cursor-pointer py-1 font-medium">{f.q}</summary>
              <p className="text-white/50 mt-1 pl-4">{f.a}</p>
            </details>
          ))}
        </div>
      )}

      {/* Product grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredList.map((item, i) => (
          <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            onClick={() => onSelectItem(item)} className="group cursor-pointer">
            <div className="glass-panel rounded-2xl overflow-hidden transition-all group-hover:scale-[1.02]">
              <div className="relative h-48 flex items-center justify-center" style={{ background: item.coverUrl ? 'transparent' : coverGradient(item.coverIdx) }}>
                {item.coverUrl ? <img src={item.coverUrl} alt={item.name} className="w-full h-full object-cover" style={{ objectPosition: coverObjectPosition(item.id) }} /> : <span className="text-6xl" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}>👘</span>}
                {/* Admin edit overlay */}
                {isAdmin && editImgId === item.id ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/92 backdrop-blur-sm gap-2 p-3 z-20" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-2 w-full">
                      <input value={editImgVal} onChange={e => onEditImgValChange(e.target.value)} placeholder="粘贴图片URL地址"
                        className="flex-1 rounded-lg px-3 py-2 text-xs text-white bg-white/10 border border-white/15 outline-none focus:border-amber-500/50" />
                      <label className="shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs cursor-pointer bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-medium">
                        <span>📁 选文件</span>
                        <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (!f) return; if (f.size > 5 * 1024 * 1024) { alert('图片不能超过5MB'); return } const r = new FileReader(); r.onload = () => onEditImgValChange(r.result as string); r.readAsDataURL(f); uploadFile(f, `hanfu/${editImgId || Date.now()}.jpg`).then(url => { if (url) onEditImgValChange(url) }).catch(() => {}) }} />
                      </label>
                    </div>
                    {editImgVal && (
                      <div className="relative w-full h-24 flex items-center justify-center bg-black/40 rounded-lg mb-1">
                        <img src={editImgVal} alt="预览" className="max-w-full max-h-full rounded object-contain" />
                        <button onClick={e => { e.stopPropagation(); onEditImgValChange('') }} className="absolute top-1 right-1 rounded-full bg-red-500/80 w-5 h-5 flex items-center justify-center text-white text-xs z-10">×</button>
                      </div>
                    )}
                    <div className="flex gap-2 w-full">
                      <button onClick={e => { e.stopPropagation(); onSaveEditImg() }} disabled={!editImgVal.trim()}
                        className="flex-1 rounded-lg py-2 text-xs font-bold bg-green-500/30 text-green-300 disabled:opacity-30 hover:bg-green-500/40">✅ 保存</button>
                      <button onClick={e => { e.stopPropagation(); onCancelEditImg() }}
                        className="rounded-lg px-4 py-2 text-xs text-white/50 glass-control">取消</button>
                    </div>
                  </div>
                ) : isAdmin && (
                  <button onClick={e => { e.stopPropagation(); onStartEditImg(item.id, item.coverUrl || '') }}
                    className="absolute bottom-3 right-12 rounded-lg bg-black/60 hover:bg-black/80 p-2 text-white/70 hover:text-amber-400 transition-all" title="自定义图片">
                    <Edit className="h-4 w-4" />
                  </button>
                )}
                <span className="absolute top-3 left-3 rounded-lg bg-black/50 px-2.5 py-1 text-xs text-white">{item.style}</span>
                <span className="absolute top-3 right-3 rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold"
                  style={{ background: item.gender === '男' ? '#409EFF' : item.gender === '女' ? '#F56C6C' : '#909399', color: '#fff' }}>
                  {item.gender === '男' ? '♂' : item.gender === '女' ? '♀' : '⚤'}
                </span>
                {item.tags.includes('爆款') && <span className="absolute bottom-3 left-3 rounded-lg bg-red-500/80 px-2 py-0.5 text-xs text-white">🔥 爆款</span>}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-white/90 group-hover:text-amber-400">{item.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-xl font-bold text-amber-400">¥{item.pricePerDay}</span>
                  <span className="text-xs text-white/40">/天</span>
                  <span className="ml-auto text-xs text-white/30">押金 ¥{item.deposit}</span>
                </div>
                <div className="mt-2 flex justify-between text-xs text-white/40">
                  <span>{item.sizes.join('/')}</span>
                  <span>已租 {item.sales}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {item.tags.slice(0, 2).map(t => <span key={t} className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-white/50">#{t}</span>)}
                </div>
                <button onClick={e => { e.stopPropagation(); onSelectItem(item) }}
                  className="mt-3 w-full rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 py-2 text-sm font-bold text-amber-300">查看详情</button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      {filteredList.length === 0 && <div className="py-20 text-center text-white/40"><Search className="h-12 w-12 mx-auto mb-4 opacity-30" /><p>暂无匹配戏服</p></div>}
    </>
  )
}
