import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { getLearningPlan, updateLearningPlan } from '../api/client'
import Button from '../components/Button'

const priorityClass = { high: 'priority-high', medium: 'priority-medium', low: 'priority-low' }

function PlanItemRow({ item, onToggle, onNoteChange, onNoteSave }) {
  return (
    <div className="section" style={{ paddingTop: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
      <label style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5em' }}>
        <input type="checkbox" checked={item.completed} onChange={onToggle} />
        <span
          style={{
            textDecoration: item.completed ? 'line-through' : 'none',
            color: item.completed ? 'var(--color-text-muted)' : 'inherit',
          }}
        >
          <strong>{item.skill}</strong>{' '}
          <span className={priorityClass[item.priority] || ''}>· {item.priority} priority</span>
          {' · '}{item.difficulty}
        </span>
      </label>
      <p className="muted" style={{ marginLeft: '1.7em' }}>{item.recommended_area}</p>
      {item.resources?.length > 0 && (
        <div style={{ marginLeft: '1.7em' }}>
          {item.resources.map((r) => <span key={r} className="tag">{r}</span>)}
        </div>
      )}
      <div style={{ marginLeft: '1.7em', marginTop: '0.4em' }}>
        <textarea
          placeholder="Your notes..."
          value={item.user_notes}
          onChange={onNoteChange}
          onBlur={onNoteSave}
          rows={2}
          style={{ width: '100%', maxWidth: 400 }}
        />
      </div>
    </div>
  )
}

export default function LearningPlan() {
  const { accessToken } = useAuth()
  const [plan, setPlan] = useState(null)
  const [status, setStatus] = useState('Loading...')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!accessToken) return
    getLearningPlan(accessToken)
      .then((result) => {
        setPlan(result.plan)
        setStatus('')
      })
      .catch((err) => setStatus(err.message))
  }, [accessToken])

  async function persist(updated) {
    setSaving(true)
    try {
      await updateLearningPlan(accessToken, updated)
    } catch (err) {
      setStatus(`Could not save: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  function toggleItem(order) {
    const updated = plan.map((item) => (item.order === order ? { ...item, completed: !item.completed } : item))
    setPlan(updated)
    persist(updated)
  }

  function changeNote(order, value) {
    setPlan((prev) => prev.map((item) => (item.order === order ? { ...item, user_notes: value } : item)))
  }

  function saveNote() {
    persist(plan)
  }

  const shortTerm = plan ? plan.filter((i) => i.term !== 'long_term').sort((a, b) => a.order - b.order) : []
  const longTerm = plan ? plan.filter((i) => i.term === 'long_term').sort((a, b) => a.order - b.order) : []
  const completedCount = plan ? plan.filter((i) => i.completed).length : 0
  const progressPct = plan && plan.length > 0 ? Math.round((completedCount / plan.length) * 100) : 0

  return (
    <div className="page">
      <h2>Learning Plan</h2>
      <p className="muted">
        Your single, personal roadmap — built as you discuss priorities with the Career Coach across any of your analyses.
      </p>

      {status && !plan && (
        <div className="section">
          <p>{status}</p>
          <Link to="/coach"><Button>Talk to the Career Coach</Button></Link>
        </div>
      )}

      {plan && (
        <>
          <p className="muted">{completedCount} of {plan.length} done{saving ? ' · saving...' : ''}</p>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          </div>

          <h3>Short-term</h3>
          {shortTerm.length === 0 && <p className="muted">None.</p>}
          {shortTerm.map((item) => (
            <PlanItemRow key={item.order} item={item} onToggle={() => toggleItem(item.order)} onNoteChange={(e) => changeNote(item.order, e.target.value)} onNoteSave={saveNote} />
          ))}

          <h3 style={{ marginTop: 'var(--space-4)' }}>Long-term</h3>
          {longTerm.length === 0 && <p className="muted">None.</p>}
          {longTerm.map((item) => (
            <PlanItemRow key={item.order} item={item} onToggle={() => toggleItem(item.order)} onNoteChange={(e) => changeNote(item.order, e.target.value)} onNoteSave={saveNote} />
          ))}
        </>
      )}
    </div>
  )
}