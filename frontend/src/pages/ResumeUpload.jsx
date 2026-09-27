import { useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { uploadResume, listResumes } from '../api/client'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'

export default function ResumeUpload() {
  const { accessToken } = useAuth()
  const [resumes, setResumes] = useState([])
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('')

  function refresh() {
    listResumes(accessToken)
      .then(setResumes)
      .catch((err) => setStatus(`Could not load resumes: ${err.message}`))
  }

  useEffect(() => {
    if (accessToken) refresh()
  }, [accessToken])

  async function handleUpload(e) {
    e.preventDefault()
    if (!file) return
    setStatus('Uploading...')
    try {
      await uploadResume(accessToken, file)
      setStatus('Uploaded successfully.')
      setFile(null)
      refresh()
    } catch (err) {
      setStatus(`Error: ${err.message}`)
    }
  }

  return (
    <div className="page">
      <h2>Resume</h2>

      <form onSubmit={handleUpload} style={{ flexDirection: 'row', alignItems: 'center' }}>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files[0] ?? null)}
        />
        <Button type="submit" disabled={!file}>Upload</Button>
      </form>
      {status && <p className="muted">{status}</p>}

      <div className="section">
        <h4>Your resumes</h4>
        {resumes.length === 0 && <EmptyState>No resumes uploaded yet.</EmptyState>}
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {resumes.map((r) => (
            <li key={r.id} style={{ borderBottom: '1px solid var(--color-hairline)', padding: '0.6em 0' }}>
              {r.file_name} <span className="muted">— {new Date(r.created_at).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}