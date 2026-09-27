import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { getCoachMessages, sendCoachMessage } from '../api/client'

export default function Coach() {
  const { id } = useParams()
  const { accessToken } = useAuth()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [status, setStatus] = useState('Loading...')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!accessToken || !id) return
    getCoachMessages(accessToken, id)
      .then((history) => {
        setMessages(history)
        setStatus('')
      })
      .catch((err) => setStatus(err.message))
  }, [accessToken, id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e) {
    e.preventDefault()
    if (!input.trim()) return
    const question = input
    setInput('')
    setMessages((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, role: 'user', content: question, created_at: new Date().toISOString() },
    ])
    setSending(true)
    try {
      const reply = await sendCoachMessage(accessToken, id, question)
      setMessages((prev) => [...prev, reply])
    } catch (err) {
      setStatus(`Error: ${err.message}`)
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem', maxWidth: 640 }}>
      <p><Link to={`/analysis/${id}`}>← Back to analysis</Link></p>
      <h2>Career Coach</h2>
      {status && <p>{status}</p>}

      <div
        style={{
          border: '1px solid #ddd',
          borderRadius: 4,
          padding: '1rem',
          minHeight: 240,
          maxHeight: 400,
          overflowY: 'auto',
        }}
      >
        {messages.map((m) => (
          <p key={m.id} style={{ textAlign: m.role === 'user' ? 'right' : 'left' }}>
            <strong>{m.role === 'user' ? 'You' : 'Coach'}:</strong> {m.content}
          </p>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your fit for this role..."
          style={{ flex: 1 }}
        />
        <button type="submit" disabled={sending || !input.trim()}>
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  )
}