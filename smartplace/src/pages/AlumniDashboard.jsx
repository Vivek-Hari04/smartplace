import { useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import '../styles/Dashboard.css';

export default function AlumniDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('network');

  const sidebarItems = [
    { id: 'network', label: 'Alumni Network' },
    { id: 'mentorship', label: 'Mentorship' },
    { id: 'jobs', label: 'Post Jobs' },
  ];

  return (
    <DashboardLayout
      user={user}
      sidebarItems={sidebarItems}
      activeItem={activeTab}
      onSidebarChange={setActiveTab}
      title="Alumni Connect"
    >
      <header className="page-header">
        <h1 className="page-title">Alumni Dashboard</h1>
        <p className="page-subtitle">Connect with your alma mater and peers</p>
      </header>

      <section className="content-card">
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <h3>Welcome to the Alumni Network</h3>
          <p>This module is currently being set up. Check back soon for updates!</p>
        </div>
      </section>
    </DashboardLayout>
  );
}
