interface Props {
  days: number
}

export default function StreakBadge({ days }: Props) {
  if (days === 0) return null
  return (
    <span className="streak-badge">
      🔥 {days}日連続
    </span>
  )
}
