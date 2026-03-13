import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/layout/DashboardLayout';
import PlacementGuidance from '../components/PlacementGuidance';
import Onboarding from './Onboarding';
import '../styles/Dashboard.css';

export default function AlumniDashboard({ user, accessToken }) {
  const [activeTab, setActiveTab] = useState('guidance');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  const api = useMemo(() => {
    return axios.create({
      baseURL: import.meta.env.VITE_API_URL,
      headers: { Authorization: `Bearer ${accessToken}` }
    });
  }, [accessToken]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('alumni/profile');
      setProfile(res.data);
    } catch (err) {
      console.error('Failed to fetch alumni profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const needsOnboarding = useMemo(() => {
    return profile && profile.user_id === null;
  }, [profile]);

  const sidebarItems = [
    { id: 'guidance', label: 'Doubt Clearance' },
    { id: 'network', label: 'Alumni Network' },
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
        <p className="page-subtitle">Help the next generation achieve their goals</p>
      </header>

      {needsOnboarding && (
        <Onboarding 
          user={user} 
          role="alumni" 
          accessToken={accessToken} 
          onComplete={fetchProfile} 
        />
      )}

      {loading && <div className="loading-spinner">Loading...</div>}

      <section className="content-card">
        {activeTab === 'guidance' ? (
          <PlacementGuidance accessToken={accessToken} userRole="alumni" />
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <h3>Welcome to the Alumni Network</h3>
            <p>This module section is currently being set up. Check back soon for updates!</p>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}
