import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/layout/DashboardLayout';
import Onboarding from './Onboarding';
import '../styles/Dashboard.css';

export default function CompanyDashboard({ user, accessToken }) {
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Data state
  const [profile, setProfile] = useState(null);
  const [drives, setDrives] = useState([]);
  const [offers, setOffers] = useState([]);
  const [selectedDriveId, setSelectedDriveId] = useState(null);
  const [applicants, setApplicants] = useState([]);

  const needsOnboarding = useMemo(() => {
    return profile && profile.user_id === null;
  }, [profile]);

  const api = useMemo(() => {
    return axios.create({
      baseURL: import.meta.env.VITE_API_URL,
      headers: { Authorization: `Bearer ${accessToken}` }
    });
  }, [accessToken]);

  const fetchData = async (tab) => {
    setLoading(true);
    setError(null);
    try {
      if (tab === 'home' || tab === 'profile') {
        const res = await api.get('/company/profile');
        setProfile(res.data);
      } else if (tab === 'drives') {
        const res = await api.get('/company/drives/my');
        setDrives(res.data);
      } else if (tab === 'offers') {
        const res = await api.get('/company/offers/my');
        setOffers(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);

  /* PROFILE UPDATE */
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    company_name: '',
    website: '',
    industry: '',
    description: '',
    contact_person: ''
  });

  useEffect(() => {
    if (profile) {
      setProfileForm({
        company_name: profile.company_name || '',
        website: profile.website || '',
        industry: profile.industry || '',
        description: profile.description || '',
        contact_person: profile.contact_person || ''
      });
    }
  }, [profile]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.put('/company/profile', profileForm);
      setProfile(res.data);
      setIsEditingProfile(false);
      alert('Profile updated successfully');
    } catch (err) {
      alert(err.response?.data?.error || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  /* DRIVE REQUEST */
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [driveForm, setDriveForm] = useState({
    drive_date: '',
    start_time: '',
    end_time: '',
    mode: 'online',
    drive_type: 'technical',
    location: '',
    meeting_link: ''
  });

  /* OFFER POSTING */
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerForm, setOfferForm] = useState({
    drive_id: '',
    title: '',
    description: '',
    package_lpa: '',
    location: '',
    acceptance_deadline: ''
  });

  const handleOfferPost = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post('/company/offers', offerForm);
      fetchData('offers');
      setShowOfferModal(false);
      alert('Job offer posted successfully');
    } catch (err) {
      alert(err.response?.data?.error || 'Offer posting failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDriveRequest = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post('/company/drives/request', driveForm);
      fetchData('drives');
      setShowDriveModal(false);
      alert('Drive request submitted for admin approval');
    } catch (err) {
      alert(err.response?.data?.error || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  /* APPLICANTS */
  const fetchApplicants = async (driveId) => {
    try {
      setLoading(true);
      const res = await api.get(`/company/drives/${driveId}/applicants`);
      setApplicants(res.data);
      setSelectedDriveId(driveId);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to fetch applicants');
    } finally {
      setLoading(false);
    }
  };

  const handleApplicantStatus = async (regId, status) => {
    try {
      await api.put(`/company/applicants/${regId}/status`, { status });
      setApplicants(prev => prev.map(a => a.registration_id === regId ? { ...a, status: status } : a));
    } catch (err) {
      alert('Status update failed');
    }
  };

  const sidebarItems = [
    { id: 'home', label: 'Dashboard' },
    { id: 'profile', label: 'Company Profile' },
    { id: 'drives', label: 'Placement Drives' },
    { id: 'offers', label: 'Job Offers' },
  ];

  const renderHome = () => (
    <div className="dashboard-grid">
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Total Drives</span>
            <span className="stat-value">{drives.length}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Active Offers</span>
            <span className="stat-value">{offers.length}</span>
          </div>
        </div>
      </div>

      <div className="content-row">
        <div className="content-card flex-2">
          <h3>Welcome, {profile?.company_name || user.email}</h3>
          <p>Use this portal to request placement drives, post job offers, and manage student applications.</p>
          {!profile?.company_name && (
            <div className="alert-banner warning">
              Please complete your company profile to start requesting drives.
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderProfile = () => (
    <section className="content-card">
      <div className="profile-header">
        <div className="user-avatar-large">{profile?.company_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}</div>
        <div className="profile-info">
          <h2>{profile?.company_name || 'Company Name'}</h2>
          <p>{user.email}</p>
        </div>
        {!isEditingProfile && (
          <button className="btn btn-secondary" onClick={() => setIsEditingProfile(true)}>
            Edit Profile
          </button>
        )}
      </div>

      {isEditingProfile ? (
        <form onSubmit={handleProfileUpdate} className="edit-profile-form">
          <div className="profile-details-grid">
            <div className="detail-group">
              <label>Company Name</label>
              <input 
                type="text" className="form-input" required
                value={profileForm.company_name}
                onChange={e => setProfileForm({...profileForm, company_name: e.target.value})}
              />
            </div>
            <div className="detail-group">
              <label>Website</label>
              <input 
                type="url" className="form-input"
                value={profileForm.website}
                onChange={e => setProfileForm({...profileForm, website: e.target.value})}
              />
            </div>
            <div className="detail-group">
              <label>Industry</label>
              <input 
                type="text" className="form-input"
                value={profileForm.industry}
                onChange={e => setProfileForm({...profileForm, industry: e.target.value})}
              />
            </div>
            <div className="detail-group">
              <label>Contact Person</label>
              <input 
                type="text" className="form-input"
                value={profileForm.contact_person}
                onChange={e => setProfileForm({...profileForm, contact_person: e.target.value})}
              />
            </div>
            <div className="detail-group" style={{ gridColumn: '1 / -1' }}>
              <label>Company Description</label>
              <textarea 
                className="form-input" style={{ height: '100px' }}
                value={profileForm.description}
                onChange={e => setProfileForm({...profileForm, description: e.target.value})}
              />
            </div>
          </div>
          <div className="action-row">
            <button type="submit" className="btn btn-primary">Save Changes</button>
            <button type="button" className="btn btn-secondary" onClick={() => setIsEditingProfile(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <div className="profile-details-grid">
          <div className="detail-group">
            <label>Industry</label>
            <p>{profile?.industry || 'Not Specified'}</p>
          </div>
          <div className="detail-group">
            <label>Website</label>
            <p><a href={profile?.website} target="_blank" rel="noreferrer">{profile?.website || 'Not Specified'}</a></p>
          </div>
          <div className="detail-group">
            <label>Contact Person</label>
            <p>{profile?.contact_person || 'Not Specified'}</p>
          </div>
        </div>
      )}
    </section>
  );

  const renderDrives = () => (
    <section className="content-card">
      <div className="tab-header" style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center' }}>
        <h3>Your Placement Drives</h3>
        <button className="btn btn-primary" onClick={() => setShowDriveModal(true)}>Request New Drive</button>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Mode</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {drives.length === 0 ? <tr><td colSpan={5} style={{textAlign:'center', padding:'2rem'}}>No drives requested yet</td></tr> : 
              drives.map(d => (
                <tr key={d.drive_id}>
                  <td>{new Date(d.drive_date).toLocaleDateString()}</td>
                  <td>{d.drive_type.toUpperCase()}</td>
                  <td>{d.mode.toUpperCase()}</td>
                  <td>
                    <span className={`status-badge ${d.status.toLowerCase()}`}>
                      {d.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => fetchApplicants(d.drive_id)}>View Applicants</button>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {selectedDriveId && (
        <div className="applicants-section" style={{ marginTop: '2rem' }}>
          <h4>Applicants for Drive #{selectedDriveId}</h4>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Department</th>
                  <th>CGPA</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applicants.map(a => (
                  <tr key={a.registration_id}>
                    <td>{a.fname} {a.lname}</td>
                    <td>{a.department}</td>
                    <td>{a.cgpa}</td>
                    <td><span className={`status-badge ${a.status}`}>{a.status}</span></td>
                    <td>
                      <select 
                        value={a.status} 
                        onChange={(e) => handleApplicantStatus(a.registration_id, e.target.value)}
                        className="form-input" style={{ width: 'auto', padding: '2px 8px' }}
                      >
                        <option value="registered">Registered</option>
                        <option value="shortlisted">Shortlist</option>
                        <option value="rejected">Reject</option>
                        <option value="selected">Select</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showDriveModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="modal-content" style={{ background: 'var(--bg-primary)', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '500px' }}>
            <h3>Request Placement Drive</h3>
            <form onSubmit={handleDriveRequest} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label>Date</label>
                <input type="date" className="form-input" required value={driveForm.drive_date} onChange={e => setDriveForm({...driveForm, drive_date: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group flex-1">
                  <label>Start Time</label>
                  <input type="time" className="form-input" required value={driveForm.start_time} onChange={e => setDriveForm({...driveForm, start_time: e.target.value})} />
                </div>
                <div className="form-group flex-1">
                  <label>End Time</label>
                  <input type="time" className="form-input" required value={driveForm.end_time} onChange={e => setDriveForm({...driveForm, end_time: e.target.value})} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group flex-1">
                  <label>Mode</label>
                  <select className="form-input" value={driveForm.mode} onChange={e => setDriveForm({...driveForm, mode: e.target.value})}>
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>
                <div className="form-group flex-1">
                  <label>Type</label>
                  <select className="form-input" value={driveForm.drive_type} onChange={e => setDriveForm({...driveForm, drive_type: e.target.value})}>
                    <option value="aptitude">Aptitude</option>
                    <option value="technical">Technical</option>
                    <option value="general">General</option>
                    <option value="hr">HR</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Location / Meeting Link</label>
                <input type="text" className="form-input" placeholder="Room 302 or Zoom link" value={driveForm.location} onChange={e => setDriveForm({...driveForm, location: e.target.value})} />
              </div>
              <div className="action-row" style={{ marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary">Submit Request</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowDriveModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );

  const renderOffers = () => (
    <section className="content-card">
      <div className="tab-header" style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center' }}>
        <h3>Your Job Offers</h3>
        <button className="btn btn-primary" onClick={() => setShowOfferModal(true)}>Post New Offer</button>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Drive Date</th>
              <th>Package (LPA)</th>
              <th>Deadline</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            {offers.length === 0 ? <tr><td colSpan={5} style={{textAlign:'center', padding:'2rem'}}>No offers posted yet</td></tr> : 
              offers.map(o => (
                <tr key={o.offer_id}>
                  <td><strong>{o.title}</strong></td>
                  <td>{new Date(o.drive_date).toLocaleDateString()}</td>
                  <td>{o.package_lpa}</td>
                  <td>{new Date(o.acceptance_deadline).toLocaleDateString()}</td>
                  <td>{o.location}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {showOfferModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="modal-content" style={{ background: 'var(--bg-primary)', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '500px' }}>
            <h3>Post New Job Offer</h3>
            <form onSubmit={handleOfferPost} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label>Associated Drive</label>
                <select className="form-input" required value={offerForm.drive_id} onChange={e => setOfferForm({...offerForm, drive_id: e.target.value})}>
                  <option value="">-- Select Approved Drive --</option>
                  {drives.filter(d => d.status === 'APPROVED').map(d => (
                    <option key={d.drive_id} value={d.drive_id}>
                      {new Date(d.drive_date).toLocaleDateString()} - {d.drive_type.toUpperCase()}
                    </option>
                  ))}
                </select>
                {drives.filter(d => d.status === 'APPROVED').length === 0 && (
                  <p style={{color: 'var(--danger-color)', fontSize: '0.8rem'}}>No approved drives found. You must have an approved drive to post an offer.</p>
                )}
              </div>
              <div className="form-group">
                <label>Job Title</label>
                <input type="text" className="form-input" required value={offerForm.title} onChange={e => setOfferForm({...offerForm, title: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Package (LPA)</label>
                <input type="number" step="0.1" className="form-input" required value={offerForm.package_lpa} onChange={e => setOfferForm({...offerForm, package_lpa: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Acceptance Deadline</label>
                <input type="date" className="form-input" required value={offerForm.acceptance_deadline} onChange={e => setOfferForm({...offerForm, acceptance_deadline: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input type="text" className="form-input" value={offerForm.location} onChange={e => setOfferForm({...offerForm, location: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea className="form-input" value={offerForm.description} onChange={e => setOfferForm({...offerForm, description: e.target.value})} />
              </div>
              <div className="action-row" style={{ marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary" disabled={!offerForm.drive_id}>Post Offer</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowOfferModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );

  return (
    <DashboardLayout
      user={user}
      sidebarItems={sidebarItems}
      activeItem={activeTab}
      onSidebarChange={setActiveTab}
      title="Company Recruiter Portal"
    >
      <header className="page-header">
        <h1 className="page-title">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
        <p className="page-subtitle">Managing placement and recruitment activities</p>
      </header>

      {needsOnboarding && (
        <Onboarding 
          user={user} 
          role="company" 
          accessToken={accessToken} 
          onComplete={() => fetchData(activeTab)} 
        />
      )}

      {loading && <div className="loading-spinner">Loading...</div>}
      {error && <div className="error-banner">{error}</div>}

      <div className="dashboard-content">
        {activeTab === 'home' && renderHome()}
        {activeTab === 'profile' && renderProfile()}
        {activeTab === 'drives' && renderDrives()}
        {activeTab === 'offers' && renderOffers()}
      </div>
    </DashboardLayout>
  );
}
