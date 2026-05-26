import type { CSSProperties } from 'react'
import type { HanfuItem } from '../../data/hanfuData'

export const genOrderId = () => 'HFR' + Date.now().toString(36).toUpperCase()

export const generatedAsset = (name: string) => `${import.meta.env.BASE_URL}generated/${name}`

export const hanfuCover = (id: string) => {
  const index = ((Math.max(1, Number(id.replace(/\D/g, '')) || 1) - 1) % 12) + 1
  return generatedAsset(`hanfu-${index}.jpg`)
}

export const costumeHeroStyle = {
  backgroundImage: `linear-gradient(110deg, rgba(15, 5, 8, 0.78), rgba(92, 28, 20, 0.58) 44%, rgba(15, 5, 8, 0.82)), url("${generatedAsset('costume-rental-hero.jpg')}")`,
  backgroundPosition: 'center',
  backgroundSize: 'cover',
} satisfies CSSProperties

export const coverImagePositions = [
  '18% 50%', '34% 52%', '52% 48%', '74% 46%', '88% 50%', '62% 68%',
  '28% 32%', '80% 64%', '45% 58%', '12% 48%', '70% 36%', '55% 72%',
]

export const coverObjectPosition = (id: string) => {
  const index = Math.max(1, Number(id.replace(/\D/g, '')) || 1) - 1
  return coverImagePositions[index % coverImagePositions.length]
}

export const withGeneratedCover = (item: HanfuItem): HanfuItem =>
  item.coverUrl ? item : { ...item, coverUrl: hanfuCover(item.id) }

export function CoverImg({ coverUrl, className, emojiSize }: { coverUrl?: string; className?: string; emojiSize?: string }) {
  if (coverUrl) return <img src={coverUrl} alt="" className={`w-full h-full object-cover ${className || ''}`} />
  return <span className={emojiSize || 'text-2xl'}>👘</span>
}
