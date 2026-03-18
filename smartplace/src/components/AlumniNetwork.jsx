import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import '../styles/Dashboard.css';

export default function AlumniNetwork({ accessToken }) {
  const [alumniList, setAlumniList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const api = useMemo(() => {
    return axios.create({
      baseURL: import.meta.env.VITE_API_URL,
      headers: { Authorization: `Bearer ${accessToken}` }
    });
  }, [accessToken]);

  useEffect(() => {
    const fetchDirectory = async () => {
      try {
        setLoading(true);
        const res = await api.get('alumni/directory');
        setAlumniList(res.data);
      } catch (err) {
        console.error('Failed to fetch alumni directory', err);
        setError('Failed to load alumni directory. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchDirectory();
  }, [api]);

  const filteredAlumni = useMemo(() => {
    if (!searchQuery) return alumniList;
    const query = searchQuery.toLowerCase();
    return alumniList.filter(alumnus => {
      const fullName = `${alumnus.fname || ''} ${alumnus.lname || ''}`.toLowerCase();
      const company = (alumnus.company || '').toLowerCase();
      const year = (alumnus.graduation_year || '').toString();
      return fullName.includes(query) || company.includes(query) || year.includes(query);
    });
  }, [alumniList, searchQuery]);

  if (loading) {
    return <div className="loading-spinner">Loading Alumni Network...</div>;
  }

  if (error) {
    return <div className="error-message" style={{ color: 'var(--danger)', padding: '1rem', textAlign: 'center' }}>{error}</div>;
  }

  return (
    <div className="alumni-network-container">
      <div className="network-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ margin: 0 }}>Alumni Directory</h2>
        <input
          type="text"
          className="form-input"
          placeholder="Search by name, company, or batch year..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '300px', maxWidth: '100%' }}
        />
      </div>

      {filteredAlumni.length === 0 ? (
        <div className="empty-state" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          <p>No alumni found matching your search.</p>
        </div>
      ) : (
        <div className="alumni-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filteredAlumni.map(alumnus => (
            <div key={alumnus.user_id} className="alumni-card content-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: 0 }}>
              <div className="alumni-card-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '0.5rem' }}>
                <div className="user-avatar-large" style={{ width: '50px', height: '50px', fontSize: '1.2rem', flexShrink: 0 }}>
                  {alumnus.fname ? alumnus.fname.charAt(0).toUpperCase() : '?'}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {alumnus.fname} {alumnus.lname}
                  </h3>
                  <span className="status-badge verified" style={{ fontSize: '0.75rem', marginTop: '0.25rem', display: 'inline-block' }}>Verified Alumni</span>
                </div>
              </div>

              <div className="alumni-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Company:</strong>
                  <span style={{ textAlign: 'right', fontWeight: '500' }}>{alumnus.company || 'Not Specified'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Batch:</strong>
                  <span>{alumnus.graduation_year || 'Not Specified'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Contact:</strong>
                  <a href={`mailto:${alumnus.email}`} style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '500' }}>Email Alumni</a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
