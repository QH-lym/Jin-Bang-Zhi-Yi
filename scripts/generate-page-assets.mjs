import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))

function ensureDir(path) {
  mkdirSync(path, { recursive: true })
}

function saveSvg(relativePath, svg) {
  const fullPath = join(root, relativePath)
  ensureDir(dirname(fullPath))
  writeFileSync(fullPath, svg, 'utf8')
}

function esc(text) {
  return String(text).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[m])
}

function productSvg({ title, subtitle, accent, motif }) {
  const motifs = {
    face: `<circle cx="180" cy="130" r="54" fill="#f8e6cf"/><path d="M142 116c20-34 56-34 76 0M144 144c22 22 50 22 72 0" fill="none" stroke="#24130d" stroke-width="8" stroke-linecap="round"/><path d="M180 76c-16 20-23 40-18 76h36c5-36-2-56-18-76Z" fill="${accent}" opacity=".92"/><circle cx="160" cy="126" r="7" fill="#111"/><circle cx="200" cy="126" r="7" fill="#111"/>`,
    paper: `<g fill="none" stroke="${accent}" stroke-width="8" stroke-linecap="round"><path d="M112 105c48-48 100 48 148 0"/><path d="M116 158c46-42 96 42 142 0"/><path d="M130 76v118M242 76v118"/></g><rect x="102" y="65" width="170" height="150" rx="18" fill="#fff4df" opacity=".18" stroke="#f6d18a"/>`,
    shadow: `<path d="M122 74h96l38 48-32 100H112L80 122Z" fill="#1b1020" stroke="${accent}" stroke-width="7"/><path d="M118 116c34-20 78-20 112 0M134 158h80M154 190h40" stroke="#f7c873" stroke-width="8" stroke-linecap="round"/><circle cx="130" cy="104" r="12" fill="${accent}"/>`,
    print: `<rect x="96" y="72" width="172" height="142" rx="12" fill="#f7e3bb"/><path d="M124 98h116v88H124z" fill="#9c1b1b"/><path d="M148 118c38-22 68 20 44 48-18 21-54 6-54-20" fill="none" stroke="#f8d778" stroke-width="8"/><path d="M96 72l28 26M268 72l-28 26M96 214l28-28M268 214l-28-28" stroke="#4d2416" stroke-width="7"/>`,
    scarf: `<path d="M96 91c56-30 120-30 176 0-23 38-24 74-3 114-56 30-112 30-168 0 22-40 20-76-5-114Z" fill="${accent}" opacity=".92"/><path d="M132 118c24 18 58 18 82 0M128 168c28-18 64-18 92 0" fill="none" stroke="#ffe9b0" stroke-width="7" stroke-linecap="round"/>`,
    bronze: `<circle cx="180" cy="142" r="72" fill="#3b2f28" stroke="${accent}" stroke-width="10"/><circle cx="180" cy="142" r="38" fill="none" stroke="#d8b66a" stroke-width="8"/><path d="M180 70v144M108 142h144M132 94l96 96M228 94l-96 96" stroke="#866437" stroke-width="6" opacity=".75"/>`,
    sachet: `<path d="M130 90h100l22 42-72 96-72-96Z" fill="${accent}" stroke="#ffd78a" stroke-width="7"/><path d="M180 62v40M150 128c20 18 40 18 60 0M142 156c26 24 50 24 76 0" stroke="#fff1bd" stroke-width="7" fill="none" stroke-linecap="round"/>`,
    tea: `<ellipse cx="166" cy="172" rx="58" ry="22" fill="${accent}"/><path d="M112 126h108v46c0 24-108 24-108 0Z" fill="#f0ead6" stroke="${accent}" stroke-width="7"/><path d="M220 138c40-8 42 48 2 40" fill="none" stroke="${accent}" stroke-width="8"/><circle cx="244" cy="196" r="20" fill="#f0ead6" stroke="${accent}" stroke-width="6"/>`,
    album: `<rect x="100" y="78" width="160" height="144" rx="16" fill="#171216" stroke="${accent}" stroke-width="8"/><circle cx="180" cy="150" r="46" fill="#251b22" stroke="#f7d38d" stroke-width="7"/><circle cx="180" cy="150" r="14" fill="${accent}"/><path d="M125 104h110" stroke="#fff0c2" stroke-width="7" stroke-linecap="round"/>`,
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 260" role="img" aria-label="${esc(title)}">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#13070a"/><stop offset=".48" stop-color="#2e1116"/><stop offset="1" stop-color="#111a1f"/></linearGradient>
    <radialGradient id="glow" cx=".3" cy=".14" r=".9"><stop stop-color="${accent}" stop-opacity=".62"/><stop offset=".58" stop-color="${accent}" stop-opacity=".12"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    <radialGradient id="stage" cx=".5" cy=".7" r=".48"><stop stop-color="#ffe2a4" stop-opacity=".24"/><stop offset=".62" stop-color="${accent}" stop-opacity=".08"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    <pattern id="silk" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M0 15c9-8 21-8 30 0M0 30c9-8 21-8 30 0" fill="none" stroke="#fff" stroke-opacity=".055" stroke-width="2"/></pattern>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="18" stdDeviation="16" flood-color="#000" flood-opacity=".34"/></filter>
  </defs>
  <rect width="360" height="260" rx="24" fill="url(#bg)"/>
  <rect width="360" height="260" rx="24" fill="url(#glow)"/>
  <rect width="360" height="260" rx="24" fill="url(#silk)"/>
  <rect width="360" height="260" rx="24" fill="url(#stage)"/>
  <path d="M0 196c70-26 132-20 198 4 58 22 103 20 162-8v68H0Z" fill="#061018" opacity=".58"/>
  <ellipse cx="184" cy="198" rx="112" ry="30" fill="#ffe0a3" opacity=".13"/>
  <g filter="url(#softShadow)">${motifs[motif]}</g>
  <path d="M28 28c52-12 108-10 168 8" fill="none" stroke="#fff6d2" stroke-opacity=".18" stroke-width="3" stroke-linecap="round"/>
  <text x="24" y="228" fill="#fff0bd" font-family="Microsoft YaHei, Noto Sans SC, sans-serif" font-size="22" font-weight="800">${esc(title)}</text>
  <text x="24" y="250" fill="#f8c469" font-family="Microsoft YaHei, Noto Sans SC, sans-serif" font-size="12">${esc(subtitle)}</text>
</svg>`
}

function hanfuSvg({ title, subtitle, accent, secondary, shape }) {
  const skirt = shape === 'male'
    ? `<path d="M142 82h76l28 44-24 90h-84l-24-90Z" fill="${accent}" stroke="#ffe1a3" stroke-width="6"/><path d="M150 92h60v122h-60Z" fill="${secondary}" opacity=".68"/><path d="M120 126h120M180 82v134" stroke="#fff1bf" stroke-width="5" opacity=".65"/>`
    : shape === 'cloak'
      ? `<path d="M180 62c58 26 88 80 92 158H88c4-78 34-132 92-158Z" fill="${accent}" stroke="#ffe1a3" stroke-width="6"/><path d="M180 70c24 38 38 84 42 140h-84c4-56 18-102 42-140Z" fill="${secondary}" opacity=".72"/>`
      : `<path d="M180 58l48 34 48 128H84l48-128Z" fill="${accent}" stroke="#ffe1a3" stroke-width="6"/><path d="M132 92h96l18 118H114Z" fill="${secondary}" opacity=".7"/><path d="M118 126h124M108 168h144M180 66v146" stroke="#fff1bf" stroke-width="5" opacity=".55"/>`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 260" role="img" aria-label="${esc(title)}">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#120709"/><stop offset=".55" stop-color="#34100f"/><stop offset="1" stop-color="#0b1416"/></linearGradient>
    <pattern id="silk" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M0 14c8-8 20-8 28 0M0 28c8-8 20-8 28 0" fill="none" stroke="#fff" stroke-opacity=".08" stroke-width="2"/></pattern>
  </defs>
  <rect width="360" height="260" rx="24" fill="url(#bg)"/>
  <circle cx="278" cy="58" r="80" fill="${accent}" opacity=".18"/>
  <rect width="360" height="260" rx="24" fill="url(#silk)"/>
  ${skirt}
  <path d="M128 112c30 18 74 18 104 0M142 190c24 14 52 14 76 0" fill="none" stroke="#f8d48a" stroke-width="6" stroke-linecap="round"/>
  <text x="24" y="232" fill="#ffe7ad" font-family="Microsoft YaHei, Noto Sans SC, sans-serif" font-size="22" font-weight="700">${esc(title)}</text>
  <text x="24" y="252" fill="#f8c469" font-family="Microsoft YaHei, Noto Sans SC, sans-serif" font-size="12">${esc(subtitle)}</text>
</svg>`
}

function playSvg({ title, subtitle, accent, motif }) {
  const symbols = {
    palace: `<path d="M86 168h188v44H86zM110 132h140v36H110zM130 104h100v28H130z" fill="#2a1214" stroke="${accent}" stroke-width="7"/><path d="M82 132l98-62 98 62M118 104l62-42 62 42" fill="none" stroke="#f8d48a" stroke-width="8" stroke-linecap="round"/>`,
    scroll: `<path d="M112 76h150v126H112z" fill="#ead6ad" opacity=".95"/><path d="M100 78c24-18 24 142 0 124M262 78c24-18 24 142 0 124" fill="none" stroke="${accent}" stroke-width="14" stroke-linecap="round"/><path d="M140 112h92M140 142h84M140 172h72" stroke="#5a3020" stroke-width="7" stroke-linecap="round"/>`,
    crown: `<path d="M104 174h152l-22-84-38 38-28-54-28 54-38-38Z" fill="${accent}" stroke="#ffe1a3" stroke-width="7"/><circle cx="168" cy="74" r="13" fill="#ffe1a3"/>`,
    sword: `<path d="M180 58l18 112-18 38-18-38Z" fill="#dbe7ef" stroke="${accent}" stroke-width="6"/><path d="M128 168h104M150 198h60" stroke="#f7c873" stroke-width="10" stroke-linecap="round"/><path d="M118 78l124 124M242 78L118 202" stroke="#7d1f1f" stroke-width="7" opacity=".6"/>`,
    snow: `<circle cx="180" cy="138" r="68" fill="#dceefa" opacity=".22" stroke="${accent}" stroke-width="7"/><path d="M180 74v128M124 106l112 64M236 106l-112 64" stroke="#e9f7ff" stroke-width="8" stroke-linecap="round"/>`,
    lantern: `<path d="M130 92c20-28 80-28 100 0v82c-20 28-80 28-100 0Z" fill="${accent}" stroke="#ffe1a3" stroke-width="7"/><path d="M180 62v160M138 120h84M138 154h84" stroke="#3b1112" stroke-width="6" opacity=".55"/>`,
    flower: `<circle cx="180" cy="136" r="24" fill="#ffe1a3"/><g fill="${accent}"><ellipse cx="180" cy="88" rx="24" ry="42"/><ellipse cx="180" cy="184" rx="24" ry="42"/><ellipse cx="132" cy="136" rx="42" ry="24"/><ellipse cx="228" cy="136" rx="42" ry="24"/></g><circle cx="180" cy="136" r="18" fill="#7a1717"/>`,
    mic: `<rect x="158" y="70" width="44" height="92" rx="22" fill="${accent}" stroke="#ffe1a3" stroke-width="7"/><path d="M128 138c0 40 104 40 104 0M180 180v34M144 214h72" fill="none" stroke="#f8d48a" stroke-width="9" stroke-linecap="round"/>`,
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 270" role="img" aria-label="${esc(title)}">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#0a0507"/><stop offset=".5" stop-color="#351013"/><stop offset="1" stop-color="#15100b"/></linearGradient>
    <radialGradient id="spot" cx=".5" cy=".18" r=".9"><stop stop-color="${accent}" stop-opacity=".45"/><stop offset=".72" stop-color="#000" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="480" height="270" rx="28" fill="url(#bg)"/>
  <rect width="480" height="270" rx="28" fill="url(#spot)"/>
  <path d="M0 214c82-32 148-32 230 0s164 32 250 0v56H0Z" fill="#050203" opacity=".55"/>
  <g transform="translate(60 8)">${symbols[motif]}</g>
  <text x="28" y="228" fill="#ffe7ad" font-family="Microsoft YaHei, Noto Sans SC, sans-serif" font-size="28" font-weight="800">${esc(title)}</text>
  <text x="28" y="252" fill="#f8c469" font-family="Microsoft YaHei, Noto Sans SC, sans-serif" font-size="14">${esc(subtitle)}</text>
</svg>`
}

function courseSvg({ title, subtitle, accent, motif }) {
  const motifs = {
    body: `<path d="M164 82c20-28 48-28 68 0M198 104v92M154 132h88M150 196c28-24 68-24 96 0" stroke="#ffe6ad" stroke-width="10" stroke-linecap="round" fill="none"/><path d="M136 120c-28 22-46 54-52 96M260 120c28 22 46 54 52 96" stroke="${accent}" stroke-width="12" stroke-linecap="round" fill="none"/>`,
    voice: `<path d="M140 106c28-34 84-34 112 0v54c-28 34-84 34-112 0Z" fill="${accent}" opacity=".85" stroke="#ffe6ad" stroke-width="7"/><path d="M104 136c-18 16-18 44 0 60M292 136c18 16 18 44 0 60M82 116c-34 34-34 84 0 118M314 116c34 34 34 84 0 118" stroke="#ffe6ad" stroke-width="8" stroke-linecap="round" fill="none"/>`,
    drum: `<circle cx="198" cy="142" r="70" fill="${accent}" opacity=".85" stroke="#ffe6ad" stroke-width="8"/><circle cx="198" cy="142" r="34" fill="none" stroke="#2a1214" stroke-width="7"/><path d="M98 92l82 58M298 92l-82 58" stroke="#f8d48a" stroke-width="9" stroke-linecap="round"/>`,
    theory: `<path d="M118 78h160v140H118z" fill="#efe4c8" opacity=".9" stroke="${accent}" stroke-width="8"/><path d="M150 116h98M150 148h90M150 180h72" stroke="#5a3020" stroke-width="8" stroke-linecap="round"/><path d="M118 78c28 18 28 122 0 140M278 78c-28 18-28 122 0 140" fill="none" stroke="#ffe6ad" stroke-width="7"/>`,
    makeup: `<circle cx="198" cy="142" r="66" fill="#f8e6cf" stroke="${accent}" stroke-width="8"/><path d="M156 128c20-24 64-24 84 0M158 166c24 20 56 20 80 0M198 82c-14 22-20 52-14 100h28c6-48 0-78-14-100Z" fill="none" stroke="#2a1214" stroke-width="8" stroke-linecap="round"/><circle cx="176" cy="144" r="7" fill="${accent}"/><circle cx="220" cy="144" r="7" fill="${accent}"/>`,
    culture: `<path d="M106 192h184M132 192V104l66-44 66 44v88M154 126h88M154 158h88" stroke="#ffe6ad" stroke-width="9" stroke-linecap="round" fill="none"/><path d="M198 60l92 62H106Z" fill="${accent}" opacity=".75"/>`,
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 396 240" role="img" aria-label="${esc(title)}">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#0b0507"/><stop offset=".52" stop-color="#321014"/><stop offset="1" stop-color="#151009"/></linearGradient>
    <radialGradient id="glow" cx=".28" cy=".2" r=".86"><stop stop-color="${accent}" stop-opacity=".42"/><stop offset=".7" stop-color="#000" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="396" height="240" rx="26" fill="url(#bg)"/>
  <rect width="396" height="240" rx="26" fill="url(#glow)"/>
  <path d="M0 188c72-24 134-22 198 0s126 24 198 0v52H0Z" fill="#050203" opacity=".5"/>
  ${motifs[motif]}
  <text x="24" y="202" fill="#ffe7ad" font-family="Microsoft YaHei, Noto Sans SC, sans-serif" font-size="24" font-weight="800">${esc(title)}</text>
  <text x="24" y="224" fill="#f8c469" font-family="Microsoft YaHei, Noto Sans SC, sans-serif" font-size="13">${esc(subtitle)}</text>
</svg>`
}

const products = [
  ['product-1.svg', { title: '晋剧脸谱盲盒', subtitle: '角色谱系 · 收藏证书', accent: '#d7342a', motif: 'face' }],
  ['product-2.svg', { title: '剪纸书签套装', subtitle: '晋北剪纸 · 十二枚', accent: '#ef4444', motif: 'paper' }],
  ['product-3.svg', { title: '皮影人偶套装', subtitle: '可动关节 · 手作体验', accent: '#f59e0b', motif: 'shadow' }],
  ['product-4.svg', { title: '木版年画装饰画', subtitle: '复刻刷色 · 可悬挂', accent: '#b91c1c', motif: 'print' }],
  ['product-5.svg', { title: '戏曲主题丝巾', subtitle: '旦角纹样 · 真丝质感', accent: '#db2777', motif: 'scarf' }],
  ['product-6.svg', { title: '青铜纹饰摆件', subtitle: '晋侯纹样 · 仿古陈设', accent: '#b7791f', motif: 'bronze' }],
  ['product-7.svg', { title: '刺绣香囊挂件', subtitle: '平遥刺绣 · 随身香气', accent: '#16a34a', motif: 'sachet' }],
  ['product-8.svg', { title: '非遗陶瓷茶具', subtitle: '手工拉坯 · 六杯套装', accent: '#0f766e', motif: 'tea' }],
  ['product-9.svg', { title: '晋剧唱腔专辑', subtitle: '经典唱段 · 老艺人原声', accent: '#7c3aed', motif: 'album' }],
]

const hanfu = [
  ['hanfu-1.svg', { title: '青衣水袖', subtitle: '月白 · 水袖', accent: '#2563eb', secondary: '#e0f2fe', shape: 'female' }],
  ['hanfu-2.svg', { title: '花旦短袄', subtitle: '桃花粉 · 柳绿', accent: '#db2777', secondary: '#84cc16', shape: 'female' }],
  ['hanfu-3.svg', { title: '老生褶子', subtitle: '玄青 · 月白', accent: '#1f2937', secondary: '#e5e7eb', shape: 'male' }],
  ['hanfu-4.svg', { title: '武生靠衣', subtitle: '赤金 · 靛蓝', accent: '#b45309', secondary: '#1d4ed8', shape: 'male' }],
  ['hanfu-5.svg', { title: '公主蟒袍', subtitle: '旦角 · 凤穿牡丹', accent: '#1d4ed8', secondary: '#991b1b', shape: 'female' }],
  ['hanfu-6.svg', { title: '净角蟒袍', subtitle: '绯红 · 玄黑', accent: '#991b1b', secondary: '#111827', shape: 'male' }],
  ['hanfu-7.svg', { title: '小生帔衣', subtitle: '葡萄紫 · 琥珀黄', accent: '#7e22ce', secondary: '#eab308', shape: 'male' }],
  ['hanfu-8.svg', { title: '丑角茶衣', subtitle: '玄纁 · 经典', accent: '#374151', secondary: '#7f1d1d', shape: 'cloak' }],
  ['hanfu-9.svg', { title: '花旦云肩', subtitle: '天水碧 · 胭脂粉', accent: '#0f766e', secondary: '#f9a8d4', shape: 'female' }],
  ['hanfu-10.svg', { title: '水袖练功衣', subtitle: '月华白 · 初学', accent: '#e5e7eb', secondary: '#94a3b8', shape: 'cloak' }],
  ['hanfu-11.svg', { title: '老生圆领衫', subtitle: '竹青 · 男款', accent: '#166534', secondary: '#d9f99d', shape: 'male' }],
  ['hanfu-12.svg', { title: '晋剧彩裙', subtitle: '杏子黄 · 旦角', accent: '#d97706', secondary: '#fef3c7', shape: 'female' }],
]

const plays = [
  ['play-1.svg', { title: '打金枝', subtitle: '宫廷风波 · 经典复排', accent: '#d97706', motif: 'palace' }],
  ['play-2.svg', { title: '傅山进京', subtitle: '文人气节 · 名家导赏', accent: '#8b5e34', motif: 'scroll' }],
  ['play-3.svg', { title: '见皇姑', subtitle: '青衣折子 · 秦香莲', accent: '#b91c1c', motif: 'crown' }],
  ['play-4.svg', { title: '三关点帅', subtitle: '杨家将 · 武戏名段', accent: '#f59e0b', motif: 'sword' }],
  ['play-5.svg', { title: '窦娥冤', subtitle: '悲剧名作 · 六月飞雪', accent: '#60a5fa', motif: 'snow' }],
  ['play-6.svg', { title: '小宴', subtitle: '凤仪亭 · 身段示范', accent: '#dc2626', motif: 'lantern' }],
  ['play-7.svg', { title: '春草闯堂', subtitle: '新编轻喜 · 青年团', accent: '#db2777', motif: 'flower' }],
  ['play-8.svg', { title: '名家名段演唱会', subtitle: '经典唱段 · 一晚看尽', accent: '#7c3aed', motif: 'mic' }],
]

const courses = [
  ['course-1.svg', { title: '晋剧身段入门', subtitle: '站姿 步法 水袖', accent: '#f59e0b', motif: 'body' }],
  ['course-2.svg', { title: '唱念发声训练', subtitle: '梆子腔 上口字 归韵', accent: '#ef4444', motif: 'voice' }],
  ['course-3.svg', { title: '锣鼓经节奏课', subtitle: '板式 节拍 锣鼓点', accent: '#d97706', motif: 'drum' }],
  ['course-4.svg', { title: '经典剧目赏析', subtitle: '人物 情节 舞台调度', accent: '#8b5cf6', motif: 'theory' }],
  ['course-5.svg', { title: '戏曲化妆与造型', subtitle: '脸谱 妆面 服饰', accent: '#dc2626', motif: 'makeup' }],
  ['course-6.svg', { title: '晋剧文化历史', subtitle: '源流 班社 传承', accent: '#0f766e', motif: 'culture' }],
]

for (const [file, data] of products) saveSvg(`src/assets/products/${file}`, productSvg(data))
for (const [file, data] of hanfu) saveSvg(`src/assets/hanfu/${file}`, hanfuSvg(data))
for (const [file, data] of plays) saveSvg(`src/assets/plays/${file}`, playSvg(data))
for (const [file, data] of courses) saveSvg(`src/assets/courses/${file}`, courseSvg(data))

console.log(`generated ${products.length + hanfu.length + plays.length + courses.length} SVG assets`)
