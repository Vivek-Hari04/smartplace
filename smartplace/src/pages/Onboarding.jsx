import React, { useState } from 'react';
import axios from 'axios';

export default function Onboarding({ user, role, accessToken, onComplete }) {
  const [loading, setLoading] = useState(false);
  
  const getInitialFormData = () => {
    if (role === 'student') {
      return { department: '', graduation_year: new Date().getFullYear() + 2, cgpa: '' };
    } else if (role === 'company') {
      return { company_name: '', website: '', industry: '', description: '', contact_person: '' };
    } else if (role === 'alumni') {
      return { company: '', graduation_year: new Date().getFullYear() - 1 };
    }
    return {};
  };

  const [formData, setFormData] = useState(getInitialFormData());

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let endpoint = '';
      if (role === 'student') endpoint = '/student/profile';
      else if (role === 'company') endpoint = '/company/profile';
      else if (role === 'alumni') endpoint = '/alumni/profile';

      await axios.put(`${import.meta.env.VITE_API_URL}${endpoint}`, formData, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      onComplete();
    } catch (err) {
      alert(err.response?.data?.error || 'Onboarding failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center',
      alignItems: 'center', zIndex: 9999, backdropFilter: 'blur(8px)'
    }}>
      <div className="modal-content" style={{
        background: 'var(--bg-secondary)', padding: '2.5rem', borderRadius: '24px',
        width: '100%', maxWidth: '500px', border: '1px solid var(--border-color)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        <h2 style={{ marginTop: 0, color: 'var(--text-primary)', fontSize: '1.75rem' }}>Welcome to SmartPlace</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Please complete your {role} profile to get started with the placement portal.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {role === 'student' && (
            <>
              <div className="form-group">
                <label>Department</label>
                <input 
                  type="text" className="form-input" required placeholder="e.g. Computer Science"
                  value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Graduation Year</label>
                <input 
                  type="number" className="form-input" required
                  value={formData.graduation_year} onChange={e => setFormData({...formData, graduation_year: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Current CGPA</label>
                <input 
                  type="number" step="0.01" min="0" max="10" className="form-input" required placeholder="e.g. 8.5"
                  value={formData.cgpa} onChange={e => setFormData({...formData, cgpa: e.target.value})}
                />
              </div>
            </>
          )}

          {role === 'alumni' && (
            <>
              <div className="form-group">
                <label>Current Company</label>
                <input 
                  type="text" className="form-input" required placeholder="e.g. Google, Microsoft"
                  value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Batch (Graduation Year)</label>
                <input 
                  type="number" className="form-input" required
                  value={formData.graduation_year} onChange={e => setFormData({...formData, graduation_year: e.target.value})}
                />
              </div>
            </>
          )}

          {role === 'company' && (
            <>
              <div className="form-group">
                <label>Company Name</label>
                <input 
                  type="text" className="form-input" required placeholder="Full Legal Name"
                  value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Industry</label>
                <input 
                  type="text" className="form-input" required placeholder="e.g. Technology, Finance"
                  value={formData.industry} onChange={e => setFormData({...formData, industry: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Website</label>
                <input 
                  type="url" className="form-input" placeholder="https://company.com"
                  value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Contact Person</label>
                <input 
                  type="text" className="form-input" required placeholder="HR Manager Name"
                  value={formData.contact_person} onChange={e => setFormData({...formData, contact_person: e.target.value})}
                />
              </div>
            </>
          )}

          <button 
            type="submit" className="btn btn-primary" disabled={loading}
            style={{ marginTop: '1rem', padding: '1rem', fontSize: '1rem', fontWeight: '600' }}
          >
            {loading ? 'Saving Profile...' : 'Complete Onboarding'}
          </button>
        </form>
      </div>
    </div>
  );
}
