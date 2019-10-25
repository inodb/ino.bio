import React from 'react'
import { Link } from 'gatsby'
import { GitHubIcon } from '../social-share/github-icon'
import avatar from '../bio/ino_typing.gif'

import './index.scss'

export const Top = ({ title, location, rootPath }) => {
  const isRoot = location.pathname === rootPath
  return (
    <div className="top">
      {!isRoot && (
        <Link to={`/`} className="link">
          <span style={{ fontSize: 20, position: 'absolute', left: 15, top: 15, zIndex: 1 }}>
            🔧
              </span>
          <img
            className="author-image"
            src={avatar}
            alt={title}
            style={{
              borderRadius: `100%`,
            }}
            width={60}
            height={60}
          />
          <span style={{ fontSize: 20, position: 'absolute', left: 60, top: 15, zIndex: 1 }}>
            🧬
              </span>
        </Link>
      )}
    </div>
  )
}
