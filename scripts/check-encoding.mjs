import { readFileSync, readdirSync } from 'node:fs'
import { dirname, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const textExts = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.css', '.html', '.json'])
const ignoredDirs = new Set(['.git', 'dist', 'node_modules', 'release', '.npm-cache'])
const ignoredPaths = [
  join(root, 'android', 'app', 'build'),
  join(root, 'android', 'app', 'src', 'main', 'assets', 'public'),
]
const mojibakePattern = /�|[鏅婕姹绉绮惧搧濂界墿儬欏鎴忌洸鑴歌氨宸潑灏廵绠＄悊馃鈥]{2,}/

function walk(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const nextDir = join(dir, entry.name)
      if (!ignoredDirs.has(entry.name) && !ignoredPaths.some((ignoredPath) => nextDir.startsWith(ignoredPath))) {
        walk(nextDir, files)
      }
      continue
    }
    if (textExts.has(extname(entry.name))) files.push(join(dir, entry.name))
  }
  return files
}

const offenders = []
for (const file of walk(root)) {
  if (file.endsWith('scripts\\check-encoding.mjs') || file.endsWith('scripts/check-encoding.mjs')) continue
  const text = readFileSync(file, 'utf8')
  const lines = text.split(/\r?\n/)
  lines.forEach((line, index) => {
    if (mojibakePattern.test(line)) {
      offenders.push(`${file}:${index + 1}: ${line.trim().slice(0, 140)}`)
    }
  })
}

if (offenders.length) {
  console.error(`Found ${offenders.length} suspicious mojibake line(s):`)
  console.error(offenders.slice(0, 80).join('\n'))
  process.exit(1)
}

console.log('Encoding check passed.')
