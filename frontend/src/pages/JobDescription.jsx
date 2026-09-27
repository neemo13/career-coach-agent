import { useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { createJob, listJobs } from '../api/client'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'

export default function JobDescription() {
  const { accessToken } = useAuth()
  const [jobs, setJobs] = useState([])
  const [title, setTitle] = useState('')
  const [rawText, setRawText] = useState('')
  const [status, setStatus] = useState('')

  function refresh() {
    listJobs(accessToken)
      .then(setJobs)
      .catch((err) => setStatus(`Could not load job descriptions: ${err.message}`))
  }

  useEffect(() => {
    if (accessToken) refresh()
  }, [accessToken])

  async function handleSave(e) {
    e.preventDefault()
    if (!rawText.trim()) return
    setStatus('Saving...')
    try {
      await createJob(accessToken, { title, raw_text: rawText })
      setStatus('Saved.')
      setTitle('')
      setRawText('')
      refresh()
    } catch (err) {
      setStatus(`Error: ${err.message}`)
    }
  }

  return (
    <div className="page">
      <h2>Job Description</h2>

      <form onSubmit={handleSave}>
        <label>
          Title (optional)
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label>
          Description
          <textarea
            placeholder="Paste the job description here..."
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={10}
          />
        </label>
        <Button type="submit" disabled={!rawText.trim()}>Save</Button>
      </form>
      {status && <p className="muted">{status}</p>}

      <div className="section">
        <h4>Your saved job descriptions</h4>
        {jobs.length === 0 && <EmptyState>None saved yet.</EmptyState>}
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {jobs.map((j) => (
            <li key={j.id} style={{ borderBottom: '1px solid var(--color-hairline)', padding: '0.6em 0' }}>
              {j.title || '(untitled)'} <span className="muted">— {new Date(j.created_at).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}