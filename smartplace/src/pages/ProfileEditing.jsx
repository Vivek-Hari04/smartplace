import { useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import '../styles/Dashboard.css';

export default function ProfileEditing({ user }) {
  const [activeTab, setActiveTab] = useState('profile');

  const sidebarItems = [
    { id: 'profile', label: 'Edit Profile' },
    { id: 'back', label: 'Back to Dashboard' },
  ];

  return (
    <DashboardLayout
      user={user}
      sidebarItems={sidebarItems}
      activeItem={activeTab}
      onSidebarChange={(id) => {
        if (id === 'back') {
          window.history.back();
        } else {
          setActiveTab(id);
        }
      }}
      title="Profile Settings"
    >
      <header className="page-header">
        <h1 className="page-title">Edit Profile</h1>
        <p className="page-subtitle">Update your personal information</p>
      </header>

      <section className="content-card">
        <form style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Full Name</label>
            <input 
              type="text" 
              defaultValue={user.user_metadata?.full_name || ''} 
              style={{
                padding: '0.75rem',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)'
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Email</label>
            <input 
              type="email" 
              defaultValue={user.email} 
              disabled
              style={{
                padding: '0.75rem',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-secondary)',
                cursor: 'not-allowed'
              }}
            />
          </div>
          <button className="btn btn-primary" type="button">Save Changes</button>
        </form>
      </section>
    </DashboardLayout>
  );
}
