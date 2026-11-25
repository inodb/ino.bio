import React, { useEffect, useState } from 'react'
import { Layout } from '../layout'
import { rhythm } from '../utils/typography'

// One list for all talks. Dates are YYYY-MM-DD; a talk counts as upcoming
// through the end of its day, then moves to Past.
const presentations = [
  {
    date: '2026-10-30',
    title: 'cBioChat: A Conversational Interface for cBioPortal and HTAN Data',
    event: 'HTAN-TBEL Data Science Mini-Symposium',
    url: '/presentations/2026-10-30-htan-tbel-cbiochat/',
  },
  {
    date: '2026-06-23',
    title: 'cBioPortal AI Prototypes & Future Concepts',
    event: 'cBioPortal Community Call',
    url: '/presentations/2026-06-23-cbioportal-community-call-ai/',
  },
  {
    date: '2026-05-26',
    title: 'AI-Assisted Vibe Coding in Cancer Genomics',
    event: 'Cancer AI Conversations (NCI)',
    url: '/presentations/2026-05-26-nci-ai-conversations/',
  },
]

// Today's date as YYYY-MM-DD in the visitor's time zone
const todayISO = () => {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const formatDate = (iso) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })

const PresentationList = ({ items, empty }) =>
  items.length > 0 ? (
    <ul style={{ listStyle: 'none', padding: 0 }}>
      {items.map((p) => (
        <li key={p.url} style={{ marginBottom: rhythm(0.75) }}>
          <a href={p.url} style={{ fontSize: '1.1em', fontWeight: 600 }}>
            {p.title}
          </a>
          <div style={{ color: '#666', fontSize: '0.9em' }}>
            {p.event} · {formatDate(p.date)}
          </div>
        </li>
      ))}
    </ul>
  ) : (
    <p style={{ color: '#999' }}>{empty}</p>
  )

export default ({ location }) => {
  const siteTitle = '🔧 ino.bio 🧬'

  // The pre-built page splits by build date; the browser re-splits by today's date
  const [today, setToday] = useState(todayISO)
  useEffect(() => setToday(todayISO()), [])

  const upcoming = presentations
    .filter((p) => p.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
  const past = presentations
    .filter((p) => p.date < today)
    .sort((a, b) => b.date.localeCompare(a.date))

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
        <PresentationList items={upcoming} empty="None scheduled." />

        <h2>Past</h2>
        <PresentationList items={past} empty="Coming soon." />
      </div>
    </Layout>
  )
}
