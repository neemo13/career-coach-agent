import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { listResumes, listJobs, runAnalysis, updateAnalysis } from '../api/client'
import Button from '../components/Button'

export default function NewAnalysis() {
  const { accessToken } = useAuth()
  const navigate = useNavigate()
  const [resumes, setResumes] = useState([])
  const [jobs, setJobs] = useState([])
  const [resumeId, setResumeId] = useState('')
  const [jobId, setJobId] = useState('')
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!accessToken) return
    listResumes(accessToken)
      .then((data) => {
        setResumes(data)
        if (data.length === 1) setResumeId(data[0].id)
      })
      .catch((err) => setStatus(err.message))
    listJobs(accessToken)
      .then((data) => {
        setJobs(data)
        if (data.length === 1) setJobId(data[0].id)
      })
      .catch((err) => setStatus(err.message))
  }, [accessToken])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!resumeId || !jobId) return
    setLoading(true)
    setStatus('Analyzing... this can take a few seconds.')
    try {
      const result = await runAnalysis(accessToken, {
        resume_id: resumeId,
        job_description_id: jobId,
        name: name.trim() || null,
      })
      if (note.trim()) {
        await updateAnalysis(accessToken, result.id, { note: note.trim() })
      }
      navigate(`/analysis/${result.id}`)
    } catch (err) {
      setStatus(`Error: ${err.message}`)
      setLoading(false)
    }
  }

  return (
    <div className="page" style={{ maxWidth: 480 }}>
      <p><Link to="/analyses">← All analyses</Link></p>
      <h2>Run New Analysis</h2>

      {resumes.length === 0 && <p className="muted">Upload a resume first on the Resume page.</p>}
      {jobs.length === 0 && <p className="muted">Save a job description first on the Job Description page.</p>}

      {resumes.length > 0 && jobs.length > 0 && (
        <form onSubmit={handleSubmit}>
          <label>
            Resume
            <select value={resumeId} onChange={(e) => setResumeId(e.target.value)} required>
              <option value="">Select a resume...</option>
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.file_name} — uploaded {new Date(r.created_at).toLocaleDateString()}
                </option>
              ))}
            </select>
          </label>

          <label>
            Job Description
            <select value={jobId} onChange={(e) => setJobId(e.target.value)} required>
              <option value="">Select a job description...</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title || '(untitled)'} — saved {new Date(j.created_at).toLocaleDateString()}
                </option>
              ))}
            </select>
          </label>

          <label>
            Name this analysis (optional)
            <input
              type="text"
              placeholder="e.g. Backend Engineer — Google"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label>
            Note (optional)
            <textarea
              placeholder="e.g. Checking whether my Python-heavy profile fits this role."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
          </label>

          <Button type="submit" disabled={!resumeId || !jobId || loading}>
            {loading ? 'Analyzing...' : 'Run Analysis'}
          </Button>

          {status && <p className="muted">{status}</p>}
        </form>
      )}
    </div>
  )
}