import { useMemo, useState, useEffect, useRef } from "react";
import axios from "axios";
import DashboardLayout from "../components/layout/DashboardLayout";
import Onboarding from "./Onboarding";
import PlacementGuidance from "../components/PlacementGuidance";
import AlumniNetwork from "../components/AlumniNetwork";
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
  const [eligibleDrives, setEligibleDrives] = useState([]);
  const [driveEligibilityList, setDriveEligibilityList] = useState([]);
  const [driveStatus, setDriveStatus] = useState([]);
  const [myOffers, setMyOffers] = useState([]);

  const [courseTab, setCourseTab] = useState("enrolled");
  const [isMaterialsModalOpen, setIsMaterialsModalOpen] = useState(false);
  const [currentMaterials, setCurrentMaterials] = useState([]);

  // Submission Modal State
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [currentAssessmentData, setCurrentAssessmentData] = useState(null);
  const [submissionUrl, setSubmissionUrl] = useState("");

  const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Set());
  const [newDoubt, setNewDoubt] = useState({ course_id: "", doubt_text: "" });
  const [doubtSubmitMessage, setDoubtSubmitMessage] = useState("");

  const [doubts, setDoubts] = useState([]);
  const [selectedDoubt, setSelectedDoubt] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [chatMessages]);


  const needsOnboarding = useMemo(() => {
    return profile && profile.user_id === null;
  }, [profile]);

  // Stats for the home overview (using actual data where possible)
  const stats = [
    { label: "CGPA", value: profile?.cgpa || "N/A" },
    { label: "Courses", value: courses.length.toString() },
    { label: "Drives", value: slots.length.toString() },
    { label: "Offers", value: myOffers.length.toString() }
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
        setEnrolledCourseIds(new Set(res.data.map(c => c.course_id)));
        setCourseTab("enrolled");
      } else if (tab === "assessments") {
        const res = await api.get("/assessments/upcoming");
        setAssessments(res.data);
      } else if (tab === "slots") {
        const res = await api.get("/slots/available");
        setSlots(res.data);
      } else if (tab === "eligible-drives") {
        const res = await api.get("/eligible-drives");
        setEligibleDrives(res.data);
      } else if (tab === "drive-eligibility") {
        const res = await api.get("/drive-eligibility");
        setDriveEligibilityList(res.data);
      } else if (tab === "drive-results") {
        const res = await api.get("/drives/status");
        setDriveStatus(res.data);
      } else if (tab === "my-offers") {
        const res = await api.get("/offers/applications");
        setMyOffers(res.data);
      }
    } catch (err) {
      setError(handleError(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchDoubts = async () => {
  try {
    const res = await api.get("/doubts");
    setDoubts(res.data || []);
  } catch (err) {
    console.error(err);
  }
};

const loadDoubtChat = async (doubtId) => {
  try {
    const res = await api.get(`/doubts/${doubtId}/messages`);
    setChatMessages(res.data || []);
  } catch (err) {
    console.error(err);
  }
};

const sendMessage = async () => {
  if (!newMessage.trim() || !selectedDoubt) return;

  try {
    await api.post(`/doubts/${selectedDoubt.doubt_id}/message`, {
      message: newMessage
    });

    setNewMessage("");
    loadDoubtChat(selectedDoubt.doubt_id);
  } catch (err) {
    console.error(err);
  }
};

  const sidebarItems = [
    { id: "home", label: "Dashboard" },
    { id: "profile", label: "Profile" },
    { id: "courses", label: "Courses" },
    { id: "assessments", label: "Assessments" },
    // { id: "slots", label: "Placement Slots" },
    { id: "eligible-drives", label: "Eligible Drives" },
    { id: "drive-eligibility", label: "Drive Eligibility" },
    { id: "drive-results", label: "Drive Results" },
    { id: "my-offers", label: "My Offers" },
    { id: "alumni", label: "Doubt Clearance" },
    { id: "network", label: "Alumni Network" },
    { id: "documents", label: "Documents" }
  ];

  const renderHome = () => {
    const hasUnrespondedOffers = myOffers.filter(o => o.status === 'offered').length > 0;

    return (
      <div className="home-dashboard">
        {profile?.offers_received >= 2 && (
          <div style={{ backgroundColor: '#fef2f2', color: '#991b1b', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #fecaca', fontWeight: 'bold' }}>
            Maximum number of offers received. Cannot participate in new drives.
          </div>
        )}
        <div className="welcome-banner">
          <h1>Welcome back, {profile?.fname || "Student"}!</h1>
          <p>Here's what's happening with your placements and courses today.</p>
        </div>

        {hasUnrespondedOffers && (
          <div style={{ backgroundColor: '#ecfdf5', color: '#065f46', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #a7f3d0' }}>
            <strong>🎉 Congratulations!</strong> You have been selected for a drive. <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab("my-offers"); }} style={{ color: '#047857', fontWeight: 'bold', textDecoration: 'underline' }}>View your job offer.</a>
          </div>
        )}
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
      </div>
    );
  };

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
        <button className={`btn ${courseTab === 'doubts' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => {
          api.get("/courses/enrolled").then(res => {
            setCourses(res.data);
            setCourseTab("doubts");
            fetchDoubts();
            setDoubtSubmitMessage("");
            if (res.data.length > 0) setNewDoubt({ ...newDoubt, course_id: res.data[0].course_id });
          });
        }}>Doubts</button>
      </div>
      
    {courseTab === 'doubts' ? (
      <div style={{ display: "flex", gap: "20px" }}>

        {/* LEFT: DOUBT LIST + CREATE */}
        <div style={{ width: "30%", borderRight: "1px solid #ddd", paddingRight: "10px" }}>
          
          <h4>Ask Doubt</h4>

          <select
            className="form-input"
            value={newDoubt.course_id}
            onChange={(e) => setNewDoubt({ ...newDoubt, course_id: e.target.value })}
          >
            <option value="">Select Course</option>
            {courses.map(c => (
              <option key={c.course_id} value={c.course_id}>{c.name}</option>
            ))}
          </select>

          <textarea
            className="form-input"
            rows="3"
            value={newDoubt.doubt_text}
            onChange={(e) => setNewDoubt({ ...newDoubt, doubt_text: e.target.value })}
            placeholder="Enter doubt..."
            style={{ marginTop: "10px" }}
          />

          <button
            className="btn btn-primary"
            style={{ marginTop: "10px", width: "100%" }}
            onClick={async () => {
              if (!newDoubt.course_id || !newDoubt.doubt_text.trim()) {
                alert("Enter details");
                return;
              }

              try {
                const res = await api.post("/doubts", newDoubt);

                setNewDoubt({ ...newDoubt, doubt_text: "" });

                fetchDoubts();

                setSelectedDoubt(res.data);
                loadDoubtChat(res.data.doubt_id);

              } catch {
                alert("Failed");
              }
            }}
          >
            Create
          </button>

          <hr style={{ margin: "20px 0" }} />

         <h4>Your Doubts</h4>

            {doubts.length === 0 ? (
              <p>No doubts</p>
            ) : (
              doubts.map((d) => {
                return (
                  <div
                    key={d.doubt_id}
                    style={{
                      padding: "10px",
                      borderBottom: "1px solid #eee",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                 onClick={async () => {
                      setSelectedDoubt(d);
                      setDoubts(prev =>
                        prev.map(item =>
                          item.doubt_id === d.doubt_id
                            ? { ...item, unread_count: 0, has_unread: false }
                            : item
                         )
                      );
                      await loadDoubtChat(d.doubt_id);
                    }}
                  >
                    <div>
                      <strong>{d.course_name}</strong>
                      <br />
                      <span style={{ fontSize: "12px", color: "#6b7280" }}>
                        Doubt #{d.doubt_id}
                      </span>
                      <br />
                      <span
                        style={{
                          fontSize: "11px",
                          color: d.status === "RESOLVED" ? "#16a34a" : "#f59e0b",
                          fontWeight: "bold"
                        }}
                      >
                        {d.status}
                      </span>
                    </div>

                    {d.has_unread && (
                      <div
                        style={{
                          width: "10px",
                          height: "10px",
                          background: "#4dd55bff",
                          borderRadius: "50%"
                        }}
                      />
                    )}
                  </div>
                );
              })
            )}
        </div>

        {/* RIGHT: CHAT */}
        <div style={{ width: "70%" }}>

          {selectedDoubt ? (
            <>
              {/* HEADER */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <div>
                  <h4 style={{ margin: 0 }}>Chat</h4>
                  <span
                    style={{
                      fontSize: "12px",
                      color: selectedDoubt.status === "RESOLVED" ? "#16a34a" : "#f59e0b",
                      fontWeight: "bold"
                    }}
                  >
                    {selectedDoubt.status}
                  </span>
                </div>
                
                <div style={{ display: "flex", gap: "10px" }}>
                  {selectedDoubt.status !== "RESOLVED" && (
                    <button
                      className="btn btn-success"
                      onClick={async () => {
                        try {
                          await api.put(`/doubts/${selectedDoubt.doubt_id}/status`, { status: "RESOLVED" });
                          setSelectedDoubt(prev => ({ ...prev, status: "RESOLVED" }));
                          setDoubts(prev => prev.map(d => 
                            d.doubt_id === selectedDoubt.doubt_id ? { ...d, status: "RESOLVED" } : d
                          ));
                        } catch (err) {
                          alert("Failed to update status");
                        }
                      }}
                    >
                      Mark as Resolved
                    </button>
                  )}

                  {selectedDoubt.status === "RESOLVED" && (
                    <button
                      className="btn btn-danger"
                      onClick={async () => {
                        if (!window.confirm("Are you sure you want to delete this doubt?")) return;
                        try {
                          await api.delete(`/doubts/${selectedDoubt.doubt_id}`);
                          
                          // UI UPDATE: Remove without reloading
                          setDoubts(prev => prev.filter(d => d.doubt_id !== selectedDoubt.doubt_id));
                          setSelectedDoubt(null);
                        } catch (err) {
                          alert("Failed to delete doubt");
                        }
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

              <div
                style={{
                  height: "350px",
                  overflowY: "auto",
                  border: "1px solid #ddd",
                  padding: "10px",
                  marginBottom: "10px"
                }}
              >
                {chatMessages.map(msg => (
                  <div
                    key={msg.response_id}
                    style={{
                      textAlign: msg.sender_id === user.id ? "right" : "left",
                      marginBottom: "10px"
                    }}
                  >
                    <div
                      style={{
                        display: "inline-block",
                        padding: "8px",
                        borderRadius: "6px",
                        background: msg.sender_id === user.id ? "#3b82f6" : "#e5e7eb",
                        color: msg.sender_id === user.id ? "#f2f3f2ff" : "#000"
                      }}
                    >
                      {msg.message}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef}></div>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  className="form-input"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type message..."
                  disabled={selectedDoubt.status === "RESOLVED"}
                />
                <button 
                  className="btn btn-primary" 
                  onClick={sendMessage}
                  disabled={selectedDoubt.status === "RESOLVED"}
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            <p>Select a doubt to start chat</p>
          )}

        </div>
      </div>

      
      ) : (
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
                      ) : enrolledCourseIds.has(course.course_id) ? (
                        <span className="status-badge enrolled" style={{ backgroundColor: '#16a34a', color: '#fff' }}>Enrolled</span>
                      ) : (
                        <button className="btn btn-primary btn-sm" onClick={async () => {
                          try {
                            await api.post(`/courses/enroll/${course.course_id}`);
                            alert("Enrolled successfully!");
                            setEnrolledCourseIds(prev => new Set([...prev, course.course_id]));
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
      )}
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
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {assessments.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center' }}>No assessments found</td></tr> :
              assessments.map((a) => (
                <tr key={a.assessment_id}>
                  <td>
                    {a.title}
                    {a.is_late && <span className="status-badge" style={{ backgroundColor: '#fee2e2', color: '#dc2626', marginLeft: '0.5rem', padding: '0.1rem 0.4rem', fontSize: '10px' }}>LATE</span>}
                  </td>
                  <td>{a.course_name}</td>
                  <td>{new Date(a.deadline).toLocaleString()}</td>
                  <td>
                    {a.evaluation_status === 'EVALUATED' ? (
                      <span className="status-badge" style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}>Evaluated</span>
                    ) : (
                      <span className="status-badge" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>Not Evaluated</span>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={async () => {
                        try {
                          const res = await api.get(`/assessments/${a.assessment_id}`);
                          setCurrentAssessmentData(res.data);
                          setIsSubmissionModalOpen(true);
                        } catch (err) {
                          alert("Failed to fetch assessment details.");
                        }
                      }}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </section>
  );


  const renderEligibleDrives = () => (
    <section className="content-card">
      {profile?.offers_received >= 2 && (
        <div style={{ backgroundColor: '#fef2f2', color: '#991b1b', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #fecaca', fontWeight: 'bold' }}>
          Maximum number of offers received. Cannot participate in new drives.
        </div>
      )}

      <div
        className="tab-header"
        style={{
          justifyContent: "space-between",
          display: "flex",
          alignItems: "center"
        }}
      >
        <h3>Eligible Placement Drives</h3>

        <button
          className="btn btn-primary"
          onClick={() => fetchData("eligible-drives")}
        >
          Refresh
        </button>
      </div>

      <p className="page-subtitle">
        Placement drives you are eligible for based on your CGPA, department and placement status.
      </p>

      <div className="table-responsive">

        <table className="data-table">

          <thead>
            <tr>
              <th>Company</th>
              <th>Role</th>
              <th>Package</th>
              <th>Drive Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>

            {eligibleDrives.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "2rem" }}>
                  No eligible drives available
                </td>
              </tr>
            ) : (

              eligibleDrives.map((drive) => (

                <tr key={drive.drive_id}>

                  <td>
                    <strong>{drive.company_name || "TBA"}</strong>
                  </td>

                  <td>
                    {drive.role?.toUpperCase() || "N/A"}
                  </td>

                  <td>
                    {drive.package_lpa === "TBD"
                      ? "TBD"
                      : `${drive.package_lpa} LPA`}
                  </td>

                  <td>
                    {new Date(drive.drive_date).toLocaleDateString()}
                  </td>

                  <td>

                    {drive.application_status === "accepted" ? (
                      <span
                        className="status-badge"
                        style={{
                          backgroundColor: "#16a34a",
                          color: "white"
                        }}
                      >
                        HIRED
                      </span>

                    ) : drive.application_id ? (

                      <span
                        className="status-badge"
                        style={{
                          backgroundColor: "#6b7280",
                          color: "white"
                        }}
                      >
                        APPLIED
                      </span>

                    ) : (

                      <span
                        className="status-badge"
                        style={{
                          backgroundColor: "#3b82f6",
                          color: "white"
                        }}
                      >
                        AVAILABLE
                      </span>

                    )}

                  </td>

                  <td>

                    {drive.application_status === "accepted" ? (

                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: "bold",
                          color: "#16a34a"
                        }}
                      >
                        Offer Accepted
                      </span>

                    ) : drive.application_id ? (

                      <button
                        className="btn btn-secondary btn-sm"
                        disabled
                      >
                        Applied
                      </button>

                    ) : (

                      <button
                        className="btn btn-primary btn-sm"
                        disabled={profile?.offers_received >= 2}
                        onClick={async () => {

                          try {

                            await api.post(
                              "/slots/book",
                              { driveId: drive.drive_id }
                            );

                            alert("Successfully applied for the drive!");

                            fetchData("eligible-drives");

                          } catch (err) {

                            alert(
                              err.response?.data?.error ||
                              "Failed to apply for drive"
                            );

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

  const renderDriveEligibility = () => (
    <section className="content-card">
      <div className="tab-header" style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center' }}>
        <h3>Drive Eligibility Status</h3>
        <button className="btn btn-primary" onClick={() => fetchData("drive-eligibility")}>Refresh</button>
      </div>
      <p className="page-subtitle">Understand why you are eligible or not eligible for upcoming drives.</p>

      <div className="list-container" style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
        {driveEligibilityList.length === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center' }}>No drives available</p>
        ) : (
          driveEligibilityList.map((drive) => (
            <div key={drive.drive_id} className="stat-card" style={{ flex: '1', border: '1px solid #eee', padding: '1rem', borderRadius: '8px', background: 'var(--bg-secondary)' }}>
              <div style={{ marginBottom: '8px', fontSize: '1.1rem' }}>
                <strong>Drive: </strong> {drive.title}
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Eligibility: </strong>
                {drive.eligible ? (
                  <span style={{ color: '#16a34a', fontWeight: 'bold' }}>Eligible</span>
                ) : (
                  <span style={{ color: '#dc2626', fontWeight: 'bold' }}>Not Eligible</span>
                )}
              </div>
              {!drive.eligible && (
                <div>
                  <strong>Reason: </strong>
                  <span style={{ color: '#dc2626' }}>✖ Not eligible — {drive.reason}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'registered': return '#6b7280'; // gray
      case 'shortlisted': return '#3b82f6'; // blue
      case 'selected': return '#16a34a'; // green
      case 'rejected': return '#dc2626'; // red
      default: return '#6b7280';
    }
  };

  const renderDriveStatus = () => (
    <section className="content-card">
      <div className="tab-header" style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center' }}>
        <h3>Drive Results</h3>
        <button className="btn btn-primary" onClick={() => fetchData("drive-results")}>Refresh</button>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Drive Date</th>
              <th>Type</th>
              <th>Mode</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {driveStatus.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>No drive results found</td></tr>
            ) : (
              driveStatus.map((drive) => (
                <tr key={drive.drive_id}>
                  <td><strong>{drive.company_name || 'TBA'}</strong></td>
                  <td>{new Date(drive.drive_date).toLocaleDateString()}</td>
                  <td>{drive.drive_type?.toUpperCase()}</td>
                  <td>{drive.mode?.toUpperCase()}</td>
                  <td>
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.85rem',
                        backgroundColor: getStatusColor(drive.status)
                      }}
                    >
                      {drive.status?.toUpperCase() || 'UNKNOWN'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderMyOffers = () => (
    <section className="content-card">
      {profile?.placement_status === 'PLACED' && (
        <div style={{ backgroundColor: '#fef2f2', color: '#991b1b', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #fecaca', fontWeight: 'bold' }}>
          You are already placed and cannot accept additional offers.
        </div>
      )}
      <div className="tab-header" style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center' }}>
        <h3>My Offers</h3>
        <button className="btn btn-primary" onClick={() => fetchData("my-offers")}>Refresh</button>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Role</th>
              <th>Package (CTC)</th>
              <th>Deadline</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {myOffers.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>No application data found</td></tr>
            ) : (
              myOffers.map((offer) => (
                <tr key={offer.offer_id}>
                  <td><strong>{offer.title}</strong></td>
                  <td>{offer.package_lpa === "TBD" ? "TBD" : `${offer.package_lpa} LPA`}</td>
                  <td>{new Date(offer.acceptance_deadline).toLocaleDateString()}</td>
                  <td>
                    <span className={`status-badge ${offer.status}`}>{offer.status.toUpperCase()}</span>
                  </td>
                  <td>
                    {offer.status === 'accepted' ? (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span className="status-badge placed" style={{ backgroundColor: '#16a34a', color: 'white' }}>PLACED</span>
                        <button className="btn btn-secondary btn-sm" onClick={async () => {
                          if (!window.confirm("Are you sure you want to withdraw this offer?")) return;
                          try {
                            await api.delete(`/offers/${offer.application_id}/withdraw`);
                            setMyOffers(prev => prev.map(o => o.offer_id === offer.offer_id ? { ...o, status: 'withdrawn' } : o));
                            alert("Offer withdrawn successfully");
                            fetchData("profile");
                          } catch (err) {
                            alert(err.response?.data?.error || "Failed to withdraw offer");
                          }
                        }}>Withdraw</button>
                      </div>
                    ) : offer.status === 'offered' ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-primary btn-sm" disabled={profile?.placement_status === 'PLACED'} onClick={async () => {
                          try {
                            await api.post("/offers/respond", { offerId: offer.offer_id, decision: 'accepted' });
                            setMyOffers(prev => prev.map(o => o.offer_id === offer.offer_id ? { ...o, status: 'accepted' } : o));
                            alert("Offer accepted successfully! Your placement eligibility is now resolved.");
                            fetchData("profile");
                          } catch (err) {
                            alert(err.response?.data?.error || "Failed to accept offer");
                          }
                        }}>ACCEPT</button>
                        <button className="btn btn-danger btn-sm" onClick={async () => {
                          try {
                            await api.post("/offers/respond", { offerId: offer.offer_id, decision: 'rejected' });
                            setMyOffers(prev => prev.map(o => o.offer_id === offer.offer_id ? { ...o, status: 'rejected' } : o));
                            alert("Offer rejected.");
                          } catch (err) {
                            alert(err.response?.data?.error || "Failed to reject offer");
                          }
                        }}>REJECT</button>
                        <button className="btn btn-secondary btn-sm" onClick={async () => {
                          if (!window.confirm("Are you sure you want to withdraw this offer?")) return;
                          try {
                            await api.delete(`/offers/${offer.application_id}/withdraw`);
                            setMyOffers(prev => prev.map(o => o.offer_id === offer.offer_id ? { ...o, status: 'withdrawn' } : o));
                            alert("Offer withdrawn successfully");
                            fetchData("profile");
                          } catch (err) {
                            alert(err.response?.data?.error || "Failed to withdraw offer");
                          }
                        }}>Withdraw</button>
                      </div>
                    ) : offer.status === 'rejected' ? (
                      <span style={{ color: '#dc2626', fontWeight: 'bold', fontSize: '13px' }}>Rejected</span>
                    ) : offer.status === 'withdrawn' ? (
                      <span style={{ color: '#6b7280', fontWeight: 'bold', fontStyle: 'italic', fontSize: '13px' }}>Withdrawn</span>
                    ) : (
                      <span style={{ color: '#6b7280', fontStyle: 'italic', fontSize: '13px' }}>Under Review</span>
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

      {/* VIEW DETAILS / SUBMISSION MODAL */}
      {isSubmissionModalOpen && currentAssessmentData && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {currentAssessmentData.title}
              {currentAssessmentData.is_late && <span className="status-badge" style={{ backgroundColor: '#fee2e2', color: '#dc2626', fontSize: '12px' }}>LATE</span>}
            </h2>
            <p style={{ marginTop: "0.5rem", marginBottom: "0.5rem", color: "#6b7280" }}>
              <strong>Course:</strong> {currentAssessmentData.course_name}
            </p>
            <p style={{ marginTop: "0.5rem", marginBottom: "0.5rem", color: "#6b7280" }}>
              <strong>Description / Instructions:</strong> {currentAssessmentData.description || "No description provided."}
            </p>
            <p style={{ marginBottom: "1.5rem", color: "#d97706", fontWeight: 'bold' }}>
              <strong>Deadline:</strong> {new Date(currentAssessmentData.deadline).toLocaleString()}
            </p>

            <hr style={{ margin: "20px 0" }} />

            {/* EVALUATION SECTION */}
            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ marginBottom: "10px" }}>Evaluation</h4>
              {currentAssessmentData.evaluation_status === 'EVALUATED' ? (
                <div style={{ padding: "10px", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px" }}>
                  <p><strong>Grade:</strong> <span style={{ color: "#16a34a", fontSize: "18px", fontWeight: "bold" }}>{currentAssessmentData.score}</span></p>
                  {currentAssessmentData.feedback && (
                    <p style={{ marginTop: "10px" }}><strong>Feedback:</strong> {currentAssessmentData.feedback}</p>
                  )}
                </div>
              ) : (
                <p style={{ color: "#6b7280", fontStyle: "italic", margin: 0 }}>Not evaluated yet</p>
              )}
            </div>

            <hr style={{ margin: "20px 0" }} />

            {/* SUBMISSION SECTION */}
            <div>
              <h4 style={{ marginBottom: "10px" }}>Your Submission</h4>
              {currentAssessmentData.submission_url ? (
                <p style={{ margin: 0 }}>
                  <a href={currentAssessmentData.submission_url} target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb", textDecoration: "underline", fontWeight: "600" }}>
                    View Submission
                  </a>
                  <span style={{ marginLeft: "10px", color: "#6b7280", fontSize: "12px" }}>
                    (Submitted on {new Date(currentAssessmentData.submitted_at).toLocaleString()})
                  </span>
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <input
                    className="form-input"
                    type="url"
                    placeholder="Paste your submission link (e.g., GitHub, Drive)"
                    value={submissionUrl}
                    onChange={(e) => setSubmissionUrl(e.target.value)}
                  />
                  <div style={{ display: "flex", gap: "1rem" }}>
                    <button
                      className="btn btn-primary"
                      onClick={async () => {
                        if (!submissionUrl) {
                          alert("Please enter a valid URL");
                          return;
                        }

                        try {
                          const res = await api.post(`/assessments/${currentAssessmentData.assessment_id}/submit`, { submission_link: submissionUrl });
                          
                          // Instant UI update
                          const newSubmissionData = {
                            ...currentAssessmentData,
                            submission_url: res.data.submission_url || submissionUrl,
                            submitted_at: res.data.submitted_at || new Date().toISOString()
                          };
                          
                          setCurrentAssessmentData(newSubmissionData);
                          // Update the list as well to reflect changes immediately
                          setAssessments(prev => prev.map(a => 
                            a.assessment_id === currentAssessmentData.assessment_id ? { ...a, ...newSubmissionData } : a
                          ));
                          
                          setSubmissionUrl("");
                          alert("Assessment submitted successfully!");
                        } catch (err) {
                          alert(handleError(err));
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
              )}
            </div>

            {currentAssessmentData.submission_url && (
              <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setIsSubmissionModalOpen(false);
                    setSubmissionUrl("");
                  }}
                >
                  Close
                </button>
              </div>
            )}
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
        {activeTab === "eligible-drives" && renderEligibleDrives()}
        {activeTab === "drive-eligibility" && renderDriveEligibility()}
        {activeTab === "drive-results" && renderDriveStatus()}
        {activeTab === "my-offers" && renderMyOffers()}
        {activeTab === "alumni" && <PlacementGuidance accessToken={accessToken} userRole="student" currentUser={user} />}
        {activeTab === "network" && <AlumniNetwork accessToken={accessToken} />}
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
