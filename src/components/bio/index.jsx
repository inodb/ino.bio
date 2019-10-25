import React from 'react'
import { StaticQuery, graphql, Link } from 'gatsby'
import Image from 'gatsby-image'
import avatar from './ino_typing.gif';

import './index.scss'

export const Bio = () => (
  <StaticQuery
    query={bioQuery}
    render={data => {
      const { author, social, introduction } = data.site.siteMetadata

      return (
        <div className="bio">
          <div className="author">
            <div className="author-description">
              <span style={{ animation: 'flutter 3.5s infinite linear', opacity: 0.7, fontSize: 30, marginRight: -20, zIndex: 1 }}>
                🔧
              </span>
              <img
                className="author-image"
                src={avatar}
                alt={author}
                style={{
                  borderRadius: `100%`,
                }}
              />
              <span style={{ animation: 'flutter 5s infinite linear', opacity: 0.7, fontSize: 30, marginLeft: -35, marginRight: 30, zIndex: 1 }}>
                🧬
              </span>
              <div className="author-name">
                <span className="author-name-prefix">Written by</span>
                <Link to={'/about'} className="author-name-content">
                  <span>@{author}</span>
                </Link>
                <div className="author-introduction">{introduction}</div>
                <p className="author-socials">
                  {social.github && (
                    <a href={`https://github.com/${social.github}`}>GitHub</a>
                  )}
                  {social.medium && (
                    <a href={`https://medium.com/${social.medium}`}>Medium</a>
                  )}
                  {social.twitter && (
                    <a href={`https://twitter.com/${social.twitter}`}>
                      Twitter
                    </a>
                  )}
                  {social.facebook && (
                    <a href={`https://www.facebook.com/${social.facebook}`}>
                      Facebook
                    </a>
                  )}
                  {social.googlescholar && (
                    <a href={`https://scholar.google.com/citations?user=${social.googlescholar}`}>
                      Google Scholar
                    </a>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }}
  />
)

const bioQuery = graphql`
  query BioQuery {
    site {
      siteMetadata {
        author
        introduction
        social {
          twitter
          github
          medium
          facebook
          googlescholar
        }
      }
    }
  }
`

export default Bio
