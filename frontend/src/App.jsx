
import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { useAuth } from './lib/AuthContext'
import { listAnalyses, listResumes, listJobs } from './api/client'

import Nav from './components/Nav'
import Button from './components/Button'
import Login from './pages/Login'
import ResumeUpload from './pages/ResumeUpload'
import JobDescription from './pages/JobDescription'
import Analyses from './pages/Analyses'
import NewAnalysis from './pages/NewAnalysis'
import AnalysisDetail from './pages/AnalysisDetail'
import LearningPlan from './pages/LearningPlan'
import Coach from './pages/Coach'
import CoachPicker from './pages/CoachPicker'

function Home() {
  const { user, accessToken } = useAuth()
  const [analyses, setAnalyses] = useState([])
  const [counts, setCounts] = useState({ resumes: 0, jobs: 0 })

  useEffect(() => {
    if (!accessToken) return
    listAnalyses(accessToken).then(setAnalyses).catch(() => {})
    listResumes(accessToken).then((r) => setCounts((c) => ({ ...c, resumes: r.length }))).catch(() => {})
    listJobs(accessToken).then((j) => setCounts((c) => ({ ...c, jobs: j.length }))).catch(() => {})
  }, [accessToken])

  const bestMatch = analyses.length > 0 ? Math.max(...analyses.map((a) => a.match_score)) : null
  const recent = [...analyses].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 3)

  return (
    <div className="page">
      <h1 className="gradient-text">Career Intelligence</h1>
      <p className="muted" style={{ fontSize: '1.1em' }}>
        Your current career readiness at a glance, {user.email}.
      </p>

      <div className="section" style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        <Link to="/analyses/new"><Button>Run New Analysis</Button></Link>
        <Link to="/coach"><Button variant="secondary">Open Career Coach</Button></Link>
        <Link to="/learning-plan"><Button variant="secondary">Learning Plan</Button></Link>
      </div>

      <div className="section" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-2)' }}>
        {[
          { label: 'Resumes', value: counts.resumes },
          { label: 'Job descriptions', value: counts.jobs },
          { label: 'Analyses', value: analyses.length },
          { label: 'Best match', value: bestMatch !== null ? `${bestMatch}%` : '—' },
        ].map((stat) => (
          <div key={stat.label} className="card">
            <h2 style={{ margin: 0 }} className="gradient-text">{stat.value}</h2>
            <p className="muted" style={{ margin: 0 }}>{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="section">
        <h4>Recent analyses</h4>
        {recent.length === 0 && <p className="muted">Nothing yet — run your first analysis above.</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          {recent.map((a) => (
            <Link key={a.id} to={`/analysis/${a.id}`} className="card" style={{ display: 'block', textDecoration: 'none' }}>
              <strong style={{ color: 'var(--color-text)' }}>{a.name || a.job_title || 'Untitled analysis'}</strong>
              <span className="muted"> — {a.match_score}% match</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const { user, loading, signOut } = useAuth()

  if (loading) {
    return <p style={{ padding: '2rem' }}>Loading...</p>
  }

  if (!user) {
    return <Login />
  }

  return (
    <BrowserRouter>
      <Nav signOut={signOut} />

      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/resume" element={<ResumeUpload />} />

        <Route path="/job" element={<JobDescription />} />

        <Route path="/analyses" element={<Analyses />} />

        <Route path="/analyses/new" element={<NewAnalysis />} />

        <Route path="/analysis/:id" element={<AnalysisDetail />} />

        <Route path="/learning-plan" element={<LearningPlan />} />

        <Route path="/coach" element={<CoachPicker />} />

        <Route path="/coach/:id" element={<Coach />} />
      </Routes>
    </BrowserRouter>
  )
}

