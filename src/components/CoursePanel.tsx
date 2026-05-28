import { Search, Plus, Star } from 'lucide-react'

export type NewCourse = {
  title: string; category: string; total: number; teacher: string; teacherTitle: string
  level: string; students: number; rating: number; description: string; tags: string
}

export type Course = {
  id: number; title: string; category: string; total: number; done: number; teacher: string
  teacherTitle: string; next: string; level: string; students: number; rating: number
  description: string; tags: string[]; image: string; lessons: string[]; outcome: string
}

const courseImages = [
  'course-1.jpg',
  'course-2.jpg',
  'course-3.jpg',
  'course-4.jpg',
  'course-5.jpg',
  'course-6.jpg',
]

const generatedAsset = (name: string) => `${import.meta.env.BASE_URL}generated/${name}`

export const courseCover = (n: number) => generatedAsset(courseImages[(Math.max(1, n) - 1) % courseImages.length])

export const courses = [
  { id: 1, title: '晋剧身段入门', category: '基础课程', total: 12, done: 8, teacher: '王老师', teacherTitle: '国家一级演员', next: '水袖基础组合', level: '入门', students: 156, rating: 4.8, description: '系统学习晋剧身段的基本功，从站姿、步法到水袖运用，掌握传统戏曲表演的基础技巧。', tags: ['身段', '基础', '表演'], image: courseCover(1), lessons: ['台步与圆场', '云手与亮相', '水袖基础组合'], outcome: '能完成一段 60 秒身段小组合' },
  { id: 2, title: '唱念发声训练', category: '声乐课程', total: 10, done: 5, teacher: '李老师', teacherTitle: '戏曲声乐专家', next: '上口字归韵', level: '中级', students: 89, rating: 4.9, description: '专业晋剧唱腔训练，学习梆子腔、流水板等传统唱法，培养纯正的戏曲发声技巧。', tags: ['唱腔', '发声', '声乐'], image: courseCover(2), lessons: ['气息支撑', '上口字归韵', '流水板唱段'], outcome: '能独立演唱一段基础唱腔' },
  { id: 3, title: '锣鼓经节奏课', category: '音乐课程', total: 8, done: 3, teacher: '张老师', teacherTitle: '晋剧音乐传承人', next: '慢板转快板', level: '入门', students: 124, rating: 4.7, description: '学习晋剧传统锣鼓经的节奏规律，从基础节奏到复杂板式变化，感受戏曲音乐的韵律美。', tags: ['锣鼓', '节奏', '音乐'], image: courseCover(3), lessons: ['基础锣鼓点', '慢板转快板', '动作与节奏配合'], outcome: '能听辨常用板式并跟拍练习' },
  { id: 4, title: '晋剧经典剧目赏析', category: '理论课程', total: 15, done: 6, teacher: '刘老师', teacherTitle: '戏曲理论研究员', next: '《打金枝》人物分析', level: '进阶', students: 203, rating: 4.9, description: '深入剖析晋剧经典剧目，理解剧情结构、人物塑造和艺术特色，提升欣赏水平。', tags: ['剧目', '赏析', '理论'], image: courseCover(4), lessons: ['《打金枝》结构', '人物行当分析', '舞台调度解读'], outcome: '能写出一份剧目赏析笔记' },
  { id: 5, title: '戏曲化妆与造型', category: '实践课程', total: 6, done: 2, teacher: '陈老师', teacherTitle: '戏曲化妆师', next: '脸谱绘制基础', level: '入门', students: 78, rating: 4.6, description: '学习传统戏曲化妆技巧，从基础打底到脸谱绘制，掌握人物造型的艺术表现。', tags: ['化妆', '造型', '实践'], image: courseCover(5), lessons: ['底妆与眉眼', '脸谱色彩含义', '角色造型搭配'], outcome: '能完成一张角色妆面设计稿' },
  { id: 6, title: '晋剧文化历史', category: '文化课程', total: 10, done: 4, teacher: '赵老师', teacherTitle: '戏曲史专家', next: '清代晋剧发展', level: '中级', students: 167, rating: 4.8, description: '探索晋剧的历史发展脉络，了解戏曲文化的传承与演变，感受传统文化魅力。', tags: ['历史', '文化', '传承'], image: courseCover(6), lessons: ['蒲州梆子源流', '班社与名家', '当代传承案例'], outcome: '能讲清晋剧发展脉络和代表人物' }
]

export default function CoursePanel({ query, onQueryChange, selectedCategory, onCategoryChange, courses, categories, onSelectCourse, isAdmin, showAddCourse, onToggleAddCourse, newCourse, onNewCourseChange, onAddCourse }: {
  query: string; onQueryChange: (v: string) => void; selectedCategory: string; onCategoryChange: (v: string) => void
  courses: Course[]; categories: string[]; onSelectCourse: (c: Course) => void
  isAdmin: boolean; showAddCourse: boolean; onToggleAddCourse: () => void
  newCourse: NewCourse; onNewCourseChange: (c: NewCourse) => void; onAddCourse: () => void
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-lg"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" /><input value={query} onChange={e => onQueryChange(e.target.value)} placeholder="搜索课程..." className="w-full rounded-xl pl-12 pr-4 py-3 text-white outline-none placeholder-white/40 glass-control" /></div>
        <select value={selectedCategory} onChange={e => onCategoryChange(e.target.value)} className="rounded-xl px-4 py-3 text-sm text-white glass-control">{categories.map(c => <option key={c} value={c} className="bg-gray-900">{c}</option>)}</select>
      </div>
      {isAdmin && (
        <div className="glass-panel rounded-xl p-4 border border-amber-500/15">
          <div className="flex justify-between items-center"><div className="text-sm font-semibold text-amber-300">管理员添加课程</div><button onClick={onToggleAddCourse} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 glass-control text-sm"><Plus className="h-4 w-4" />{showAddCourse ? '关闭' : '添加'}</button></div>
          {showAddCourse && (
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3"><input value={newCourse.title} onChange={e => onNewCourseChange({ ...newCourse, title: e.target.value })} placeholder="课程名称" className="rounded-xl px-4 py-2 text-sm text-white glass-control" /><input value={newCourse.teacher} onChange={e => onNewCourseChange({ ...newCourse, teacher: e.target.value })} placeholder="讲师" className="rounded-xl px-4 py-2 text-sm text-white glass-control" /></div>
              <button onClick={onAddCourse} className="rounded-xl bg-gradient-to-r from-red-800 to-red-600 px-5 py-2 text-sm font-bold text-white">保存</button>
            </div>
          )}
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {courses.map(c => (
          <div key={c.id} onClick={() => onSelectCourse(c)} className="glass-panel rounded-2xl overflow-hidden cursor-pointer hover:border-amber-500/20 transition-all">
            <div className="relative h-36 overflow-hidden">
              <img src={c.image || courseCover(1)} alt={c.title} className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <span className="absolute left-3 top-3 text-xs px-2 py-0.5 rounded-full bg-white/15 text-white/80">{c.category}</span>
              <span className="absolute right-3 top-3 text-xs text-amber-300"><Star className="h-3 w-3 inline fill-amber-400" /> {c.rating}</span>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-white/90">{c.title}</h3>
              <p className="text-xs text-white/40 mt-1">{c.teacher} · {c.teacherTitle}</p>
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/50">{c.description}</p>
              <div className="mt-3 flex items-center gap-2 flex-wrap">{c.tags.map(t => <span key={t} className="text-xs px-2 py-0.5 rounded-md bg-white/5 text-white/50">#{t}</span>)}</div>
              <div className="mt-3 h-1.5 rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-red-700 to-amber-400" style={{ width: `${Math.round(c.done / c.total * 100)}%` }} /></div>
              <div className="mt-2 flex justify-between text-xs text-white/40"><span>{c.done}/{c.total} 节 · {c.next}</span><span>{c.students} 学员</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
