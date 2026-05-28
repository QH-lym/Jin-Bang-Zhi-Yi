import { Suspense, lazy, useMemo, useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  BookOpen,
  Camera,
  GraduationCap,
  Heart,
  LogOut,
  MapPin,
  MessageCircle,
  Palette,
  Search,
  ShieldCheck,
  ShoppingBag,
  Shield,
  Sparkles,
  Theater,
  Users,
  Wand2,
} from 'lucide-react'
import { Account } from '../accountStore'
import { ModuleFallback, ModuleErrorBoundary } from './ErrorBoundary'
import SocialPanel, { type Post, type Comment } from './SocialPanel'
import CoursePanel, { type Course, type NewCourse, courseCover, courses } from './CoursePanel'

const ShopPanel = lazy(() => import('./ShopPanel'))
const SalesFlowMap = lazy(() => import('./SalesFlowMap'))
const OperaMap = lazy(() => import('./OperaMap'))
const AIChat = lazy(() => import('./AIChat'))
const FaceWorkshop = lazy(() => import('./face-workshop'))
const HanfuRental = lazy(() => import('./hanfu-rental'))
const AdminDashboard = lazy(() => import('./AdminDashboard'))
const WatchPanel = lazy(() => import('./WatchPanel'))
const UserSettingsModal = lazy(() => import('./UserSettingsModal'))
const logoUrl = `${import.meta.env.BASE_URL}logo.png`

// 模块预加载映射表
const modulePreloadMap: Record<TabId, () => Promise<unknown>> = {
  watch: () => import('./WatchPanel'),
  study: () => import('./hanfu-rental'),
  shop: () => import('./ShopPanel'),
  course: () => Promise.resolve(), // 内联组件，无需预加载
  social: () => Promise.resolve(), // 内联组件，无需预加载
  map: () => import('./OperaMap'),
  chat: () => import('./AIChat'),
  face: () => import('./face-workshop'),
  admin: () => import('./AdminDashboard'),
}

// 预加载函数
function preloadModule(tabId: TabId) {
  const preloadFn = modulePreloadMap[tabId]
  if (preloadFn) {
    preloadFn().catch(() => {}) // 静默处理预加载错误
  }
}

type TabId = 'watch' | 'study' | 'shop' | 'course' | 'social' | 'map' | 'chat' | 'face' | 'admin'

const menuItems: Array<{ id: TabId; icon: typeof Theater; label: string }> = [
  { id: 'watch', icon: Theater, label: '演艺观赏' },
  { id: 'study', icon: Camera, label: '戏服租赁' },
  { id: 'shop', icon: ShoppingBag, label: '精品好物' },
  { id: 'course', icon: GraduationCap, label: '普惠教学' },
  { id: 'social', icon: Users, label: '文化社交' },
  { id: 'map', icon: MapPin, label: '戏曲地图' },
  { id: 'face', icon: Palette, label: '脸谱工坊' },
  { id: 'chat', icon: MessageCircle, label: '小e' },
  { id: 'admin', icon: Shield, label: '管理后台' },
]

const tabContent: Record<TabId, { title: string; subtitle: string }> = {
  watch: { title: '晋剧演艺观赏区', subtitle: '沉浸式数字剧场，经典剧目云端呈现' },
  study: { title: '戏服租赁馆', subtitle: '青衣/花旦/老生/武生戏服租赁与写真服务' },
  shop: { title: '精品好物市集', subtitle: '非遗手作，匠心传承' },
  course: { title: '普惠教学课堂', subtitle: '系统化课程，从零起步学习晋剧' },
  social: { title: '文化社交广场', subtitle: '戏迷社群，共话梨园' },
  map: { title: '戏曲文化线下地图', subtitle: '探访三晋戏台，感受现场梆子声腔' },
  face: { title: '戏曲脸谱创工坊', subtitle: '数字画笔绘制传统脸谱，感受戏曲色彩之美' },
  admin: { title: '管理员后台', subtitle: '用户 · 订单 · 内容管理' },
  chat: { title: '小e · AI助手', subtitle: '与智能助手对话，快速获取晋剧文化和文创推荐' },
}

const shopHeroProducts = [
  { name: '晋剧脸谱盲盒', image: new URL('../assets/products/product-1.png', import.meta.url).href },
  { name: '戏曲主题丝巾', image: new URL('../assets/products/product-5.png', import.meta.url).href },
  { name: '非遗陶瓷茶具套装', image: new URL('../assets/products/product-8.png', import.meta.url).href },
]

const socialPostsStorageKey = 'jinbang.social.posts'
const socialLikesStorageKey = (accountId: string) => `jinbang.social.likes.${accountId}`

function loadSocialPosts(): Post[] {
  try {
    const raw = localStorage.getItem(socialPostsStorageKey)
    if (!raw) return posts
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed as Post[] : posts
  } catch {
    return posts
  }
}

function loadLikedPosts(accountId: string): Set<number> {
  try {
    const raw = localStorage.getItem(socialLikesStorageKey(accountId))
    if (!raw) return new Set<number>()
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return new Set<number>()
    return new Set(parsed.filter((id): id is number => typeof id === 'number' && Number.isFinite(id)))
  } catch {
    return new Set<number>()
  }
}

function formatCommentTime(value?: string) {
  if (!value) return '刚刚'
  const time = new Date(value).getTime()
  if (!Number.isFinite(time)) return '刚刚'
  const diff = Date.now() - time
  if (diff < 60_000) return '刚刚'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}分钟前`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}小时前`
  return new Date(value).toLocaleDateString('zh-CN')
}

const posts: Post[] = [
  { id: 1, author: '梨园戏服社', avatar: '👗', level: '金牌社团', topic: '本周限定戏服写真套餐上线，赠送精修六张。', type: '活动', replies: 28, likes: 126, time: '2小时前', tags: ['戏服', '写真', '优惠'], content: '春季戏服写真季正式开启！提供青衣、花旦、武生等戏曲场景选择，专业摄影师团队，赠送6张精修照片。适合个人写真、情侣拍摄、研学活动等多种需求。预约从速！' },
  { id: 2, author: '晋风影像', avatar: '📸', level: '专业团队', topic: '寻求晋剧主题商业活动合作，现场布景与摄影支持。', type: '合作', replies: 17, likes: 88, time: '4小时前', tags: ['商业', '合作', '晋剧'], content: '我们团队专注于晋剧文化主题的商业活动拍摄，提供完整的现场布景搭建、专业灯光设备和后期制作服务。已合作多家品牌，期待与您携手打造精彩活动！' },
  { id: 3, author: '戏服租赁部', avatar: '👘', level: '认证商家', topic: '节日戏服租赁已开抢，大学生专属折扣。', type: '促销', replies: 9, likes: 64, time: '6小时前', tags: ['租赁', '折扣', '学生'], content: '清明节将至，戏服租赁优惠活动开启！大学生出示证件享8折优惠，青衣水袖、花旦云肩、公主蟒袍等新品上架，支持线上预订线下试穿。库存有限，先到先得！' },
  { id: 4, author: '梨园小戏迷', avatar: '🎭', level: '戏迷', topic: '分享我第一次观看晋剧的感受，太震撼了！', type: '分享', replies: 23, likes: 45, time: '8小时前', tags: ['初体验', '感受', '推荐'], content: '昨晚第一次去现场观看晋剧《打金枝》，演员们的唱腔身段都太精彩了！特别是老生那段唱腔，余音绕梁三日不绝。强烈推荐大家去现场感受传统文化的魅力！' },
  { id: 5, author: '戏曲研习者', avatar: '📚', level: '学者', topic: '讨论晋剧中"梆子腔"的音乐特色和传承意义', type: '讨论', replies: 31, likes: 67, time: '12小时前', tags: ['梆子腔', '音乐', '传承'], content: '梆子腔作为晋剧的灵魂，承载着丰富的音乐内涵。从节奏到旋律，都蕴含着深厚的文化底蕴。大家怎么看梆子腔在现代戏曲传承中的地位和作用？' },
  { id: 6, author: '晋韵票友团', avatar: '🎤', level: '票友组织', topic: '本周末票友聚会，欢迎新老票友加入！', type: '活动', replies: 15, likes: 38, time: '1天前', tags: ['聚会', '票友', '交流'], content: '晋韵票友团本周末举办月度聚会活动，内容包括唱段交流、身段练习和茶话会。无论你是资深票友还是戏曲爱好者，都欢迎前来参加！地址：山西大戏楼，时间：周六下午2点。' },
]

type NavigatePayload = {
  courseQuery?: string
  socialQuery?: string
  shopQuery?: string
  faceTemplate?: string
}

export default function Dashboard({
  currentAccount,
  accounts,
  onLogout,
}: {
  currentAccount: Account
  accounts: Account[]
  onLogout?: () => void
}) {
  const isAdmin = currentAccount.role === 'admin'
  const [activeTab, setActiveTab] = useState<TabId>('watch')
  const [likedPosts, setLikedPosts] = useState(() => loadLikedPosts(currentAccount.id))
  const [naviTemplate, setNaviTemplate] = useState<string | undefined>(undefined)
  const [shopEntryQuery, setShopEntryQuery] = useState('')
  const [globalQuery, setGlobalQuery] = useState('')
  const [recentActions, setRecentActions] = useState<string[]>(['演艺观赏', '戏服租赁', '精品好物'])
  const [accountInfo, setAccountInfo] = useState(currentAccount)
  const handleAccountUpdate = useCallback((updated: Account) => { setAccountInfo(updated) }, [])

  const [courseQuery, setCourseQuery] = useState('')
  const [selectedCourseCategory, setSelectedCourseCategory] = useState('全部')
  const [socialQuery, setSocialQuery] = useState('')
  const [selectedPostType, setSelectedPostType] = useState('全部')
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [showCourseDetail, setShowCourseDetail] = useState(false)
  const [coursesState, setCoursesState] = useState<Course[]>(courses)
  const [showAddCourse, setShowAddCourse] = useState(false)
  const [newCourse, setNewCourse] = useState<NewCourse>({ title: '', category: '基础课程', total: 8, teacher: '', teacherTitle: '', level: '入门', students: 0, rating: 4.5, description: '', tags: '' })
  const [postsState, setPostsState] = useState<Post[]>(() => loadSocialPosts())
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [showPostDetail, setShowPostDetail] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showAdminMenu, setShowAdminMenu] = useState(false)
  const [rentalOrderCount, setRentalOrderCount] = useState(0)

  useEffect(() => {
    // Load rental order count from Dexie instead of localStorage
    import('../db').then(m => m.default.rentalOrders.count())
      .then(setRentalOrderCount)
      .catch(() => {})
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(socialPostsStorageKey, JSON.stringify(postsState))
    } catch {
      // Ignore storage quota / privacy mode errors; in-memory state still works.
    }
  }, [postsState])

  useEffect(() => {
    try {
      localStorage.setItem(socialLikesStorageKey(accountInfo.id), JSON.stringify([...likedPosts]))
    } catch {
      // Ignore storage quota / privacy mode errors; in-memory state still works.
    }
  }, [accountInfo.id, likedPosts])

  const currentTab = tabContent[activeTab]

  const navigateTo = useCallback((tab: TabId, payload: NavigatePayload = {}) => {
    if (payload.courseQuery !== undefined) setCourseQuery(payload.courseQuery)
    if (payload.socialQuery !== undefined) setSocialQuery(payload.socialQuery)
    if (payload.shopQuery !== undefined) setShopEntryQuery(payload.shopQuery)
    if (payload.faceTemplate !== undefined) setNaviTemplate(payload.faceTemplate)
    setActiveTab(tab)
    setRecentActions(prev => [tabContent[tab].title.replace('区', '').replace('馆', '').replace('市集', ''), ...prev].slice(0, 3))
  }, [])

  // 智能预加载：当 activeTab 变化后，预加载相邻模块
  useEffect(() => {
    const tabOrder: TabId[] = ['watch', 'study', 'shop', 'course', 'social', 'map', 'chat', 'face']
    const currentIndex = tabOrder.indexOf(activeTab)
    if (currentIndex === -1) return

    // 延迟 2 秒后预加载相邻模块（避免影响当前模块加载）
    const timer = setTimeout(() => {
      // 预加载前一个模块
      if (currentIndex > 0) {
        preloadModule(tabOrder[currentIndex - 1])
      }
      // 预加载后一个模块
      if (currentIndex < tabOrder.length - 1) {
        preloadModule(tabOrder[currentIndex + 1])
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [activeTab])

  const handleGoToFace = useCallback((templateId: string) => navigateTo('face', { faceTemplate: templateId }), [navigateTo])

  const handleSmartSearch = useCallback(() => {
    const q = globalQuery.trim()
    if (!q) return
    if (/戏服|租|写真|服装/.test(q)) navigateTo('study')
    else if (/买|商品|文创|脸谱|盲盒|周边|礼物/.test(q)) navigateTo('shop', { shopQuery: q })
    else if (/课程|学|唱腔|身段|教学/.test(q)) navigateTo('course', { courseQuery: q })
    else if (/动态|社交|分享|活动|帖子/.test(q)) navigateTo('social', { socialQuery: q })
    else if (/地图|戏台|剧院|线下/.test(q)) navigateTo('map')
    else if (/脸谱|画|创作|关羽|包拯/.test(q)) navigateTo('face', { faceTemplate: 'jing' })
    else navigateTo('chat')
  }, [globalQuery, navigateTo])

  const courseCategories = useMemo(() => ['全部', ...Array.from(new Set(coursesState.map(c => c.category)))], [coursesState])
  const filteredCourses = useMemo(() => {
    return coursesState.filter(course => {
      const matchesCategory = selectedCourseCategory === '全部' || course.category === selectedCourseCategory
      const matchesQuery = course.title.toLowerCase().includes(courseQuery.toLowerCase()) || course.teacher.toLowerCase().includes(courseQuery.toLowerCase()) || course.tags.some(tag => tag.toLowerCase().includes(courseQuery.toLowerCase()))
      return matchesCategory && matchesQuery
    })
  }, [courseQuery, selectedCourseCategory])

  const postTypes = ['全部', '活动', '讨论', '分享', '合作', '促销']

  const handleSelectCourse = useCallback((course: Course) => { setSelectedCourse(course); setShowCourseDetail(true) }, [])
  const handleCloseCourseDetail = useCallback(() => { setShowCourseDetail(false); setSelectedCourse(null) }, [])
  const handleAddCourse = useCallback(() => {
    const title = newCourse.title.trim()
    if (!title || !newCourse.teacher.trim()) return
    setCoursesState(prev => [{ id: Date.now(), title, category: newCourse.category, total: Number(newCourse.total) || 8, done: 0, teacher: newCourse.teacher.trim(), teacherTitle: newCourse.teacherTitle.trim(), next: '新课导学', level: newCourse.level, students: Number(newCourse.students) || 0, rating: Number(newCourse.rating) || 4.5, description: newCourse.description.trim(), tags: newCourse.tags.split(',').map(t => t.trim()).filter(Boolean), image: courseCover(((prev.length % 6) + 1)), lessons: ['课程导学', '核心示范', '课后练习'], outcome: '完成一份学习作品' } as Course, ...prev])
    setShowAddCourse(false)
    setNewCourse({ title: '', category: '基础课程', total: 8, teacher: '', teacherTitle: '', level: '入门', students: 0, rating: 4.5, description: '', tags: '' })
  }, [newCourse])

  const handleToggleLike = useCallback((postId: number) => {
    setLikedPosts(prev => {
      const next = new Set(prev)
      if (next.has(postId)) next.delete(postId)
      else next.add(postId)
      return next
    })
  }, [])
  const handleAddComment = useCallback((postId: number, text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    const comment: Comment = {
      id: Date.now(),
      author: accountInfo.displayName || accountInfo.username || '我',
      avatar: accountInfo.avatar,
      text: trimmed,
      createdAt: new Date().toISOString(),
    }
    setPostsState(prev => prev.map(p => p.id === postId ? { ...p, replies: p.replies + 1, comments: [...(p.comments || []), comment] } : p))
  }, [accountInfo])
  const handlePublishPost = useCallback((content: string, topic: string, type: string) => {
    setPostsState(prev => [{ id: Date.now(), author: accountInfo.displayName || accountInfo.username, avatar: accountInfo.avatar || '👤', level: '用户', topic: topic || content.slice(0, 30), type, replies: 0, likes: 0, time: '刚刚', tags: [], content, comments: [] } as Post, ...prev])
  }, [accountInfo])
  const handleDeletePost = useCallback((id: number) => {
    setPostsState(prev => prev.filter(x => x.id !== id))
    setLikedPosts(prev => {
      if (!prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    if (selectedPost?.id === id) {
      setSelectedPost(null)
      setShowPostDetail(false)
    }
  }, [selectedPost?.id])
  const activePost = useMemo(() => selectedPost ? postsState.find(p => p.id === selectedPost.id) ?? selectedPost : null, [postsState, selectedPost])

  return (
    <div className="ios-app-bg flex min-h-full flex-col lg:h-full lg:overflow-hidden">
      {/* ===== HEADER BAR (all screen sizes) ===== */}
      <header className="sticky top-0 z-50 flex shrink-0 items-center ios-topbar px-3 lg:px-6">
        {/* LOGO */}
        <div className="flex items-center gap-2.5 mr-4">
          <img src={logoUrl} alt="晋梆智绎" className="brand-mark h-9 w-9 rounded-xl" />
          <div className="hidden sm:block">
            <span className="block text-base font-bold text-amber-100">晋梆智绎</span>
            <span className="block text-[11px] text-white/38">三晋非遗数字平台</span>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 ml-auto">
          {isAdmin && <button onClick={() => setShowAdminMenu(!showAdminMenu)}
            className={`ios-touch ios-focus-ring flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${showAdminMenu ? 'bg-white/[0.16] text-amber-100' : 'bg-white/10 text-amber-200 hover:bg-white/[0.16]'}`}>
            <ShieldCheck className="h-3.5 w-3.5" />管理
          </button>}
          <div className="ios-touch ios-focus-ring flex items-center gap-1.5 rounded-full px-1.5 py-1 text-xs text-white/60 cursor-pointer hover:bg-white/[0.08] hover:text-white/[0.82] transition-all" onClick={() => setShowSettings(true)}>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-300 via-orange-500 to-red-600 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden ring-1 ring-white/20">
              {accountInfo.avatar ? <img src={accountInfo.avatar} className="w-full h-full object-cover" /> : (accountInfo.displayName?.[0] || 'U')}
            </div>
            <span className="hidden sm:inline">{accountInfo.displayName || accountInfo.username}</span>
          </div>
          {onLogout && <button onClick={onLogout} className="ios-touch ios-focus-ring rounded-full p-2 text-xs text-white/35 hover:bg-white/[0.08] hover:text-red-300 ml-1"><LogOut className="h-3.5 w-3.5" /></button>}
        </div>
      </header>

      {/* Admin quick panel */}
      <AnimatePresence>
        {showAdminMenu && isAdmin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50" onClick={() => setShowAdminMenu(false)}>
            <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="absolute top-[calc(3.75rem+env(safe-area-inset-top)+0.5rem)] right-4 w-64 glass-window rounded-3xl p-4 shadow-2xl border border-white/12">
              <div className="text-sm font-bold text-amber-300 mb-3">⚡ 管理员快捷面板</div>
            <div className="space-y-1">
              {[
                { t: 'watch', icon: '🎭', label: '添加剧目' },
                { t: 'study', icon: '👘', label: '管理戏服租赁' },
                { t: 'course', icon: '📖', label: '添加课程' },
                { t: 'social', icon: '💬', label: '管理动态' },
                { t: 'shop', icon: '🛍️', label: '管理商品' },
              ].map(({ t, icon, label }) => (
                <button key={t} onClick={() => { navigateTo(t as TabId); setShowAdminMenu(false) }}
                  className="ios-touch ios-focus-ring w-full flex items-center gap-2 rounded-2xl px-3 py-2 text-sm text-white/70 hover:bg-white/[0.08] hover:text-amber-200 transition-all">
                  <span>{icon}</span><span>{label}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setShowAdminMenu(false)}
              className="ios-touch ios-focus-ring w-full mt-3 rounded-2xl glass-control py-2 text-xs text-white/60">关闭</button>
            <div className="mt-3 pt-3 border-t border-white/10 text-xs text-white/40">
              <span>租赁订单总数：{rentalOrderCount} 笔</span>
            </div>
          </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Nav */}
      <nav className="fixed z-40 flex justify-around ios-tabbar px-1 py-1 lg:hidden">
        {menuItems.filter(item => item.id !== 'admin' || isAdmin).map(item => (
          <button
            key={item.id}
            onClick={() => navigateTo(item.id)}
            onMouseEnter={() => preloadModule(item.id)}
            onTouchStart={() => preloadModule(item.id)}
            className={`ios-touch ios-focus-ring flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-2xl text-[10px] transition-all ${activeTab === item.id ? 'nav-active' : 'text-white/48 hover:text-white/80 hover:bg-white/[0.06]'}`}>
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Body: sidebar + main + right sidebar */}
      <div className="min-h-0 flex-1 pb-24 lg:flex lg:overflow-hidden lg:pb-0">
        {/* Desktop Sidebar */}
        <aside className="ios-sidebar hidden lg:flex lg:w-56 lg:flex-col lg:overflow-y-auto text-white">
          <nav className="flex-1 px-3 pt-5 space-y-1">
            {menuItems.filter(item => item.id !== 'admin' || isAdmin).map(item => (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id)}
                onMouseEnter={() => preloadModule(item.id)}
                className={`ios-touch ios-focus-ring flex items-center gap-3 w-full rounded-2xl px-4 py-3 text-sm font-medium transition-all ${activeTab === item.id ? 'nav-active' : 'text-white/[0.52] hover:text-white/[0.86] hover:bg-white/[0.07]'}`}>
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="ios-main min-w-0 flex-1 overflow-y-auto rounded-[2rem] mx-2 my-2 text-white">
          <div className="p-3 sm:p-4 lg:p-7">
            {/* Tab Header Card */}
            <div className="ios-hero p-5 sm:p-6 mb-5">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <div className="section-kicker mb-3 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[11px]">
                    <Sparkles className="h-3.5 w-3.5" />
                    模块联动 · 最近访问 {recentActions.join(' / ')}
                  </div>
                  <h2 className="text-2xl font-bold text-white sm:text-3xl">{currentTab.title}</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/58">{currentTab.subtitle}</p>
                  {activeTab === 'shop' && (
                    <div className="mt-4 grid max-w-xl grid-cols-3 gap-2" aria-label="精品好物配图">
                      {shopHeroProducts.map(item => (
                        <div key={item.name} className="aspect-[4/3] overflow-hidden rounded-2xl bg-black/20 ring-1 ring-white/10">
                          <img src={item.image} alt={item.name} className="h-full w-full object-contain" loading="lazy" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex w-full max-w-xl flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                    <input
                      value={globalQuery}
                      onChange={e => setGlobalQuery(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleSmartSearch() }}
                      placeholder="搜索课程、文创、戏服、戏台..."
                      className="ios-focus-ring w-full rounded-2xl pl-11 pr-4 py-3 text-sm text-white outline-none placeholder-white/35 glass-control"
                    />
                  </div>
                  <button onClick={handleSmartSearch} className="ios-touch ios-focus-ring inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-400/18 px-5 py-3 text-sm font-bold text-amber-100 hover:bg-amber-400/24">
                    智能前往
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <ConnectedHub activeTab={activeTab} onNavigate={navigateTo} />

            {/* Tab Content Wrapper */}
            <div className="ios-content p-4 sm:p-5 lg:p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <ModuleErrorBoundary key={activeTab} moduleName={currentTab.title}>
                    <Suspense fallback={<ModuleFallback />}>
                      {activeTab === 'watch' && <WatchPanel isAdmin={isAdmin} />}
                      {activeTab === 'study' && <HanfuRental currentAccount={accountInfo} />}
                      {activeTab === 'shop' && (<div className="space-y-5"><ShopPanel currentAccount={accountInfo} initialQuery={shopEntryQuery} /><SalesFlowMap /></div>)}
                      {activeTab === 'chat' && <AIChat />}
                      {activeTab === 'course' && <CoursePanel query={courseQuery} onQueryChange={setCourseQuery} selectedCategory={selectedCourseCategory} onCategoryChange={setSelectedCourseCategory} courses={filteredCourses} categories={courseCategories} onSelectCourse={handleSelectCourse} isAdmin={isAdmin} showAddCourse={showAddCourse} onToggleAddCourse={() => setShowAddCourse(p => !p)} newCourse={newCourse} onNewCourseChange={setNewCourse} onAddCourse={handleAddCourse} />}
                      {activeTab === 'social' && <SocialPanel query={socialQuery} onQueryChange={setSocialQuery} posts={postsState} selectedType={selectedPostType} onTypeChange={setSelectedPostType} types={postTypes} likedPosts={likedPosts} onToggleLike={handleToggleLike} onSelectPost={(p) => { setSelectedPost(p); setShowPostDetail(true) }} onPublish={handlePublishPost} onDeletePost={handleDeletePost} isAdmin={isAdmin} />}
                      {activeTab === 'map' && <OperaMap onExploreFace={handleGoToFace} />}
                      {activeTab === 'face' && <FaceWorkshop initialTemplate={naviTemplate} onViewShop={(query) => navigateTo('shop', { shopQuery: query })} />}
                      {activeTab === 'admin' && isAdmin && <AdminDashboard />}
                      {activeTab === 'admin' && !isAdmin && <div className="py-20 text-center text-white/30"><Shield className="h-12 w-12 mx-auto mb-3 opacity-30" /><p className="text-sm">仅管理员可访问</p></div>}
                    </Suspense>
                  </ModuleErrorBoundary>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </main>

        {/* Desktop Right Sidebar */}
        <aside className="ios-sidebar hidden xl:flex xl:w-72 xl:flex-col xl:overflow-y-auto p-4 text-white">
          <div className="space-y-5">
            {/* Cross-module recommendations */}
            <CrossRecommendations activeTab={activeTab} onNavigate={(tab) => navigateTo(tab)} />
            {/* My stats */}
            <div className="ios-content p-4">
              <h3 className="text-sm font-semibold text-white/70 mb-3">👤 我的</h3>
              <div className="space-y-2">
                <button onClick={() => setShowSettings(true)}
                  className="ios-touch ios-focus-ring w-full flex items-center gap-2 rounded-2xl px-3 py-2 text-sm text-white/60 hover:text-amber-200 hover:bg-white/[0.08] transition-all">
                  👤 个人资料
                </button>
                <button onClick={() => navigateTo('study')}
                  className="ios-touch ios-focus-ring w-full flex items-center gap-2 rounded-2xl px-3 py-2 text-sm text-white/60 hover:text-amber-200 hover:bg-white/[0.08] transition-all">
                  👘 租赁戏服
                </button>
                <button onClick={() => navigateTo('course')}
                  className="ios-touch ios-focus-ring w-full flex items-center gap-2 rounded-2xl px-3 py-2 text-sm text-white/60 hover:text-amber-200 hover:bg-white/[0.08] transition-all">
                  📖 学习课程
                </button>
                <button onClick={() => navigateTo('social')}
                  className="ios-touch ios-focus-ring w-full flex items-center gap-2 rounded-2xl px-3 py-2 text-sm text-white/60 hover:text-amber-200 hover:bg-white/[0.08] transition-all">
                  💬 发布动态
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showPostDetail && activePost && <PostDetailPanel post={activePost} currentAccount={accountInfo} isLiked={likedPosts.has(activePost.id)} likeCount={activePost.likes + (likedPosts.has(activePost.id) ? 1 : 0)} onClose={() => setShowPostDetail(false)} onToggleLike={handleToggleLike} onAddComment={handleAddComment} />}
        {showCourseDetail && selectedCourse && <CourseDetailPanel course={selectedCourse} onClose={handleCloseCourseDetail} />}
        {showSettings && <UserSettingsModal account={accountInfo} accountsSnapshot={accounts} onClose={() => setShowSettings(false)} onUpdate={handleAccountUpdate} />}
      </AnimatePresence>

      {/* 备案号 */}
      <BeianFooter />
    </div>
  )
}


function ConnectedHub({ activeTab, onNavigate }: { activeTab: TabId; onNavigate: (tab: TabId, payload?: NavigatePayload) => void }) {
  const flows: Array<{ from: TabId; icon: typeof Theater; title: string; desc: string; action: string; target: TabId; payload?: NavigatePayload }> = [
    { from: 'watch', icon: BookOpen, title: '看完去学', desc: '把剧目里的身段、唱腔接到课程练习', action: '打开身段课', target: 'course', payload: { courseQuery: '身段' } },
    { from: 'course', icon: Palette, title: '学完实操', desc: '化妆造型课后直接进入脸谱工坊', action: '开始画脸谱', target: 'face', payload: { faceTemplate: 'jing' } },
    { from: 'face', icon: ShoppingBag, title: '作品变周边', desc: '按当前角色搜索脸谱、盲盒和文创', action: '找脸谱文创', target: 'shop', payload: { shopQuery: '脸谱' } },
    { from: 'shop', icon: Camera, title: '搭配租赁', desc: '文创、服饰和写真服务连成套餐', action: '租一套戏服', target: 'study' },
    { from: 'study', icon: Users, title: '晒出造型', desc: '租赁后去文化广场发布穿搭动态', action: '发布分享', target: 'social', payload: { socialQuery: '戏服' } },
    { from: 'social', icon: MapPin, title: '线下相见', desc: '从活动帖子找到附近戏台和剧院', action: '看线下地图', target: 'map' },
    { from: 'map', icon: Theater, title: '回到剧场', desc: '选好地点后继续浏览近期演出', action: '看演艺', target: 'watch' },
    { from: 'chat', icon: Wand2, title: '问完即行动', desc: '让小e给建议，再进入课程或商城验证', action: '去课程', target: 'course', payload: { courseQuery: '入门' } },
  ]
  const primary = flows.find(item => item.from === activeTab) || flows[0]
  const quick = [
    { label: '演艺到课程', target: 'course' as TabId, payload: { courseQuery: '晋剧' }, icon: Theater },
    { label: '脸谱到文创', target: 'shop' as TabId, payload: { shopQuery: '脸谱' }, icon: Palette },
    { label: '戏服到社交', target: 'social' as TabId, payload: { socialQuery: '戏服' }, icon: Camera },
    { label: '地图到工坊', target: 'face' as TabId, payload: { faceTemplate: 'guanyu' }, icon: MapPin },
  ]

  return (
    <div className="mb-5 grid gap-3 lg:grid-cols-[1.2fr_2fr]">
      <button
        onClick={() => onNavigate(primary.target, primary.payload)}
        className="glass-panel rounded-xl p-4 text-left transition-all hover:border-amber-400/30"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300">
            <primary.icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-white">{primary.title}</div>
            <div className="mt-1 text-xs leading-relaxed text-white/45">{primary.desc}</div>
            <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-amber-300">
              {primary.action}
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </button>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {quick.map(item => (
          <button
            key={item.label}
            onClick={() => onNavigate(item.target, item.payload)}
            className="glass-control rounded-xl p-3 text-left hover:border-amber-500/25"
          >
            <item.icon className="mb-2 h-4 w-4 text-amber-300/80" />
            <div className="text-xs font-semibold text-white/80">{item.label}</div>
            <div className="mt-1 text-[11px] text-white/35">一键带入上下文</div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Post Detail Panel ───
function PostDetailPanel({
  post,
  currentAccount,
  isLiked,
  likeCount,
  onClose,
  onToggleLike,
  onAddComment,
}: {
  post: Post
  currentAccount: Account
  isLiked: boolean
  likeCount: number
  onClose: () => void
  onToggleLike: (postId: number) => void
  onAddComment: (postId: number, text: string) => void
}) {
  const [commentText, setCommentText] = useState('')
  const comments = post.comments || []
  const commentCount = Math.max(post.replies, comments.length)
  const currentName = currentAccount.displayName || currentAccount.username || '我'
  const submit = () => {
    const text = commentText.trim()
    if (!text) return
    onAddComment(post.id, text)
    setCommentText('')
  }
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <motion.aside initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ type: 'spring', stiffness: 260, damping: 28 }} className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#090507] p-6 glass-window" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <div className="font-bold text-amber-300">{post.author}</div>
            <h2 className="mt-2 text-2xl font-bold text-white">{post.topic}</h2>
            <p className="mt-3 text-white/70">{post.content}</p>
          </div>
          <button onClick={onClose} className="rounded-xl px-4 py-2 text-sm text-white/70 glass-control hover:text-white">关闭</button>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3 border-y border-white/10 py-3 text-sm text-white/55">
          <button onClick={() => onToggleLike(post.id)} className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 transition-all ${isLiked ? 'bg-red-500/15 text-red-300' : 'glass-control hover:text-red-200'}`}>
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-400 text-red-400' : ''}`} />
            {isLiked ? '已点赞' : '点赞'} {likeCount}
          </button>
          <span className="inline-flex items-center gap-1.5">
            <MessageCircle className="h-4 w-4" />
            {commentCount} 条评论
          </span>
        </div>
        <div className="mt-6">
          <div className="text-sm text-white/60 mb-2">评论</div>
          <div className="space-y-3">
            {comments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm text-white/35">暂无评论，来留下第一条想法。</div>
            ) : comments.map((c, i) => {
              const imageAvatar = !!c.avatar && /^(data:|https?:|blob:)/.test(c.avatar)
              return (
                <div key={c.id ?? `${c.author}-${i}`} className="rounded-xl p-3 bg-white/5 text-white/75">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-amber-500/20 text-sm text-amber-100 flex items-center justify-center">
                      {imageAvatar ? <img src={c.avatar} alt="" className="h-full w-full object-cover" /> : (c.avatar || c.author.slice(0, 1) || '我')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-medium">{c.author}</div>
                        <span className="text-xs text-white/35">{formatCommentTime(c.createdAt)}</span>
                      </div>
                      <div className="text-sm mt-1 leading-6 text-white/70">{c.text}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-4">
            <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} className="w-full resize-none rounded-xl px-4 py-3 bg-black/20 text-white outline-none placeholder-white/35 focus:ring-1 focus:ring-amber-400/40" rows={3} maxLength={240} placeholder="写下你的评论" />
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-xs text-white/35">以 {currentName} 发表评论 · {commentText.length}/240</span>
              <button onClick={submit} disabled={!commentText.trim()} className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-45">发表评论</button>
            </div>
          </div>
        </div>
      </motion.aside>
    </motion.div>
  )
}

// ─── Course Detail Panel ───
function CourseDetailPanel({ course, onClose }: { course: Course; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <motion.aside initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ type: 'spring', stiffness: 260, damping: 28 }} className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#090507] p-5 glass-window" onClick={(e) => e.stopPropagation()}>
        <div className="grid gap-5 md:grid-cols-[1.05fr_1fr]">
          <img src={course.image || courseCover(1)} alt={course.title} className="h-64 w-full rounded-2xl object-cover border border-white/10" />
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-amber-100">{course.category}</span>
                <h2 className="mt-3 text-2xl font-bold text-white">{course.title}</h2>
                <div className="text-sm text-white/60 mt-2">讲师：{course.teacher} · {course.teacherTitle}</div>
              </div>
              <button onClick={onClose} className="rounded-xl px-4 py-2 text-sm text-white/70 glass-control hover:text-white">关闭</button>
            </div>
            <p className="mt-4 text-sm leading-7 text-white/70">{course.description}</p>
            <div className="mt-4 rounded-2xl bg-white/5 p-4">
              <div className="text-sm font-semibold text-white/75">课程内容</div>
              <div className="mt-3 grid gap-2">
                {course.lessons.map((lesson, i) => <div key={lesson} className="flex items-center gap-2 text-sm text-white/60"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-xs text-amber-200">{i + 1}</span>{lesson}</div>)}
              </div>
            </div>
            <div className="mt-3 rounded-2xl bg-amber-500/10 p-4 text-sm text-amber-100">学习成果：{course.outcome}</div>
          </div>
        </div>
      </motion.aside>
    </motion.div>
  )
}

// ─── 备案号 Footer ───
function BeianFooter() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-30 py-2 px-4 text-center text-[11px] text-white/30 bg-black/40 backdrop-blur-sm border-t border-white/5">
      <div className="flex items-center justify-center gap-4 flex-wrap">
        <span>晋ICP备2026006293号-1</span>
        <span className="hidden sm:inline">|</span>
        <a
          href="https://beian.miit.gov.cn/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-amber-300/70 transition-colors"
        >
          工信部备案
        </a>
        <span className="hidden sm:inline">|</span>
        <a
          href="https://www.beian.gov.cn/portal/registerSystemInfo?recordcode=14070002000082"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 hover:text-amber-300/70 transition-colors"
        >
          <Shield className="h-3 w-3" />
          晋公网安备14070002000082号
        </a>
      </div>
    </footer>
  )
}

// ─── Cross-module Recommendation Engine ───
function CrossRecommendations({ activeTab, onNavigate }: { activeTab: TabId; onNavigate: (tab: TabId) => void }) {
  const recs: Record<TabId, { icon: string; label: string; desc: string; target: TabId }[]> = {
    watch: [
      { icon: '📖', label: '学身段', desc: '王老师《晋剧身段入门》12节课', target: 'course' },
      { icon: '👘', label: '租戏服', desc: '公主蟒袍·凤穿牡丹 ¥138/天', target: 'study' },
      { icon: '🎨', label: '画脸谱', desc: '数字画笔绘制《打金枝》脸谱', target: 'face' },
    ],
    study: [
      { icon: '🎭', label: '看剧目', desc: '《打金枝》· 王春梅经典唱段', target: 'watch' },
      { icon: '💬', label: '晒戏服', desc: '发动态秀造型，票友点赞', target: 'social' },
      { icon: '📸', label: '约写真', desc: '戏服写真套餐 ¥699起', target: 'shop' },
    ],
    course: [
      { icon: '🎭', label: '看剧目', desc: '学完身段看《傅山进京》', target: 'watch' },
      { icon: '👘', label: '租戏服', desc: '穿着戏服学身段，更有感觉', target: 'study' },
      { icon: '🎨', label: '画脸谱', desc: '学完化妆课来实操脸谱', target: 'face' },
    ],
    social: [
      { icon: '👘', label: '去租赁', desc: '梨园戏服社同款戏服', target: 'study' },
      { icon: '🛍️', label: '买文创', desc: '热门非遗好物推荐', target: 'shop' },
      { icon: '🎭', label: '去看戏', desc: '票友推荐《见皇姑》', target: 'watch' },
    ],
    shop: [
      { icon: '👘', label: '租戏服', desc: '搭配文创拍照更好看', target: 'study' },
      { icon: '💬', label: '晒好物', desc: '买了什么？发动态分享', target: 'social' },
      { icon: '🎭', label: '看晋剧', desc: '文创灵感来自经典剧目', target: 'watch' },
    ],
    map: [
      { icon: '🎭', label: '看剧目', desc: '在古戏台看过戏了吗？', target: 'watch' },
      { icon: '👘', label: '租戏服', desc: '穿戏服逛古戏台', target: 'study' },
      { icon: '🛍️', label: '买文创', desc: '古戏台主题文创', target: 'shop' },
    ],
    face: [
      { icon: '🎭', label: '看剧目', desc: '画完脸谱去看对应角色', target: 'watch' },
      { icon: '📖', label: '学课程', desc: '戏曲化妆造型课', target: 'course' },
      { icon: '🛍️', label: '买脸谱', desc: '晋剧脸谱盲盒 ¥68', target: 'shop' },
    ],
    admin: [{ icon: '🛡️', label: '用户管理', desc: '管理所有用户账户', target: 'admin' as TabId },{ icon: '📦', label: '订单管理', desc: '查看所有美美租赁订单', target: 'admin' as TabId },],
    chat: [
      { icon: '🎭', label: '看剧目', desc: '聊完了去看一场', target: 'watch' },
      { icon: '👘', label: '租戏服', desc: 'AI推荐青衣水袖 ¥88/天', target: 'study' },
      { icon: '📖', label: '学课程', desc: '把AI说的技巧学起来', target: 'course' },
    ],
  }
  const items = recs[activeTab] || []
  if (items.length === 0) return null
  return (
    <div className="glass-panel rounded-2xl p-4">
      <h3 className="text-sm font-semibold text-white/70 mb-3">🔗 探索更多</h3>
      <div className="space-y-2">
        {items.map((item, i) => (
          <button key={i} onClick={() => onNavigate(item.target)}
            className="w-full flex items-center gap-3 p-3 rounded-xl glass-control hover:border-amber-500/20 transition-all text-left">
            <span className="text-2xl shrink-0">{item.icon}</span>
            <div className="min-w-0">
              <div className="text-sm font-medium text-white/80">{item.label}</div>
              <div className="text-[11px] text-white/40 truncate">{item.desc}</div>
            </div>
            <span className="shrink-0 text-white/20">→</span>
          </button>
        ))}
      </div>
    </div>
  )
}
