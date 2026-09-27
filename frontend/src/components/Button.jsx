export default function Button({ variant = 'primary', children, ...props }) {
  const styles = {
    primary: {
      background: 'var(--gradient-brand)',
      color: '#FFFFFF',
      border: 'none',
      fontWeight: 600,
      boxShadow: props.disabled ? 'none' : 'var(--shadow-button)',
    },
    secondary: {
      background: 'transparent',
      color: 'var(--color-accent)',
      border: '1px solid rgba(13, 148, 136, 0.4)',
    },
    danger: {
      background: 'transparent',
      color: 'var(--color-danger)',
      border: '1px solid rgba(220, 38, 38, 0.35)',
    },
  }
  return (
    <button
      {...props}
      style={{
        ...styles[variant],
        fontFamily: 'inherit',
        fontSize: '1em',
        padding: '0.65em 1.3em',
        borderRadius: 10,
        cursor: props.disabled ? 'default' : 'pointer',
        opacity: props.disabled ? 0.5 : 1,
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        ...props.style,
      }}
      onMouseEnter={(e) => { if (!props.disabled) e.currentTarget.style.transform = 'translateY(-1px)' }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
    >
      {children}
    </button>
  )
}