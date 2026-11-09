import React from 'react'

import './index.scss'

const AilBadge = ({ level }) => {
  const totalSegments = 6
  const filledColor = '#8a7e6b'
  const emptyColor = '#d9d4cc'
  const labelBg = '#4a4a3a'

  return (
    <a
      href="https://danielmiessler.com/blog/ai-influence-level-ail"
      className="ail-badge"
      title={`AIL ${level} · Human created, major AI augmentation`}
      target="_blank"
      rel="noopener noreferrer"
    >
      <svg
        width="80"
        height="18"
        viewBox="0 0 80 18"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="0" y="1" width="28" height="16" rx="3" fill={labelBg} />
        <text
          x="14"
          y="12.5"
          textAnchor="middle"
          fill="#fff"
          fontSize="8.5"
          fontWeight="700"
          fontFamily="system-ui, sans-serif"
          letterSpacing="0.5"
        >
          AIL
        </text>
        <text
          x="34"
          y="13"
          fill={labelBg}
          fontSize="10"
          fontWeight="700"
          fontFamily="system-ui, sans-serif"
        >
          {level}
        </text>
        {Array.from({ length: totalSegments }).map((_, i) => (
          <circle
            key={i}
            cx={44 + i * 6}
            cy="9"
            r="2"
            fill={i < level ? filledColor : emptyColor}
          />
        ))}
      </svg>
    </a>
  )
}

export const PostTitle = ({ title, date, ail }) => (
  <div className="post-header">
    <h1>{title}</h1>
    {date && (
      <div className="post-meta">
        <span className="post-date">{date}</span>
        {ail != null && <AilBadge level={ail} />}
      </div>
    )}
  </div>
)
