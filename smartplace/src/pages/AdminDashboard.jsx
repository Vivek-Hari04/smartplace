import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../styles/Dashboard.css';
import DashboardLayout from '../components/layout/DashboardLayout';
 
export default function AdminDashboard({ user, accessToken }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [stats, setStats] = useState(null);
  const [pendingStudents, setPendingStudents] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [courses, setCourses] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allDrives, setAllDrives] = useState([]);
  const [driveSubTab, setDriveSubTab] = useState('active');
  const [registrants, setRegistrants] = useState([]);
  const [selectedDrive, setSelectedDrive] = useState(null);

  // Modal/Form State
  const [showAdvisorModal, setShowAdvisorModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingUserId, setRejectingUserId] = useState(null);
  const [rejectionForm, setRejectionForm] = useState({ reason: '', description: '' });
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [selectedAdvisorId, setSelectedAdvisorId] = useState('');

  // Filter State
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [minCgpa, setMinCgpa] = useState('');
  const [maxCgpa, setMaxCgpa] = useState('');
  const [placementEligible, setPlacementEligible] = useState('All');
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [departments, setDepartments] = useState([]);

  const api = useMemo(() => {
    return axios.create({
      baseURL: import.meta.env.VITE_API_URL,
      headers: { Authorization: `Bearer ${accessToken}` }
    });
  }, [accessToken]);

  const fetchData = async (tab) => {
    setLoading(true);
    try {
      if (tab === 'overview') {
        const res = await api.get('/admin/stats');
        setStats(res.data);
      } else if (tab === 'students') {
        const res = await api.get('/admin/students/pending');
        setPendingStudents(res.data);
      } else if (tab === 'pending-users') {
        const res = await api.get('/admin/users/pending');
        setPendingUsers(res.data);
      } else if (tab === 'faculty') {
        const res = await api.get('/admin/faculty');
        setFacultyList(res.data);
      } else if (tab === 'courses') {
        const res = await api.get('/admin/courses');
        setCourses(res.data);
      } else if (tab === 'users') {
        const res = await api.get('/admin/users');
        setAllUsers(res.data);
      } else if (tab === 'all-drives') {
        const res = await api.get('/admin/drives');
        console.log('All Drives API Response:', res.data);
        setAllDrives(res.data);
      }
    } catch (err) {
      console.error(`Error fetching ${tab}:`, err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get("/admin/departments");
      setDepartments(res.data);
    } catch (err) {
      console.error("Failed to fetch departments");
    }
  };

  useEffect(() => {
    if (activeTab === 'drives') {
      setActiveTab('all-drives');
      setDriveSubTab('pending');
      return;
    }

    fetchData(activeTab);

    if (activeTab === "filter-students") {
      fetchDepartments();
    }

    setSelectedDrive(null);
  }, [activeTab]);

  /* ACTIONS */

  const handleVerifyStudent = async (id) => {
    try {
      await api.patch(`/admin/students/${id}/verify`);
      setPendingStudents(prev => prev.filter(s => s.user_id !== id));
      alert('Student verified successfully');
    } catch (err) {
      alert('Verification failed');
    }
  };

  const handleVerifyUser = async (id) => {
    try {
      await api.patch(`/admin/users/${id}/verify`);
      setPendingUsers(prev => prev.filter(u => u.user_id !== id));
      alert('User approved successfully');
    } catch (err) {
      alert('Approval failed');
    }
  };

  const handleRejectUser = async () => {
    if (!rejectionForm.reason) return alert('Please provide a reason');
    try {
      await api.post(`/admin/users/${rejectingUserId}/reject`, rejectionForm);
      setPendingUsers(prev => prev.filter(u => u.user_id !== rejectingUserId));
      setShowRejectModal(false);
      setRejectionForm({ reason: '', description: '' });
      alert('User rejected successfully');
    } catch (err) {
      alert('Rejection failed');
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

  const handleDriveStatus = async (driveId, status) => {
    try {
      await api.patch(`/admin/drives/${driveId}/status`, { status });
      if (activeTab === 'all-drives') fetchData('all-drives');
      alert(`Drive ${status.toLowerCase()}ed successfully`);
    } catch (err) {
      alert('Status update failed');
    }
  };

  const fetchRegistrants = async (drive) => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/drives/${drive.drive_id}/registrants`);
      setRegistrants(res.data);
      setSelectedDrive(drive);
    } catch (err) {
      alert('Failed to fetch registrants');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilteredStudents = async () => {
    try {
      setLoading(true);
      let eligibleParam = undefined;
      if (placementEligible === 'Eligible') eligibleParam = 'true';
      if (placementEligible === 'Not Eligible') eligibleParam = 'false';

      const res = await api.get("/admin/students", {
        params: {
          departments: selectedDepartments.length > 0 ? selectedDepartments.join(",") : undefined,
          min_cgpa: minCgpa || undefined,
          max_cgpa: maxCgpa || undefined,
          placement_eligible: eligibleParam
        }
      });
      setFilteredStudents(res.data.students);
    } catch (error) {
      alert("Error fetching filtered students");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadFilteredPDF = () => {
    if (filteredStudents.length === 0) return;
    const doc = new jsPDF();
    doc.text("Filtered Student List", 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [["Name", "Email", "Department", "CGPA", "Placement"]],
      body: filteredStudents.map(s => [
        `${s.fname} ${s.lname || ''}`.trim(),
        s.email,
        s.department,
        s.cgpa,
        s.placement_eligible ? "Yes" : "No"
      ])
    });
    doc.save("filtered_students.pdf");
  };

  const handleDownloadPDF = () => {
    if (!selectedDrive || registrants.length === 0) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Add Title
    doc.setFontSize(20);
    doc.text(`Attendee List: ${selectedDrive.company_name}`, 14, 22);
    
    // Add Drive Info
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Drive Date: ${new Date(selectedDrive.drive_date).toLocaleDateString()}`, 14, 30);
    doc.text(`Type: ${selectedDrive.drive_type.toUpperCase()} | Mode: ${selectedDrive.mode.toUpperCase()}`, 14, 35);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 40);

    // Prepare Table Data
    const tableColumn = ["#", "Name", "Email", "Department", "CGPA", "Status"];
    const tableRows = registrants.map((r, index) => [
      index + 1,
      `${r.fname} ${r.lname}`,
      r.email,
      r.department,
      r.cgpa,
      r.status.toUpperCase()
    ]);

    // Add Table
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 50,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      didDrawPage: (data) => {
        // Footer / Watermark
        doc.setFontSize(10);
        doc.setTextColor(150);
        const footerText = "SmartPlace - Campus Recruitment Reimagined";
        const textWidth = doc.getTextWidth(footerText);
        doc.text(footerText, (pageWidth - textWidth) / 2, pageHeight - 10);
      }
    });

    // Save PDF
    doc.save(`Attendees_${selectedDrive.company_name.replace(/\s+/g, '_')}_${selectedDrive.drive_id}.pdf`);
  };

  const sidebarItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'pending-users', label: 'Approve Registrations' },
    { id: 'students', label: 'Pending Students' },
    { id: 'filter-students', label: 'Student Filter' },
    { id: 'all-drives', label: 'All Drives' },
    { id: 'faculty', label: 'Faculty List' },
    { id: 'courses', label: 'All Courses' },
    { id: 'users', label: 'User Directory' },
  ];

  const filteredDrives = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return allDrives.filter(d => {
      const driveDate = new Date(d.drive_date);
      driveDate.setHours(0, 0, 0, 0);

      if (driveSubTab === 'pending') {
        return d.status === 'PENDING';
      } else if (driveSubTab === 'active') {
        return d.status === 'APPROVED' && driveDate >= today;
      } else if (driveSubTab === 'past') {
        return (d.status === 'APPROVED' && driveDate < today) || d.status === 'REJECTED';
      }
      return true;
    });
  }, [allDrives, driveSubTab]);

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

        .user-identity-cell {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.5rem 0;
        }

        .user-avatar-circle {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: var(--bg-tertiary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: #3b82f6;
          border: 1px solid var(--border-color);
          text-transform: uppercase;
        }

        .user-info-stack {
          display: flex;
          flex-direction: column;
        }

        .user-name-text {
          font-weight: 600;
          color: var(--text-primary);
          font-size: 0.95rem;
        }

        .user-email-sub {
          font-size: 0.8rem;
          color: var(--text-secondary);
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
             activeTab === 'pending-users' ? 'Pending Registrations' :
             activeTab === 'filter-students' ? 'Student Filter' : 
             activeTab === 'all-drives' ? 'All Placement Drives' :
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
          {activeTab === 'pending-users' && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Identity</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.length === 0 ? <tr><td colSpan={4} style={{textAlign:'center', padding: '3rem'}}>No pending registrations</td></tr> : 
                  pendingUsers.map(u => (
                    <tr key={u.user_id}>
                      <td>
                        <div className="user-identity-cell">
                          <div className="user-avatar-circle">{u.fname[0]}{u.lname[0]}</div>
                          <div className="user-info-stack">
                            <span className="user-name-text">{u.fname} {u.lname}</span>
                            <span className="user-email-sub">{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge-pill" style={{background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6'}}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td><span className="user-id-text">{new Date(u.created_at).toLocaleDateString()}</span></td>
                      <td className="action-buttons">
                        <button className="btn btn-primary btn-sm" onClick={() => handleVerifyUser(u.user_id)}>Approve</button>
                        <button className="btn btn-danger btn-sm" onClick={() => { setRejectingUserId(u.user_id); setShowRejectModal(true); }}>Reject</button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

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
                        <div className="user-identity-cell">
                          <div className="user-avatar-circle">{s.fname[0]}{s.lname[0]}</div>
                          <div className="user-info-stack">
                            <span className="user-name-text">{s.fname} {s.lname}</span>
                            <span className="user-email-sub">{s.email}</span>
                          </div>
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

          {activeTab === 'all-drives' && (
            <div style={{ padding: '1.5rem' }}>
              {!selectedDrive ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <h3 style={{ margin: 0 }}>Placement Drives</h3>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Manage recruitment events across their lifecycle.
                      </p>
                    </div>
                    <div style={{ display: 'flex', background: 'var(--bg-tertiary)', padding: '0.3rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                      {[
                        { id: 'pending', label: 'Pending Requests' },
                        { id: 'active', label: 'Active Drives' },
                        { id: 'past', label: 'Past Drives' }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setDriveSubTab(tab.id)}
                          style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '10px',
                            border: 'none',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            background: driveSubTab === tab.id ? 'var(--bg-primary)' : 'transparent',
                            color: driveSubTab === tab.id ? '#3b82f6' : 'var(--text-secondary)',
                            boxShadow: driveSubTab === tab.id ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                          }}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Company</th>
                        <th>Date</th>
                        <th>Type / Mode</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDrives.length === 0 ? (
                        <tr><td colSpan={5} style={{textAlign:'center', padding: '3rem'}}>No {driveSubTab} drives found</td></tr>
                      ) : (
                        filteredDrives.map(d => (
                          <tr key={d.drive_id}>
                            <td><strong>{d.company_name || 'Unknown Company'}</strong></td>
                            <td>{new Date(d.drive_date).toLocaleDateString()}</td>
                            <td>
                               <span className="badge-pill" style={{background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6'}}>
                                {d.drive_type.toUpperCase()}
                              </span>
                              <div className="user-id-text" style={{marginTop: '4px'}}>{d.mode.toUpperCase()}</div>
                            </td>
                            <td>
                              <span className={`badge-pill ${d.status.toLowerCase()}`} style={{
                                background: d.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.1)' : 
                                            d.status === 'PENDING' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                color: d.status === 'APPROVED' ? '#10b981' : 
                                       d.status === 'PENDING' ? '#f59e0b' : '#ef4444'
                              }}>
                                {d.status}
                              </span>
                            </td>
                            <td className="action-buttons">
                              {d.status === 'PENDING' ? (
                                <>
                                  <button className="btn btn-primary btn-sm" onClick={() => handleDriveStatus(d.drive_id, 'APPROVED')}>Approve</button>
                                  <button className="btn btn-danger btn-sm" onClick={() => handleDriveStatus(d.drive_id, 'REJECTED')}>Reject</button>
                                </>
                              ) : (
                                <button className="btn btn-secondary btn-sm" onClick={() => fetchRegistrants(d)}>
                                  Details & Registrants
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </>
              ) : (
                <div className="drive-detail-container animate-fade-in">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <button className="btn btn-secondary" style={{ padding: '0.5rem' }} onClick={() => setSelectedDrive(null)}>
                      ← Back to List
                    </button>
                    <div>
                      <h2 style={{ margin: 0 }}>{selectedDrive.company_name}</h2>
                      <span className="user-id-text">Placement Drive ID: #{selectedDrive.drive_id}</span>
                    </div>
                  </div>

                  <div className="admin-stats-grid" style={{ marginBottom: '2rem' }}>
                    <div className="stat-card stat-blue">
                      <span className="stat-label">Drive Date & Time</span>
                      <span className="stat-value" style={{ fontSize: '1.25rem' }}>
                        {new Date(selectedDrive.drive_date).toLocaleDateString(undefined, { dateStyle: 'long' })}
                      </span>
                      <span className="user-id-text">{selectedDrive.start_time} - {selectedDrive.end_time}</span>
                    </div>
                    <div className="stat-card stat-purple">
                      <span className="stat-label">Configuration</span>
                      <span className="stat-value" style={{ fontSize: '1.25rem' }}>
                        {selectedDrive.drive_type} / {selectedDrive.mode}
                      </span>
                      <span className="user-id-text">{selectedDrive.location || 'Remote'}</span>
                    </div>
                    <div className="stat-card stat-green">
                      <span className="stat-label">Participation</span>
                      <span className="stat-value">{registrants.length}</span>
                      <span className="user-id-text">Registered Students</span>
                    </div>
                  </div>

                  {selectedDrive.meeting_link && (
                    <div style={{ marginBottom: '2rem', padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                      <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Meeting Link:</strong>
                      <a href={selectedDrive.meeting_link} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none' }}>
                        {selectedDrive.meeting_link}
                      </a>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0 }}>Registered Students</h3>
                    <button 
                      className="btn btn-primary" 
                      onClick={handleDownloadPDF}
                      disabled={registrants.length === 0}
                      style={{ padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <span style={{ fontSize: '1.2rem' }}>📄</span> Download Attendee PDF
                    </button>
                  </div>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Department</th>
                        <th>Academic Record</th>
                        <th>Application Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registrants.length === 0 ? (
                        <tr><td colSpan={4} style={{textAlign:'center', padding: '3rem'}}>No students registered yet</td></tr>
                      ) : (
                        registrants.map(r => (
                          <tr key={r.registration_id}>
                            <td>
                              <strong>{r.fname} {r.lname}</strong>
                              <div className="user-id-text">{r.email}</div>
                            </td>
                            <td>
                              <span className="badge-pill" style={{background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6'}}>
                                {r.department}
                              </span>
                            </td>
                            <td>
                              <div style={{ fontWeight: 600 }}>GPA: {r.cgpa}</div>
                            </td>
                            <td>
                              <span className={`badge-pill`} style={{
                                background: r.status === 'selected' ? 'rgba(16, 185, 129, 0.1)' : 
                                            r.status === 'rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                                color: r.status === 'selected' ? '#10b981' : 
                                       r.status === 'rejected' ? '#ef4444' : '#6b7280'
                              }}>
                                {r.status.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
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
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map(u => (
                  <tr key={u.user_id}>
                    <td>
                      <div className="user-identity-cell">
                        <div className="user-avatar-circle">{u.fname[0]}{u.lname[0]}</div>
                        <div className="user-info-stack">
                          <span className="user-name-text">{u.fname} {u.lname}</span>
                          <span className="user-email-sub">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge-pill" style={{background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6'}}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td><span className="user-id-text">{new Date(u.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</span></td>
                    <td>
                      {u.is_verified ? (
                         <span className="badge-pill" style={{background: 'rgba(16, 185, 129, 0.1)', color: '#10b981'}}>VERIFIED</span>
                      ) : (
                         <span className="badge-pill" style={{background: u.rejection_reason ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: u.rejection_reason ? '#ef4444' : '#f59e0b'}}>
                           {u.rejection_reason ? 'REJECTED' : 'PENDING'}
                         </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          
          {activeTab === 'filter-students' && (
            <div style={{ padding: '1.5rem' }}>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ marginBottom: '0.75rem', marginTop: 0 }}>Department</h4>
               {departments.map(dep => (
                <label 
                  key={dep.department}
                  style={{
                    marginRight: '1.25rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <input 
                    type="checkbox"
                    value={dep.department}
                    checked={selectedDepartments.includes(dep.department)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedDepartments([...selectedDepartments, dep.department]);
                      } else {
                        setSelectedDepartments(
                          selectedDepartments.filter(d => d !== dep.department)
                        );
                      }
                    }}
                  />
                  {dep.department}
                </label>
              ))}
              </div>

              <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div>
                  <h4 style={{ marginBottom: '0.75rem', marginTop: 0 }}>Min CGPA</h4>
                  <input 
                    type="number" 
                    className="form-input"
                    placeholder="e.g. 7.0" 
                    value={minCgpa} 
                    onChange={(e) => setMinCgpa(e.target.value)} 
                    style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', width: '150px' }}
                  />
                </div>
                <div>
                  <h4 style={{ marginBottom: '0.75rem', marginTop: 0 }}>Max CGPA</h4>
                  <input 
                    type="number" 
                    className="form-input"
                    placeholder="e.g. 10.0" 
                    value={maxCgpa} 
                    onChange={(e) => setMaxCgpa(e.target.value)} 
                    style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', width: '150px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ marginBottom: '0.75rem', marginTop: 0 }}>Placement Eligibility</h4>
                <select 
                  className="form-input"
                  value={placementEligible} 
                  onChange={(e) => setPlacementEligible(e.target.value)}
                  style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', minWidth: '200px' }}
                >
                  <option value="All">All</option>
                  <option value="Eligible">Eligible</option>
                  <option value="Not Eligible">Not Eligible</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <button className="btn btn-primary" onClick={fetchFilteredStudents}>
                  Apply Filter
                </button>
                <button className="btn btn-secondary" onClick={handleDownloadFilteredPDF} disabled={filteredStudents.length === 0}>
                  Download PDF
                </button>
              </div>

              {filteredStudents.length > 0 && (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Department</th>
                      <th>CGPA</th>
                      <th>Placement Eligible</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((s, index) => (
                      <tr key={index}>
                        <td>
                          <strong>{`${s.fname} ${s.lname || ''}`.trim()}</strong>
                        </td>
                        <td><span className="user-id-text">{s.email}</span></td>
                        <td>
                          <span className="badge-pill" style={{background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6'}}>
                            {s.department}
                          </span>
                        </td>
                        <td><span style={{fontWeight: 600}}>GPA: {s.cgpa}</span></td>
                        <td>
                          <span className={`badge-pill`} style={{
                            background: s.placement_eligible ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: s.placement_eligible ? '#10b981' : '#ef4444'
                          }}>
                            {s.placement_eligible ? "YES" : "NO"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
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

      {/* REJECTION MODAL */}
      {showRejectModal && (
        <div className="modern-modal-overlay">
          <div className="modern-modal">
            <h3 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Reject Registration</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Provide a reason for rejecting this registration request.
            </p>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Reason Flag</label>
              <select 
                className="form-input" 
                style={{ width: '100%', borderRadius: '10px', padding: '0.75rem' }}
                value={rejectionForm.reason}
                onChange={(e) => setRejectionForm({ ...rejectionForm, reason: e.target.value })}
              >
                <option value="">-- Select Reason --</option>
                <option value="Invalid Documents">Invalid Documents</option>
                <option value="Incomplete Profile">Incomplete Profile</option>
                <option value="Ineligible Candidate">Ineligible Candidate</option>
                <option value="Security Concerns">Security Concerns</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Description</label>
              <textarea 
                className="form-input" 
                rows="4"
                placeholder="Explain the reason for rejection..."
                style={{ width: '100%', borderRadius: '10px', padding: '0.75rem', resize: 'none' }}
                value={rejectionForm.description}
                onChange={(e) => setRejectionForm({ ...rejectionForm, description: e.target.value })}
              />
            </div>

            <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowRejectModal(false)}>Cancel</button>
              <button className="btn btn-danger" style={{ padding: '0.5rem 1.5rem' }} onClick={handleRejectUser}>Reject User</button>
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
