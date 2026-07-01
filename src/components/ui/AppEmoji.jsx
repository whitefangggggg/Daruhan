import { EMOJI } from '../../lib/emojis'

export default function AppEmoji({ name, id, size = 20, className = '', set = 'apple' }) {
  const emojiId = id || (name && EMOJI[name]) || name
  const sizeValue = typeof size === 'number' ? `${size}px` : size

  if (!emojiId) return null

  return (
    <span className={`inline-flex items-center justify-center align-middle ${className}`}>
      <em-emoji id={emojiId} size={sizeValue} set={set} />
    </span>
  )
}
