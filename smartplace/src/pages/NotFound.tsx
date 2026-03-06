export default function NotFound() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
      <h1 style={{ fontSize: '3rem', margin: 0 }}>404</h1>
      <p style={{ fontSize: '1.2rem' }}>The page that you were looking for was not found!</p>
      <a href="/" style={{ padding: '0.5rem 1rem', background: 'var(--primary-color, #007bff)', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
        Go back home
      </a>
    </div>
  );
}

