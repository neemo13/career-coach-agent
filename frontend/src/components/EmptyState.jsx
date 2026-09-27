export default function EmptyState({ children }) {
  return (
    <p className="muted" style={{ padding: 'var(--space-2) 0' }}>
      {children}
    </p>
  )
}