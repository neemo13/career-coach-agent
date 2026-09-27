
import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { getAnalysisById, updateAnalysis, deleteAnalysis } from '../api/client'
import Button from '../components/Button'

function SkillTags({ items, variant }) {
  return (
    <div>
      {items.map((s) => (
        <span key={s} className={`tag tag-${variant}`}>{s}</span>
      ))}
    </div>
  )
}

export default function AnalysisDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { accessToken } = useAuth()
  const [analysis, setAnalysis] = useState(null)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [status, setStatus] = useState('Loading...')

  useEffect(() => {
    if (!accessToken || !id) return

    getAnalysisById(accessToken, id)
      .then((a) => {
        setAnalysis(a)
        setName(a.name || '')
        setNote(a.note || '')
        setStatus('')
      })
      .catch((err) => setStatus(err.message))
  }, [accessToken, id])

  async function handleSave(e) {
    e.preventDefault()

    try {
      const updated = await updateAnalysis(accessToken, id, { name, note })
      setAnalysis(updated)
      setEditing(false)
    } catch (err) {
      setStatus(`Error: ${err.message}`)
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this analysis? This cannot be undone.')) return

    try {
      await deleteAnalysis(accessToken, id)
      navigate('/analyses')
    } catch (err) {
      setStatus(`Error: ${err.message}`)
    }
  }

  if (status && !analysis) {
    return <div className="page">{status}</div>
  }

  if (!analysis) return null

  return (
    <div className="page">
      <p>
        <Link to="/analyses">← All analyses</Link>
      </p>

      <h2>{analysis.name || 'Untitled analysis'}</h2>

      <p className="muted">
        Resume: <strong>{analysis.resume_file_name || '(unknown)'}</strong>
        {' · '}
        Job description: <strong>{analysis.job_title || '(untitled)'}</strong>
        {' · '}
        {new Date(analysis.created_at).toLocaleString()}
      </p>

      <div className="section">
        <h3 style={{ marginBottom: 0 }}>
          {analysis.match_score}% match
        </h3>
        <p>{analysis.summary}</p>
      </div>

      <div className="section">
        <h4>Matching skills</h4>
        <SkillTags
          items={analysis.matching_skills}
          variant="positive"
        />
      </div>

      <div className="section">
        <h4>Missing skills</h4>
        <SkillTags
          items={analysis.missing_skills}
          variant="negative"
        />
      </div>

      <div className="section">
        <h4>Strengths</h4>
        <ul>
          {analysis.strengths.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>

        <h4>Weaknesses</h4>
        <ul>
          {analysis.weaknesses.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>

        <h4>Recommendations</h4>
        <ul>
          {analysis.recommendations.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </div>

      {analysis.note && !editing && (
        <div className="section">
          <h4>Note</h4>
          <p>{analysis.note}</p>
        </div>
      )}

      <div
        className="section"
        style={{
          display: 'flex',
          gap: 'var(--space-2)',
          flexWrap: 'wrap',
        }}
      >
        <Link to={`/coach/${analysis.id}`}>
          <Button variant="secondary">
            Ask Career Coach
          </Button>
        </Link>

        <Button
          variant="secondary"
          onClick={() => setEditing((v) => !v)}
        >
          {editing ? 'Cancel Edit' : 'Edit Analysis'}
        </Button>

        <Button
          variant="danger"
          onClick={handleDelete}
        >
          Delete Analysis
        </Button>
      </div>

      {editing && (
        <form
          onSubmit={handleSave}
          className="section"
          style={{ maxWidth: 400 }}
        >
          <label>
            Name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label>
            Note
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </label>

          <Button type="submit">
            Save
          </Button>
        </form>
      )}

      {status && <p className="muted">{status}</p>}
    </div>
  )
}
