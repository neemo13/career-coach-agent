// Single place that knows the backend's base URL.
// WHY: every other file imports from here instead of hardcoding the URL,
// so switching from localhost to the deployed backend (Phase 8) is a one-line env change.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export async function getHealth() {
  const res = await fetch(`${API_BASE_URL}/health`)
  if (!res.ok) throw new Error(`Backend health check failed: ${res.status}`)
  return res.json()
}

export async function getDbHealth() {
  const res = await fetch(`${API_BASE_URL}/health/db`)
  if (!res.ok) throw new Error(`DB health check failed: ${res.status}`)
  return res.json()
}

// Every authenticated call attaches the Supabase access token as a Bearer
// token. The backend verifies it (app/core/security.py) before doing anything.
export async function getMe(accessToken) {
  const res = await fetch(`${API_BASE_URL}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || `Request failed: ${res.status}`)
  }
  return res.json()
}

// --- Phase 3: resumes ---

export async function uploadResume(accessToken, file) {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${API_BASE_URL}/resumes`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || `Upload failed: ${res.status}`)
  }
  return res.json()
}

export async function listResumes(accessToken) {
  const res = await fetch(`${API_BASE_URL}/resumes`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || `Request failed: ${res.status}`)
  }
  return res.json()
}

// --- Phase 3: job descriptions ---

export async function createJob(accessToken, { title, raw_text }) {
  const res = await fetch(`${API_BASE_URL}/jobs`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, raw_text }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || `Request failed: ${res.status}`)
  }
  return res.json()
}

export async function listJobs(accessToken) {
  const res = await fetch(`${API_BASE_URL}/jobs`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || `Request failed: ${res.status}`)
  }
  return res.json()
}

// --- Phase 4: analysis ---

export async function runAnalysis(accessToken, { resume_id, job_description_id, name }) {
  const res = await fetch(`${API_BASE_URL}/analysis`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ resume_id, job_description_id, name }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || `Analysis failed: ${res.status}`)
  }
  return res.json()
}

export async function listAnalyses(accessToken) {
  const res = await fetch(`${API_BASE_URL}/analysis`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || `Request failed: ${res.status}`)
  }
  return res.json()
}

export async function getAnalysisById(accessToken, analysisId) {
  const res = await fetch(`${API_BASE_URL}/analysis/${analysisId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || `Request failed: ${res.status}`)
  }
  return res.json()
}

export async function updateAnalysis(accessToken, analysisId, { name, note }) {
  const res = await fetch(`${API_BASE_URL}/analysis/${analysisId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, note }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || `Update failed: ${res.status}`)
  }
  return res.json()
}

export async function deleteAnalysis(accessToken, analysisId) {
  const res = await fetch(`${API_BASE_URL}/analysis/${analysisId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || `Delete failed: ${res.status}`)
  }
  return true
}


// --- Phase 5: learning plan ---

export async function getLearningPlan(accessToken) {
  const res = await fetch(`${API_BASE_URL}/learning-plan`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    // 404 can mean no analysis exists, no skill gaps exist,
    // or the best-match analysis does not have a generated plan yet.
    throw new Error(body.detail || `Request failed: ${res.status}`)
  }
  return res.json()
}	

// --- Phase 6: career coach chat ---

export async function sendCoachMessage(accessToken, analysisId, message) {
  const res = await fetch(`${API_BASE_URL}/coach/chat`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ analysis_id: analysisId, message }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || `Message failed: ${res.status}`)
  }
  return res.json()
}

export async function getCoachMessages(accessToken, analysisId) {
  const res = await fetch(`${API_BASE_URL}/coach/${analysisId}/messages`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || `Request failed: ${res.status}`)
  }
  return res.json()
}

export async function updateLearningPlan(accessToken, plan) {
  const res = await fetch(`${API_BASE_URL}/learning-plan`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ plan }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || `Update failed: ${res.status}`)
  }
  return res.json()
}