import { useMemo, useState, useEffect } from "react";
import axios from "axios";
import DashboardLayout from "../components/layout/DashboardLayout";
import "../styles/Dashboard.css";

export default function StudentDashboard({
  user,
  accessToken
}: {
  user: any;
  accessToken: string;
}) {
  const [activeTab, setActiveTab] = useState("home");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stats for the home overview (using actual data where possible)
  const stats = [
    { label: "CGPA", value: data?.cgpa || "9.2" },
    { label: "Courses", value: "4" },
    { label: "Applied Jobs", value: "12" },
    { label: "Assessments", value: "2" }
  ];

  const api = useMemo(() => {
    return axios.create({
      baseURL: `${import.meta.env.VITE_API_URL}/student`,
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
  }, [accessToken]);

  const handleError = (err: any) => {
    console.error("Student API Error:", err);
    if (err.response) {
      return `Server Error (${err.response.status}): ${err.response.data?.error || "Backend error"}`;
    }
    if (err.request) return "Network Error: Backend not reachable";
    return "Unexpected error occurred";
  };

  const fetchData = async (apiCall: Promise<any>) => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiCall;
      setData(res.data);
    } catch (err: any) {
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
            <div className="list-item">
              <div className="item-info">
                <span className="item-title">Data Structures Midterm</span>
                <span className="item-date">March 15, 2024</span>
              </div>
              <span className="status-badge pending">Upcoming</span>
            </div>
            <div className="list-item">
              <div className="item-info">
                <span className="item-title">Web Dev Project</span>
                <span className="item-date">March 20, 2024</span>
              </div>
              <span className="status-badge pending">Upcoming</span>
            </div>
          </div>
        </div>

        <div className="content-card flex-1">
          <h3>Recent Applications</h3>
          <div className="list-container">
            <div className="list-item">
              <div className="item-info">
                <span className="item-title">Google SDE Intern</span>
              </div>
              <span className="status-badge verified">Shortlisted</span>
            </div>
            <div className="list-item">
              <div className="item-info">
                <span className="item-title">Microsoft SDE-1</span>
              </div>
              <span className="status-badge pending">Under Review</span>
            </div>
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
    if (activeTab === "profile" || activeTab === "home") {
      fetchData(api.get("/profile"));
    }
    // For other tabs, we could also auto-fetch if needed
  }, [activeTab]);

  // Update form when data is fetched
  useEffect(() => {
    if (data) {
      setProfileForm({
        cgpa: data.cgpa || "",
        department: data.department || "",
        graduation_year: data.graduation_year || ""
      });
    }
  }, [data]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.put("/profile", profileForm);
      setData(res.data);
      setIsEditing(false);
    } catch (err: any) {
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
          <h2>{user.user_metadata?.full_name || "Student Name"}</h2>
          <p>{user.email}</p>
          <span className={`status-badge ${data?.is_verified ? 'verified' : 'pending'}`}>
            {data?.is_verified ? 'Verified Student' : 'Verification Pending'}
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
                onChange={(e) => setProfileForm({...profileForm, department: e.target.value})}
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
                onChange={(e) => setProfileForm({...profileForm, graduation_year: e.target.value})}
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
                onChange={(e) => setProfileForm({...profileForm, cgpa: e.target.value})}
                placeholder="e.g. 9.2"
                required
              />
            </div>
            <div className="detail-group">
              <label>Advisor Status</label>
              <p>{data?.advisor_id ? "Assigned" : "Not Assigned"}</p>
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
            <p>{data?.department || "Not Specified"}</p>
          </div>
          <div className="detail-group">
            <label>Batch</label>
            <p>{data?.graduation_year || "Not Specified"}</p>
          </div>
          <div className="detail-group">
            <label>Current CGPA</label>
            <p>{data?.cgpa || "Not Specified"}</p>
          </div>
          <div className="detail-group">
            <label>Advisor</label>
            <p>{data?.advisor_id ? `Advisor ID: ${data.advisor_id}` : "Pending Assignment"}</p>
          </div>
        </div>
      )}

      {data && <pre className="debug-data">{JSON.stringify(data, null, 2)}</pre>}
    </section>
  );

  const renderCourses = () => (
    <section className="content-card">
      <div className="tab-header">
        <button className="btn btn-primary" onClick={() => fetchData(api.get("/courses/enrolled"))}>My Enrolled Courses</button>
        <button className="btn btn-secondary" onClick={() => fetchData(api.get("/courses/available"))}>Available Courses</button>
      </div>
      
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Course Code</th>
              <th>Course Name</th>
              <th>Instructor</th>
              <th>Credits</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>CS301</td>
              <td>Data Structures</td>
              <td>Dr. Sarah Johnson</td>
              <td>4</td>
              <td><button className="btn btn-secondary">View Materials</button></td>
            </tr>
            <tr>
              <td>CS302</td>
              <td>Web Technology</td>
              <td>Prof. Michael Chen</td>
              <td>3</td>
              <td><button className="btn btn-secondary">View Materials</button></td>
            </tr>
          </tbody>
        </table>
      </div>
      {data && <pre className="debug-data">{JSON.stringify(data, null, 2)}</pre>}
    </section>
  );

  const renderAssessments = () => (
    <section className="content-card">
      <div className="tab-header">
        <button className="btn btn-primary" onClick={() => fetchData(api.get("/assessments/upcoming"))}>Upcoming Tests</button>
        <button className="btn btn-secondary">History</button>
      </div>
      
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Topic</th>
              <th>Date</th>
              <th>Duration</th>
              <th>Max Marks</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Algorithm Analysis</td>
              <td>March 15, 2024</td>
              <td>60 min</td>
              <td>100</td>
              <td><span className="status-badge pending">Upcoming</span></td>
              <td><button className="btn btn-primary">Start Test</button></td>
            </tr>
            <tr>
              <td>CSS Grid & Flexbox</td>
              <td>March 20, 2024</td>
              <td>45 min</td>
              <td>50</td>
              <td><span className="status-badge pending">Not Started</span></td>
              <td><button className="btn btn-secondary" onClick={() => fetchData(api.post("/assessments/submit", { assessmentId: 1, submissionUrl: "http://test.com" }))}>Submit Project</button></td>
            </tr>
          </tbody>
        </table>
      </div>
      {data && <pre className="debug-data">{JSON.stringify(data, null, 2)}</pre>}
    </section>
  );

  const renderSlots = () => (
    <section className="content-card">
      <h3>Placement Slots Booking</h3>
      <p className="page-subtitle">Select and book your interview/test slots</p>
      
      <div className="action-row">
        <button className="btn btn-primary" onClick={() => fetchData(api.get("/slots/available"))}>
          Refresh Available Slots
        </button>
      </div>

      <div className="slot-grid">
        {[1, 2, 3].map(i => (
          <div key={i} className="slot-card">
            <div className="slot-time">10:00 AM - 11:00 AM</div>
            <div className="slot-date">March 12, 2024</div>
            <button className="btn btn-secondary" onClick={() => fetchData(api.post("/slots/book", { driveId: i }))}>
              Book Slot {i}
            </button>
          </div>
        ))}
      </div>
      {data && <pre className="debug-data">{JSON.stringify(data, null, 2)}</pre>}
    </section>
  );

  const renderOffers = () => (
    <section className="content-card">
      <div className="tab-header">
        <button className="btn btn-primary" onClick={() => fetchData(api.get("/offers/eligible"))}>View Eligible Drives</button>
        <button className="btn btn-secondary">Applied Drives</button>
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
            <tr>
              <td>TechCorp Systems</td>
              <td>Full Stack Developer</td>
              <td>12 LPA</td>
              <td>March 10, 2024</td>
              <td><button className="btn btn-primary" onClick={() => fetchData(api.post("/offers/apply", { offerId: 1 }))}>Apply Now</button></td>
            </tr>
            <tr>
              <td>DataWorks Inc.</td>
              <td>Data Analyst</td>
              <td>10 LPA</td>
              <td>March 12, 2024</td>
              <td><button className="btn btn-primary" onClick={() => fetchData(api.post("/offers/apply", { offerId: 2 }))}>Apply Now</button></td>
            </tr>
          </tbody>
        </table>
      </div>
      {data && <pre className="debug-data">{JSON.stringify(data, null, 2)}</pre>}
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
    </DashboardLayout>
  );
}