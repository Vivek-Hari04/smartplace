import { useMemo, useState, useEffect } from "react";
import axios from "axios";
import DashboardLayout from "../components/layout/DashboardLayout";
import Onboarding from "./Onboarding";
import "../styles/Dashboard.css";

export default function StudentDashboard({
  user,
  accessToken
}) {
  const [activeTab, setActiveTab] = useState("home");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Data states
  const [profile, setProfile] = useState(null);
  const [courses, setCourses] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [slots, setSlots] = useState([]);
  const [offers, setOffers] = useState([]);

  const [courseTab, setCourseTab] = useState("enrolled");
  const [isMaterialsModalOpen, setIsMaterialsModalOpen] = useState(false);
  const [currentMaterials, setCurrentMaterials] = useState([]);

  // Submission Modal State
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [currentAssessmentData, setCurrentAssessmentData] = useState(null);
  const [submissionUrl, setSubmissionUrl] = useState("");

  const needsOnboarding = useMemo(() => {
    return profile && profile.user_id === null;
  }, [profile]);

  // Stats for the home overview (using actual data where possible)
  const stats = [
    { label: "CGPA", value: profile?.cgpa || "N/A" },
    { label: "Courses", value: courses.length.toString() },
    { label: "Drives", value: slots.length.toString() },
    { label: "Offers", value: offers.length.toString() }
  ];

  const api = useMemo(() => {
    return axios.create({
      baseURL: `${import.meta.env.VITE_API_URL}/student`,
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
  }, [accessToken]);

  const handleError = (err) => {
    console.error("Student API Error:", err);
    if (err.response) {
      return `Server Error (${err.response.status}): ${err.response.data?.error || "Backend error"}`;
    }
    if (err.request) return "Network Error: Backend not reachable";
    return "Unexpected error occurred";
  };

  const fetchData = async (tab) => {
    try {
      setLoading(true);
      setError(null);
      if (tab === "home" || tab === "profile") {
        const res = await api.get("/profile");
        setProfile(res.data);
      } else if (tab === "courses") {
        const res = await api.get("/courses/enrolled");
        setCourses(res.data);
        setCourseTab("enrolled");
      } else if (tab === "assessments") {
        const res = await api.get("/assessments/upcoming");
        setAssessments(res.data);
      } else if (tab === "slots") {
        const res = await api.get("/slots/available");
        setSlots(res.data);
      } else if (tab === "offers") {
        const res = await api.get("/offers/eligible");
        setOffers(res.data);
      }
    } catch (err) {
      setError(handleError(err));
    } finally {
      setLoading(false);
    }
  };

  const sidebarItems = [
    { id: "home", label: "Dashboard" },
    { id: "profile", label: "Profile" },
    { id: "courses", label: "Courses" },
    { id: "assessments", label: "Assessments" },
    { id: "slots", label: "Placement Slots" },
    { id: "offers", label: "Job Offers" },
    { id: "documents", label: "Documents" }
  ];

  const renderHome = () => (
    <div className="dashboard-grid">
      <div className="stats-container">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-info">
              <span className="stat-label">{stat.label}</span>
              <span className="stat-value">{stat.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="content-row">
        <div className="content-card flex-2">
          <h3>Upcoming Assessments</h3>
          <div className="list-container">
            {assessments.slice(0, 3).map((a, i) => (
              <div key={i} className="list-item">
                <div className="item-info">
                  <span className="item-title">{a.title}</span>
                  <span className="item-date">{new Date(a.deadline).toLocaleDateString()}</span>
                </div>
                <span className="status-badge pending">Upcoming</span>
              </div>
            ))}
            {assessments.length === 0 && <p>No upcoming assessments</p>}
          </div>
        </div>

        <div className="content-card flex-1">
          <h3>Recent Drive Registrations</h3>
          <div className="list-container">
            {slots.filter(s => s.registration_id).slice(0, 3).map((s, i) => (
              <div key={i} className="list-item">
                <div className="item-info">
                  <span className="item-title">{s.company_name}</span>
                </div>
                <span className={`status-badge ${s.status}`}>{s.status}</span>
              </div>
            ))}
            {slots.filter(s => s.registration_id).length === 0 && <p>No recent registrations</p>}
          </div>
        </div>
      </div>
    </div>
  );

  const [isEditing, setIsEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    cgpa: "",
    department: "",
    graduation_year: ""
  });

  // Fetch data automatically on tab change or mount
  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);

  // Update form when data is fetched
  useEffect(() => {
    if (profile) {
      setProfileForm({
        cgpa: profile.cgpa || "",
        department: profile.department || "",
        graduation_year: profile.graduation_year || ""
      });
    }
  }, [profile]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.put("/profile", profileForm);
      setProfile(res.data);
      setIsEditing(false);
    } catch (err) {
      setError(handleError(err));
    } finally {
      setLoading(false);
    }
  };

  const renderProfile = () => (
    <section className="content-card">
      <div className="profile-header">
        <div className="user-avatar-large">{user.email?.charAt(0).toUpperCase()}</div>
        <div className="profile-info">
          <h2>{profile ? `${profile.fname} ${profile.lname || ""}` : "Student Name"}</h2>
          <p>{user.email}</p>
          <span className={`status-badge ${profile?.is_verified ? 'verified' : 'pending'}`}>
            {profile?.is_verified ? 'Verified Student' : 'Verification Pending'}
          </span>
        </div>
        {!isEditing && (
          <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>
            Edit Profile
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleProfileUpdate} className="edit-profile-form">
          <div className="profile-details-grid">
            <div className="detail-group">
              <label>Department</label>
              <input
                type="text"
                className="form-input"
                value={profileForm.department}
                onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                placeholder="e.g. Computer Science"
                required
              />
            </div>
            <div className="detail-group">
              <label>Graduation Year</label>
              <input
                type="number"
                className="form-input"
                value={profileForm.graduation_year}
                onChange={(e) => setProfileForm({ ...profileForm, graduation_year: e.target.value })}
                placeholder="e.g. 2026"
                required
              />
            </div>
            <div className="detail-group">
              <label>Current CGPA</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                className="form-input"
                value={profileForm.cgpa}
                onChange={(e) => setProfileForm({ ...profileForm, cgpa: e.target.value })}
                placeholder="e.g. 9.2"
                required
              />
            </div>
            <div className="detail-group">
              <label>Advisor Status</label>
              <p>{profile?.advisor_id ? "Assigned" : "Not Assigned"}</p>
            </div>
          </div>
          <div className="action-row">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="profile-details-grid">

          <div className="detail-group">
            <label>Department</label>
            <p>{profile?.department || "Not Specified"}</p>
          </div>

          <div className="detail-group">
            <label>Batch</label>
            <p>{profile?.graduation_year || "Not Specified"}</p>
          </div>

          <div className="detail-group">
            <label>Current CGPA</label>
            <p>{profile?.cgpa || "Not Specified"}</p>
          </div>

          <div className="detail-group">
            <label>Email</label>
            <p>{profile?.email}</p>
          </div>

          <div className="detail-group">
            <label>Placement Eligibility</label>
            <p>{profile?.placement_eligible ? "Eligible" : "Not Eligible"}</p>
          </div>

          <div className="detail-group">
            <label>Verification Status</label>
            <p>{profile?.is_verified ? "Verified" : "Pending Verification"}</p>
          </div>

          <div className="detail-group">
            <label>Advisor</label>
            <p>{profile?.advisor_fname ? `${profile.advisor_fname} ${profile.advisor_lname}` : "Pending Assignment"}</p>
          </div>

        </div>
      )}

      {/* {profile && <pre className="debug-data">{JSON.stringify(profile, null, 2)}</pre>} */}
    </section>
  );

  const renderCourses = () => (
    <section className="content-card">
      <div className="tab-header">
        <button className={`btn ${courseTab === 'enrolled' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => fetchData("courses")}>My Enrolled Courses</button>
        <button className={`btn ${courseTab === 'available' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => {
          api.get("/courses/available").then(res => {
            setCourses(res.data);
            setCourseTab("available");
          });
        }}>Available Courses</button>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Course Name</th>
              <th>Instructor</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {courses.length === 0 ? <tr><td colSpan={3} style={{ textAlign: 'center' }}>No courses found</td></tr> :
              courses.map((course) => (
                <tr key={course.course_id}>
                  <td>{course.name}</td>
                  <td>{course.faculty_fname} {course.faculty_lname}</td>
                  <td>
                    {courseTab === 'enrolled' ? (
                      <button className="btn btn-secondary btn-sm" onClick={async () => {
                        try {
                          const res = await api.get(`/courses/${course.course_id}/materials`);
                          setCurrentMaterials(res.data);
                          setIsMaterialsModalOpen(true);
                        } catch (err) {
                          alert("Failed to load materials");
                        }
                      }}>View Materials</button>
                    ) : (
                      <button className="btn btn-primary btn-sm" onClick={async () => {
                        try {
                          await api.post(`/courses/enroll/${course.course_id}`);
                          alert("Enrolled successfully!");
                          // Follow user requirement: refresh both lists.
                          // Best way is to just fetch available again to update the current list.
                          const res = await api.get("/courses/available");
                          setCourses(res.data);
                        } catch (err) {
                          alert("Failed to enroll");
                        }
                      }}>Enroll</button>
                    )}
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>


    </section>
  );

  const renderAssessments = () => (
    <section className="content-card">
      <div className="tab-header">
        <button className="btn btn-primary" onClick={() => fetchData("assessments")}>Upcoming Tests</button>
        <button className="btn btn-secondary" onClick={() => api.get("/assessments/history").then(res => setAssessments(res.data))}>History</button>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Topic</th>
              <th>Course</th>
              <th>Deadline</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {assessments.length === 0 ? <tr><td colSpan={4} style={{ textAlign: 'center' }}>No assessments found</td></tr> :
              assessments.map((a) => (
                <tr key={a.assessment_id}>
                  <td>{a.title}</td>
                  <td>{a.course_name}</td>
                  <td>{new Date(a.deadline).toLocaleString()}</td>
                  <td>
                    {a.score !== undefined && a.score !== null ? (
                      <span>Score: {a.score}</span>
                    ) : (
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={async () => {
                          try {
                            const res = await api.get(`/assessments/${a.assessment_id}/start`);
                            setCurrentAssessmentData(res.data);
                            setIsSubmissionModalOpen(true);
                          } catch (err) {
                            alert("Failed to fetch assessment details.");
                          }
                        }}
                      >
                        Start Test
                      </button>
                    )}
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderSlots = () => (
    <section className="content-card">
      <div className="tab-header" style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center' }}>
        <h3>Available Placement Drives</h3>
        <div className="tab-actions">
          <button className="btn btn-primary" onClick={() => fetchData("slots")}>Refresh Available</button>
          <button className="btn btn-secondary" onClick={() => api.get("/slots/my").then(res => setSlots(res.data))}>My Registrations</button>
        </div>
      </div>

      <p className="page-subtitle">Select and apply for upcoming company recruitment drives</p>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Date</th>
              <th>Type</th>
              <th>Mode</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {slots.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No drives found for this category</td></tr>
            ) : (
              slots.map((drive) => (
                <tr key={drive.drive_id}>
                  <td><strong>{drive.company_name || 'TBA'}</strong></td>
                  <td>{new Date(drive.drive_date).toLocaleDateString()}</td>
                  <td>{drive.drive_type?.toUpperCase()}</td>
                  <td>{drive.mode?.toUpperCase()}</td>
                  <td>
                    <span className={`status-badge ${drive.status || 'available'}`}>
                      {drive.status || 'Available'}
                    </span>
                  </td>
                  <td>
                    {!drive.registration_id ? (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={async () => {
                          try {
                            await api.post("/slots/book", { driveId: drive.drive_id });
                            alert("Successfully applied for the drive!");
                            fetchData("slots");
                          } catch (err) {
                            alert("Failed to apply");
                          }
                        }}
                      >
                        Apply Now
                      </button>
                    ) : (
                      <button className="btn btn-secondary btn-sm" disabled>Applied</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderOffers = () => (
    <section className="content-card">
      <div className="tab-header">
        <button className="btn btn-primary" onClick={() => fetchData("offers")}>View Eligible Offers</button>
        <button className="btn btn-secondary" onClick={() => api.get("/offers/applications").then(res => setOffers(res.data))}>My Applications</button>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Role</th>
              <th>Package (CTC)</th>
              <th>Deadline</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {offers.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>No offers found in this category</td></tr>
            ) : (
              offers.map((offer) => (
                <tr key={offer.offer_id || offer.application_id}>
                  <td><strong>{offer.fname} {offer.lname}</strong></td>
                  <td>{offer.title}</td>
                  <td>{offer.package_lpa} LPA</td>
                  <td>{new Date(offer.acceptance_deadline || offer.applied_at).toLocaleDateString()}</td>
                  <td>
                    {offer.application_id ? (
                      <span className={`status-badge ${offer.status}`}>{offer.status.toUpperCase()}</span>
                    ) : (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={async () => {
                          try {
                            await api.post("/offers/apply", { offerId: offer.offer_id });
                            alert("Applied successfully!");
                            fetchData("offers");
                          } catch (err) {
                            alert("Failed to apply");
                          }
                        }}
                      >
                        Apply Now
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderDocuments = () => (
    <section className="content-card">
      <h3>Document Management</h3>
      <p className="page-subtitle">Upload and manage your resumes and transcripts</p>

      <div className="document-list">
        <div className="doc-item">
          <div className="doc-info">
            <span className="doc-name">Main_Resume_2024.pdf</span>
            <span className="doc-meta">Uploaded on Jan 20, 2024</span>
          </div>
          <div className="action-buttons">
            <button className="btn btn-secondary">View</button>
            <button className="btn btn-danger">Delete</button>
          </div>
        </div>
      </div>

      <div className="upload-section">
        <label className="upload-label">
          <span>Upload New Document</span>
          <input type="file" className="hidden-input" />
          <button className="btn btn-primary">Choose File</button>
        </label>
        <p className="help-text">Accepted formats: PDF, DOCX (Max 2MB)</p>
      </div>
    </section>
  );

  return (
    <DashboardLayout
      user={user}
      sidebarItems={sidebarItems}
      activeItem={activeTab}
      onSidebarChange={setActiveTab}
      title="Student Portal"
    >
      <header className="page-header">
        <div className="header-flex">
          <div>
            <h1 className="page-title">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h1>
            <p className="page-subtitle">
              Welcome back, {user.email?.split('@')[0]}
            </p>
          </div>
          <div className="current-date">
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </header>

      {/* MATERIALS MODAL */}
      {isMaterialsModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Course Materials</h2>
            <div className="modal-scroll-area">
              {currentMaterials.length === 0 ? (
                <p>No materials available for this course.</p>
              ) : (
                <ul style={{ listStyleType: "none", padding: 0 }}>
                  {currentMaterials.map((material) => (
                    <li key={material.material_id} style={{ marginBottom: "1rem", padding: "1rem", border: "1px solid #ddd", borderRadius: "4px" }}>
                      <h4>{material.title}</h4>
                      <a href={material.file_url} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">View Document</a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button className="btn btn-secondary mt-2" onClick={() => setIsMaterialsModalOpen(false)}>Close</button>
          </div>
        </div>
      )}

      {/* START TEST MODAL */}
      {isSubmissionModalOpen && currentAssessmentData && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{currentAssessmentData.title}</h2>
            <p style={{marginTop: "0.5rem", marginBottom: "1.5rem", color: "#6b7280"}}>
              {currentAssessmentData.description || "No description provided."}
            </p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <input 
                className="form-input" 
                type="text" 
                placeholder="Paste your submission link" 
                value={submissionUrl}
                onChange={(e) => setSubmissionUrl(e.target.value)}
              />
              <div style={{ display: "flex", gap: "1rem" }}>
                <button 
                  className="btn btn-primary" 
                  onClick={async () => {
                    try {
                      await api.post(`/assessments/${currentAssessmentData.assessment_id}/submit`, { submission_url: submissionUrl });
                      alert("Assessment submitted successfully!");
                      setIsSubmissionModalOpen(false);
                      setSubmissionUrl("");
                      // Optionally refresh history
                      const res = await api.get("/assessments/history");
                      setAssessments(res.data);
                    } catch (err) {
                      alert("Failed to submit assessment.");
                    }
                  }}
                >
                  Submit
                </button>
                <button className="btn btn-secondary" onClick={() => {
                  setIsSubmissionModalOpen(false);
                  setSubmissionUrl("");
                }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {needsOnboarding && (
        <Onboarding
          user={user}
          role="student"
          accessToken={accessToken}
          onComplete={() => fetchData("profile")}
        />
      )}

      {loading && <div className="loading-spinner">Loading...</div>}
      {error && <div className="error-banner">{error}</div>}

      <div className="dashboard-content">
        {activeTab === "home" && renderHome()}
        {activeTab === "profile" && renderProfile()}
        {activeTab === "courses" && renderCourses()}
        {activeTab === "assessments" && renderAssessments()}
        {activeTab === "slots" && renderSlots()}
        {activeTab === "offers" && renderOffers()}
        {activeTab === "documents" && renderDocuments()}
      </div>
      {isMaterialsModalOpen && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.55)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999
    }}
  >
    <div
      style={{
        background: "var(--bg-primary)",
        padding: "24px",
        borderRadius: "10px",
        width: "480px",
        maxHeight: "70vh",
        overflowY: "auto",
        boxShadow: "0 10px 40px rgba(0,0,0,0.25)"
      }}
    >
      <h3>Course Materials</h3>

      {currentMaterials.length === 0 ? (
        <p>No materials available.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {currentMaterials.map(mat => (
            <li key={mat.material_id} style={{ padding: "8px 0" }}>
              <a href={mat.file_url} target="_blank" rel="noreferrer">
                📄 {mat.title}
              </a>
            </li>
          ))}
        </ul>
      )}

      <div style={{ marginTop: "20px", textAlign: "right" }}>
        <button
          className="btn btn-secondary"
          onClick={() => setIsMaterialsModalOpen(false)}
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}
    </DashboardLayout>
  );
}
