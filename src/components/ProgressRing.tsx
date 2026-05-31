interface Props {
  rate: number    // 0~1
  size?: number
  strokeWidth?: number
  color?: string
  label?: string
}

export default function ProgressRing({
  rate,
  size = 80,
  strokeWidth = 8,
  color = '#4361ee',
  label,
}: Props) {
  const r = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * r
  const dash = circumference * Math.min(rate, 1)
  const pct = Math.round(rate * 100)

  return (
    <div className="progress-ring-wrap">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          style={{ transition: 'stroke-dasharray 0.5s ease' }}
        />
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            transform: 'rotate(90deg)',
            transformOrigin: `${size / 2}px ${size / 2}px`,
            fontSize: size < 70 ? '13px' : '16px',
            fontWeight: 700,
            fill: 'var(--color-text)',
          }}
        >
          {pct}%
        </text>
      </svg>
      {label && <span className="progress-ring-label">{label}</span>}
    </div>
  )
}
