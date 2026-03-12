import { supabase } from '../lib/supabase'

export default function NavBar({ user }) {
  const handleLogout = () => supabase.auth.signOut();

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.75rem 2rem',
      borderBottom: '1px solid #ccc',
      backgroundColor: '#fff',
    }}>
      <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>SmartPlace</span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <span style={{ cursor: 'pointer' }} title="Notifications">🔔</span>
        <span style={{ cursor: 'pointer' }} title="Messages">💬</span>
        <span style={{ cursor: 'pointer' }} title="Settings">⚙️</span>

        <span style={{ fontWeight: '500' }}>
          {user?.fname || 'User'}
        </span>

        <button
          onClick={handleLogout}
          style={{
            padding: '0.4rem 1rem',
            cursor: 'pointer',
            border: '1px solid #ccc',
            borderRadius: '4px',
            backgroundColor: '#f5f5f5',
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  )
}
