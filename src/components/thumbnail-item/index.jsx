import React from 'react'
import { Link } from 'gatsby'
import { TARGET_CLASS } from '../../utils/visible'

import './index.scss'

export const ThumbnailItem = ({ node }) => (
  <Link className={`thumbnail ${TARGET_CLASS}`} to={node.fields.slug}>
    <div key={node.fields.slug}>
      <h3>{node.frontmatter.title || node.fields.slug}</h3>
      <div className="post-meta">
        <span className="post-date">{node.frontmatter.date}</span>
      </div>
      <p dangerouslySetInnerHTML={{ __html: node.excerpt }} />
      <a>Read more</a>
    </div>
  </Link>
)
