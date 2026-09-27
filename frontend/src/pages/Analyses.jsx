import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { listAnalyses } from '../api/client'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'

export default function Analyses() {
  const { accessToken } = useAuth()
  const [analyses, setAnalyses] = useState([])
  const [status, setStatus] = useState('')

  useEffect(() => {
    if (!accessToken) return
    listAnalyses(accessToken).then(setAnalyses).catch((err) => setStatus(err.message))
  }, [accessToken])

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h2>Analyses</h2>
        <Link to="/analyses/new"><Button>Run New Analysis</Button></Link>
      </div>

      {status && <p className="muted">{status}</p>}
      {analyses.length === 0 && <EmptyState>No analyses yet — run one to see it here.</EmptyState>}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {analyses.map((a) => (
          <li key={a.id} className="section" style={{ marginTop: 'var(--space-2)', paddingTop: 'var(--space-2)' }}>
            <Link to={`/analysis/${a.id}`} style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--step-1)' }}>
              {a.name || a.job_title || 'Untitled analysis'}
            </Link>
            <div className="muted">
              {a.match_score}% match · {a.missing_skills_count} skill gaps
              {a.note ? ` · ${a.note}` : ''}
            </div>
            <div className="muted" style={{ fontSize: '0.85em' }}>
              {new Date(a.created_at).toLocaleString()}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}