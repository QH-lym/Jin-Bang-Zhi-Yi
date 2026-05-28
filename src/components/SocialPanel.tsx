import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, Heart, MessageCircle } from 'lucide-react'

export type Comment = { id?: number; author: string; text: string; avatar?: string; createdAt?: string }

export type Post = {
  id: number; author: string; avatar: string; level: string; topic: string; type: string
  replies: number; likes: number; time: string; tags: string[]; content: string; comments?: Comment[]
}

export default function SocialPanel({ query, onQueryChange, posts, selectedType, onTypeChange, types, likedPosts, onToggleLike, onSelectPost, onPublish, onDeletePost, isAdmin }: {
  query: string; onQueryChange: (v: string) => void; posts: Post[]; selectedType: string; onTypeChange: (v: string) => void
  types: string[]; likedPosts: Set<number>; onToggleLike: (id: number) => void
  onSelectPost: (p: Post) => void; onPublish: (content: string, topic: string, type: string) => void
  onDeletePost: (id: number) => void; isAdmin: boolean
}) {
  const [showPublish, setShowPublish] = useState(false)
  const [pubContent, setPubContent] = useState('')
  const [pubTopic, setPubTopic] = useState('')
  const [pubType, setPubType] = useState('分享')
  const filtered = posts.filter(p => { const m1 = selectedType === '全部' || p.type === selectedType; const m2 = !query || p.content.includes(query) || p.topic.includes(query) || p.author.includes(query); return m1 && m2 })
  const handlePublish = () => { if (!pubContent.trim()) return; onPublish(pubContent.trim(), pubTopic.trim(), pubType); setPubContent(''); setPubTopic(''); setPubType('分享'); setShowPublish(false) }
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-lg"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" /><input value={query} onChange={e => onQueryChange(e.target.value)} placeholder="搜索动态..." className="w-full rounded-xl pl-12 pr-4 py-3 text-white outline-none placeholder-white/40 glass-control" /></div>
        <button onClick={() => setShowPublish(true)} className="inline-flex items-center gap-2 rounded-xl bg-amber-500/20 px-5 py-3 text-sm font-bold text-amber-300 hover:bg-amber-500/30"><Plus className="h-4 w-4" />发布动态</button>
      </div>
      <AnimatePresence>
        {showPublish && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setShowPublish(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-lg rounded-3xl bg-[#090507] p-6 glass-window" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-white mb-4">发布动态</h3>
              <input value={pubTopic} onChange={e => setPubTopic(e.target.value)} placeholder="标题（可选）" className="w-full rounded-xl px-4 py-2.5 mb-3 text-sm text-white glass-control" />
              <textarea value={pubContent} onChange={e => setPubContent(e.target.value)} placeholder="分享你的想法..." className="w-full rounded-xl px-4 py-2.5 mb-3 text-sm text-white glass-control min-h-[120px] resize-none" />
              <div className="flex gap-2 mb-4">{types.filter(t => t !== '全部').map(t => (<button key={t} onClick={() => setPubType(t)} className={`rounded-xl px-3 py-1.5 text-xs ${pubType === t ? 'bg-amber-500/30 text-amber-300' : 'glass-control text-white/60'}`}>{t}</button>))}</div>
              <div className="flex gap-2"><button onClick={() => setShowPublish(false)} className="flex-1 rounded-xl py-2.5 glass-control text-sm text-white/60">取消</button><button onClick={handlePublish} className="flex-1 rounded-xl py-2.5 bg-amber-500/20 text-sm font-bold text-amber-300">发布</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex gap-2 overflow-x-auto">{types.map(t => (<button key={t} onClick={() => onTypeChange(t)} className={`shrink-0 rounded-xl px-4 py-2 text-sm transition-all ${selectedType === t ? 'bg-amber-500/30 text-amber-300' : 'glass-control text-white/60'}`}>{t}</button>))}</div>
      <div className="space-y-4">
        {filtered.map(post => {
          const liked = likedPosts.has(post.id)
          const likeCount = post.likes + (liked ? 1 : 0)
          const commentCount = Math.max(post.replies, post.comments?.length || 0)
          return (
          <div key={post.id} onClick={() => onSelectPost(post)} className="glass-panel rounded-xl p-5 cursor-pointer hover:border-amber-500/20 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{post.avatar}</span>
              <div className="flex-1"><div className="flex items-center gap-2"><span className="font-semibold text-white/90">{post.author}</span><span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/50">{post.level}</span></div><div className="text-xs text-white/40 mt-0.5">{post.time}</div></div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300">{post.type}</span>
              {isAdmin && <button onClick={(e) => { e.stopPropagation(); if (confirm('确定删除这条动态？')) onDeletePost(post.id) }} className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20">删除</button>}
            </div>
            <h4 className="font-bold text-white/85 mb-2">{post.topic}</h4>
            <p className="text-sm text-white/60 line-clamp-3">{post.content}</p>
            <div className="flex items-center gap-2 mt-3 flex-wrap">{post.tags.map(t => <span key={t} className="text-xs text-amber-400/60">#{t}</span>)}</div>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/10 text-xs text-white/40">
              <button onClick={(e) => { e.stopPropagation(); onToggleLike(post.id) }} className={`flex items-center gap-1 ${liked ? 'text-red-400' : 'hover:text-white/60'}`}><Heart className={`h-3.5 w-3.5 ${liked ? 'fill-red-400' : ''}`} />{likeCount}</button>
              <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" />{commentCount}</span>
            </div>
          </div>
          )
        })}
      </div>
    </div>
  )
}
