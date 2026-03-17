import React, { useState } from 'react';
import axios from 'axios';

export default function AlumniProfile({ user, profile, accessToken, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Initialize form data, parsing first and last name from user metadata or profile
  const [formData, setFormData] = useState({
    fname: profile?.fname || user?.user_metadata?.full_name?.split(' ')[0] || '',
    lname: profile?.lname || user?.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
    company: profile?.company || '',
    graduation_year: profile?.graduation_year || new Date().getFullYear() - 1
  });
  
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/alumni/profile`, formData, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false); // Switch back to view mode on success
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update profile. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
      <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Alumni Profile</h2>
      
      {message.text && (
        <div style={{
          padding: '1rem',
          marginBottom: '1.5rem',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          color: message.type === 'success' ? 'var(--success-color)' : 'var(--danger-color)',
          border: `1px solid ${message.type === 'success' ? 'var(--success-color)' : 'var(--danger-color)'}`
        }}>
          {message.text}
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>First Name</label>
              <input 
                type="text" 
                required
                value={formData.fname} 
                onChange={e => setFormData({...formData, fname: e.target.value})}
                style={{
                  padding: '0.75rem',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
            
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Last Name</label>
              <input 
                type="text" 
                required
                value={formData.lname} 
                onChange={e => setFormData({...formData, lname: e.target.value})}
                style={{
                  padding: '0.75rem',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          </div>
          
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Current Company</label>
            <input 
              type="text" 
              required
              value={formData.company} 
              onChange={e => setFormData({...formData, company: e.target.value})}
              style={{
                padding: '0.75rem',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          {/* Read-only fields in edit mode */}
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Email (Cannot be changed)</label>
            <input 
              type="email" 
              defaultValue={user?.email || profile?.email || ''} 
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

          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Graduation Year (Cannot be changed)</label>
            <input 
              type="number" 
              defaultValue={formData.graduation_year} 
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => {
                setIsEditing(false);
                // Reset form to current profile data
                setFormData({
                  fname: profile?.fname || user?.user_metadata?.full_name?.split(' ')[0] || '',
                  lname: profile?.lname || user?.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
                  company: profile?.company || '',
                  graduation_year: profile?.graduation_year || new Date().getFullYear() - 1
                });
                setMessage({ type: '', text: '' });
              }}
              disabled={loading}
              style={{ padding: '0.75rem 1.5rem' }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
              style={{ padding: '0.75rem 1.5rem' }}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      ) : (
        <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
            <div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Full Name</p>
              <p style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: '500', margin: 0 }}>
                {profile?.fname} {profile?.lname}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Email Address</p>
              <p style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: '500', margin: 0 }}>
                {profile?.email || user?.email}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Current Company</p>
              <p style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: '500', margin: 0 }}>
                {profile?.company || 'Not specified'}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Graduation Year</p>
              <p style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: '500', margin: 0 }}>
                {profile?.graduation_year || 'Not specified'}
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <button 
              className="btn btn-primary" 
              onClick={() => setIsEditing(true)}
              style={{ padding: '0.75rem 2rem' }}
            >
              Edit Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
