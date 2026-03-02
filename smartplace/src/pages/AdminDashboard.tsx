import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import '../styles/Dashboard.css';
import DashboardLayout from '../components/layout/DashboardLayout';

interface Stats {
  totalStudents: number;
  verifiedStudents: number;
  totalFaculty: number;
  totalCourses: number;
  pendingDocuments: number;
}

interface PendingStudent {
  user_id: string;
  fname: string;
  lname: string;
  email: string;
  department: string;
  graduation_year: number;
  cgpa: number;
}

interface Faculty {
  user_id: string;
  fname: string;
  lname: string;
  email: string;
  department: string;
  is_staff_advisor: boolean;
}

interface Course {
  course_id: number;
  name: string;
  faculty_id: string;
  faculty_fname: string;
  faculty_lname: string;
  availability: boolean;
}

interface UserRecord {
  user_id: string;
  fname: string;
  lname: string;
  email: string;
  role: string;
  created_at: string;
}

export default function AdminDashboard({ user, accessToken }: { user: any; accessToken: string }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingStudents, setPendingStudents] = useState<PendingStudent[]>([]);
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [allUsers, setAllUsers] = useState<UserRecord[]>([]);

  // Modal/Form State
  const [showAdvisorModal, setShowAdvisorModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedAdvisorId, setSelectedAdvisorId] = useState('');

  const api = useMemo(() => {
    return axios.create({
      baseURL: import.meta.env.VITE_API_URL,
      headers: { Authorization: `Bearer ${accessToken}` }
    });
  }, [accessToken]);

  const fetchData = async (tab: string) => {
    setLoading(true);
    try {
      if (tab === 'overview') {
        const res = await api.get('/admin/stats');
        setStats(res.data);
      } else if (tab === 'students') {
        const res = await api.get('/admin/students/pending');
        setPendingStudents(res.data);
      } else if (tab === 'faculty') {
        const res = await api.get('/admin/faculty');
        setFacultyList(res.data);
      } else if (tab === 'courses') {
        const res = await api.get('/admin/courses');
        setCourses(res.data);
      } else if (tab === 'users') {
        const res = await api.get('/admin/users');
        setAllUsers(res.data);
      }
    } catch (err) {
      console.error(`Error fetching ${tab}:`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);

  /* ACTIONS */

  const handleVerifyStudent = async (id: string) => {
    try {
      await api.patch(`/admin/students/${id}/verify`);
      setPendingStudents(prev => prev.filter(s => s.user_id !== id));
      alert('Student verified successfully');
    } catch (err) {
      alert('Verification failed');
    }
  };

  const handleAssignAdvisor = async () => {
    if (!selectedStudentId || !selectedAdvisorId) return;
    try {
      await api.post('/admin/students/assign-advisor', {
        studentId: selectedStudentId,
        advisorId: selectedAdvisorId
      });
      alert('Advisor assigned successfully');
      setShowAdvisorModal(false);
    } catch (err) {
      alert('Assignment failed');
    }
  };

  const sidebarItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'students', label: 'Pending Students' },
    { id: 'faculty', label: 'Faculty List' },
    { id: 'courses', label: 'All Courses' },
    { id: 'users', label: 'User Directory' },
  ];

  return (
    <DashboardLayout
      user={user}
      sidebarItems={sidebarItems}
      activeItem={activeTab}
      onSidebarChange={setActiveTab}
      title="Admin Control"
    >
      <style>{`
        .admin-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }

        .stat-card {
          padding: 1.5rem;
          border-radius: 16px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          position: relative;
          overflow: hidden;
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.1);
        }

        .stat-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
        }

        .stat-blue::before { background: #3b82f6; }
        .stat-green::before { background: #10b981; }
        .stat-purple::before { background: #8b5cf6; }
        .stat-orange::before { background: #f59e0b; }

        .stat-label {
          color: var(--text-secondary);
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
          display: block;
        }

        .stat-value {
          font-size: 2.25rem;
          font-weight: 700;
          color: var(--text-primary);
          display: block;
        }

        .modern-table-card {
          background: var(--bg-secondary);
          border-radius: 16px;
          border: 1px solid var(--border-color);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .table-header-area {
          padding: 1.5rem;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modern-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modern-modal {
          background: var(--bg-primary);
          padding: 2rem;
          border-radius: 20px;
          width: 100%;
          max-width: 440px;
          border: 1px solid var(--border-color);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
        }

        .badge-pill {
          padding: 0.25rem 0.75rem;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.025em;
        }
      `}</style>

      <header className="page-header">
        <h1 className="page-title">Administrator Dashboard</h1>
        <p className="page-subtitle">Real-time system health and user oversight</p>
      </header>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && stats && (
        <div className="admin-stats-grid">
          <div className="stat-card stat-blue">
            <span className="stat-label">Total Students</span>
            <span className="stat-value">{stats.totalStudents}</span>
          </div>
          <div className="stat-card stat-green">
            <span className="stat-label">Verified Accounts</span>
            <span className="stat-value">{stats.verifiedStudents}</span>
          </div>
          <div className="stat-card stat-purple">
            <span className="stat-label">Total Faculty</span>
            <span className="stat-value">{stats.totalFaculty}</span>
          </div>
          <div className="stat-card stat-orange">
            <span className="stat-label">Pending Reviews</span>
            <span className="stat-value">{stats.pendingDocuments}</span>
          </div>
        </div>
      )}

      {/* TABLES SECTION */}
      <div className="modern-table-card">
        <div className="table-header-area">
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>
            {activeTab === 'students' ? 'Verification Queue' : 
             activeTab === 'faculty' ? 'Faculty Directory' :
             activeTab === 'courses' ? 'Academic Courses' :
             activeTab === 'users' ? 'User Directory' : 'System Activity'}
          </h2>
          {activeTab !== 'overview' && (
            <button className="btn btn-secondary" onClick={() => fetchData(activeTab)}>
              Refresh Data
            </button>
          )}
        </div>

        <div className="table-responsive">
          {activeTab === 'students' && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Department</th>
                  <th>Metrics</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingStudents.length === 0 ? <tr><td colSpan={4} style={{textAlign:'center', padding: '3rem'}}>All students are currently verified</td></tr> : 
                  pendingStudents.map(s => (
                    <tr key={s.user_id}>
                      <td>
                        <div className="user-details">
                          <span className="user-email-text">{s.fname} {s.lname}</span>
                          <span className="user-id-text">{s.email}</span>
                        </div>
                      </td>
                      <td>
                        <span className="badge-pill" style={{background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6'}}>
                          {s.department}
                        </span>
                        <div className="user-id-text" style={{marginTop: '4px'}}>Class of {s.graduation_year}</div>
                      </td>
                      <td><span style={{fontWeight: 600}}>GPA: {s.cgpa}</span></td>
                      <td className="action-buttons">
                        <button className="btn btn-primary" onClick={() => handleVerifyStudent(s.user_id)}>Verify</button>
                        <button className="btn btn-secondary" onClick={() => { setSelectedStudentId(s.user_id); setShowAdvisorModal(true); }}>Advisor</button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {activeTab === 'faculty' && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Faculty Member</th>
                  <th>Department</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {facultyList.map(f => (
                  <tr key={f.user_id}>
                    <td><strong>{f.fname} {f.lname}</strong><br/><span className="user-id-text">{f.email}</span></td>
                    <td>{f.department}</td>
                    <td>
                      {f.is_staff_advisor ? 
                        <span className="badge-pill" style={{background: 'rgba(16, 185, 129, 0.1)', color: '#10b981'}}>STAFF ADVISOR</span> : 
                        <span className="badge-pill" style={{background: 'rgba(107, 114, 128, 0.1)', color: '#6b7280'}}>FACULTY</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'courses' && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Course Name</th>
                  <th>Instructor</th>
                  <th>Enrollment</th>
                </tr>
              </thead>
              <tbody>
                {courses.map(c => (
                  <tr key={c.course_id}>
                    <td><span style={{fontWeight: 600, color: 'var(--text-primary)'}}>{c.name}</span></td>
                    <td>{c.faculty_fname} {c.faculty_lname}</td>
                    <td>
                      <span className="badge-pill" style={{
                        background: c.availability ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: c.availability ? '#10b981' : '#ef4444'
                      }}>
                        {c.availability ? 'OPEN' : 'CLOSED'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'users' && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Identity</th>
                  <th>Role</th>
                  <th>Registration Date</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map(u => (
                  <tr key={u.user_id}>
                    <td>
                      <div className="user-details">
                        <span className="user-email-text">{u.fname} {u.lname}</span>
                        <span className="user-id-text">{u.email}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge-pill" style={{background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6'}}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td><span className="user-id-text">{new Date(u.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          
          {activeTab === 'overview' && (
             <div style={{padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)'}}>
               Select a category from the sidebar to manage specific system entities.
             </div>
          )}
        </div>
      </div>

      {/* ADVISOR ASSIGNMENT MODAL */}
      {showAdvisorModal && (
        <div className="modern-modal-overlay">
          <div className="modern-modal">
            <h3 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Assign Staff Advisor</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Selected advisor will be responsible for verifying this student's placement documents.
            </p>
            <select 
              className="form-input" 
              style={{ width: '100%', marginBottom: '1.5rem', borderRadius: '10px', padding: '0.75rem' }}
              value={selectedAdvisorId}
              onChange={(e) => setSelectedAdvisorId(e.target.value)}
              onFocus={() => { if(facultyList.length === 0) fetchData('faculty'); }}
            >
              <option value="">-- Select Faculty Member --</option>
              {facultyList.map(f => (
                <option key={f.user_id} value={f.user_id}>
                  {f.fname} {f.lname} ({f.department})
                </option>
              ))}
            </select>
            <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowAdvisorModal(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ padding: '0.5rem 1.5rem' }} onClick={handleAssignAdvisor}>Assign Advisor</button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div style={{
          position: 'fixed', bottom: '2rem', right: '2rem', background: 'var(--bg-secondary)',
          padding: '0.75rem 1.25rem', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
          border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem', zIndex: 100
        }}>
          <div className="spinner-small" style={{ width: '16px', height: '16px', border: '2px solid var(--border-color)', borderTopColor: 'var(--accent-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Syncing...</span>
        </div>
      )}
      
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </DashboardLayout>
  );
}
