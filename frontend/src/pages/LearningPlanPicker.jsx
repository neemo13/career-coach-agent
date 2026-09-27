import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { listAnalyses } from '../api/client'
import EmptyState from '../components/EmptyState'

export default function LearningPlanPicker() {
  const { accessToken } = useAuth()
  const [analyses, setAnalyses] = useState([])
  const [status, setStatus] = useState('Loading...')

  useEffect(() => {
    if (!accessToken) return
    listAnalyses(accessToken)
      .then((data) => {
        const sorted = [...data].sort((a, b) => b.missing_skills_count - a.missing_skills_count)
        setAnalyses(sorted)
        setStatus('')
      })
      .catch((err) => setStatus(err.message))
  }, [accessToken])

  return (
    <div className="page">
      <h2>Learning Plan</h2>
      <p className="muted">Which analysis's learning plan do you want to view?</p>

      {status && <p className="muted">{status}</p>}
      {!status && analyses.length === 0 && (
        <EmptyState>
          No analyses yet. <Link to="/analyses/new">Run an analysis</Link> first.
        </EmptyState>
      )}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {analyses.map((a) => (
          <li key={a.id} className="section" style={{ marginTop: 'var(--space-2)', paddingTop: 'var(--space-2)' }}>
            <Link to={`/learning-plan/${a.id}`} style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--step-1)' }}>
              {a.name || a.job_title || 'Untitled analysis'}
            </Link>
            <div className="muted">
              {a.match_score}% match · {a.missing_skills_count} skill gaps
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}