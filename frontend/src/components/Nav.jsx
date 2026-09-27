import { NavLink } from 'react-router-dom'
import Button from './Button'

const linkStyle = ({ isActive }) => ({
  color: isActive ? 'var(--color-text)' : 'var(--color-text-muted)',
  fontWeight: isActive ? 600 : 500,
  paddingBottom: 4,
  borderBottom: isActive ? '2px solid var(--color-accent-bright)' : '2px solid transparent',
})

export default function Nav({ signOut }) {
  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        padding: '1.1rem var(--space-2)',
        borderBottom: '1px solid var(--color-border)',
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(8px)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        maxWidth: 'var(--content-width)',
        margin: '0 auto',
      }}
    >
      <span className="gradient-text" style={{ fontWeight: 700, marginRight: 'var(--space-2)' }}>
        Career Coach AI
      </span>
      <NavLink to="/" style={linkStyle} end>Home</NavLink>
      <NavLink to="/resume" style={linkStyle}>Resume</NavLink>
      <NavLink to="/job" style={linkStyle}>Job Description</NavLink>
      <NavLink to="/analyses" style={linkStyle}>Analyses</NavLink>
      <NavLink to="/coach" style={linkStyle}>Coach</NavLink>
      <span style={{ marginLeft: 'auto' }}>
        <Button variant="secondary" onClick={signOut}>Sign out</Button>
      </span>
    </nav>
  )
}