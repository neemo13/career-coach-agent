import { useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import Button from '../components/Button'

export default function Login() {
  const { signIn, signUp, signInWithGoogle } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [message, setMessage] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage('')
    const action = mode === 'signin' ? signIn : signUp
    const { error } = await action(email, password)
    if (error) setMessage(error.message)
    else if (mode === 'signup') setMessage('Check your email to confirm your account, then sign in.')
  }

  return (
    <div className="page" style={{ maxWidth: 360 }}>
      <h1>Career Coach</h1>
      <p className="muted">{mode === 'signin' ? 'Sign in to continue.' : 'Create an account to get started.'}</p>

      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </label>
        <Button type="submit">{mode === 'signin' ? 'Sign in' : 'Sign up'}</Button>
      </form>

      <p style={{ marginTop: 'var(--space-2)' }}>
        <a href="#" onClick={(e) => { e.preventDefault(); setMode(mode === 'signin' ? 'signup' : 'signin') }}>
          {mode === 'signin' ? "Need an account? Sign up" : 'Already have an account? Sign in'}
        </a>
      </p>

      <div className="section">
        <Button variant="secondary" onClick={signInWithGoogle}>Continue with Google</Button>
      </div>

      {message && <p style={{ color: 'var(--color-clay)' }}>{message}</p>}
    </div>
  )
}