import React from 'react'

import './index.scss'

export const PostTitle = ({ title, date }) => (
  <div className="post-header">
    <h1>{title}</h1>
    {date && (
      <div className="post-meta">
        <span className="post-date">{date}</span>
      </div>
    )}
  </div>
)
