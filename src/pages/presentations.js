import React from 'react'
import { Link } from 'gatsby'
import { Layout } from '../layout'
import { rhythm } from '../utils/typography'

const presentations = {
  upcoming: [],
  past: [
    {
      date: 'June 23, 2026',
      title: 'AI Prototypes & Future Concepts',
      event: 'cBioPortal Community Call',
      url: '/presentations/2026-06-23-cbioportal-community-call-ai/',
    },
    {
      date: 'May 26, 2026',
      title: 'AI-Assisted Vibe Coding in Cancer Genomics',
      event: 'Cancer AI Conversations (NCI)',
      url: '/presentations/2026-05-26-nci-ai-conversations/',
    },
  ],
}

export default ({ location }) => {
  const siteTitle = '🔧 ino.bio 🧬'

  return (
    <Layout location={location} title={siteTitle}>
      <div
        style={{
          marginLeft: 'auto',
          marginRight: 'auto',
          maxWidth: rhythm(24),
        }}
      >
        <h1>Presentations</h1>

        <h2>Upcoming</h2>
        {presentations.upcoming.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {presentations.upcoming.map((p, i) => (
              <li key={i} style={{ marginBottom: rhythm(0.75) }}>
                <a
                  href={p.url}
                  style={{ fontSize: '1.1em', fontWeight: 600 }}
                >
                  {p.title}
                </a>
                <div style={{ color: '#666', fontSize: '0.9em' }}>
                  {p.event} · {p.date}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: '#999' }}>None scheduled.</p>
        )}

        <h2>Past</h2>
        {presentations.past.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {presentations.past.map((p, i) => (
              <li key={i} style={{ marginBottom: rhythm(0.75) }}>
                <a
                  href={p.url}
                  style={{ fontSize: '1.1em', fontWeight: 600 }}
                >
                  {p.title}
                </a>
                <div style={{ color: '#666', fontSize: '0.9em' }}>
                  {p.event} · {p.date}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: '#999' }}>Coming soon.</p>
        )}
      </div>
    </Layout>
  )
}
