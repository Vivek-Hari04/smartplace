import { useEffect, useMemo, useState, useRef } from "react";
import axios from "axios";
import DashboardLayout from "../components/layout/DashboardLayout";
import "../styles/Dashboard.css";

export default function FacultyDashboard({
  user,
  accessToken
}) {
  const [activeTab, setActiveTab] = useState("classes");
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [doubts, setDoubts] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [students, setStudents] = useState([]);
  const [pendingDocs, setPendingDocs] = useState([]);
  const [advisorStudents, setAdvisorStudents] = useState([]);
  const [isAdvisor, setIsAdvisor] = useState(false);
  const [loading, setLoading] = useState(true);

  const [advisorTab, setAdvisorTab] = useState("overview"); 
  const [selectedStudentForDocs, setSelectedStudentForDocs] = useState("");
  const [specificStudentDocs, setSpecificStudentDocs] = useState([]);

  // Form states
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [courseFormData, setCourseFormData] = useState({ name: "", description: "" });
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [materialFormData, setMaterialFormData] = useState({ title: "", file_url: "" });
  const [showAssessmentForm, setShowAssessmentForm] = useState(false);
  const [assessmentFormData, setAssessmentFormData] = useState({ title: "", description: "", deadline: "" });
  const [responseFormData, setResponseFormData] = useState({ doubt_id: 0, response: "" });
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [gradeFormData, setGradeFormData] = useState({ submission_id: 0, score: "", feedback: "" });
  const [showGradeForm, setShowGradeForm] = useState(false);

  const [selectedDoubt, setSelectedDoubt] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages]);

  /* ================= AXIOS INSTANCE ================= */
  const api = useMemo(() => {
    return axios.create({
      baseURL: import.meta.env.VITE_API_URL,
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
  }, [accessToken]);

 /* ================= INITIAL LOAD ================= */
useEffect(() => {
  const initialize = async () => {
    try {
      const coursesRes = await api.get("/faculty/courses");
      if (Array.isArray(coursesRes.data)) {
        setCourses(coursesRes.data);
      }

      try {
        const advisorRes = await api.get("/advisor/students");
        setIsAdvisor(Array.isArray(advisorRes.data));
      } catch (err) {
        setIsAdvisor(false);
      }
    } catch (err) {
      console.error("Initialization failed", err);
    } finally {
      setLoading(false);
    }
  };

  initialize();
}, [api]);

/* ================= TAB-BASED DOUBTS LOAD ================= */
useEffect(() => {
  if (activeTab !== "doubts") return;

  const fetchDoubts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/faculty/doubts");
      setDoubts(res.data);
    } catch (err) {
      console.error("Failed to load doubts", err);
    } finally {
      setLoading(false);
    }
  };

  fetchDoubts();
}, [activeTab, api]);

/* ================= TAB-BASED ADVISOR LOAD ================= */
useEffect(() => {
  if (activeTab !== "advisor") return;

  const fetchPendingDocuments = async () => {
    try {
      setLoading(true);

      const studentsRes = await api.get("/advisor/students");
      setAdvisorStudents(studentsRes.data);

      const res = await api.get("/advisor/documents");
      setPendingDocs(res.data);
    } catch (err) {
      console.error("Failed to load pending docs", err);
    } finally {
      setLoading(false);
    }
  };

  fetchPendingDocuments();
}, [activeTab, api]);

//course mngmnt
  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/faculty/courses", courseFormData);
      setCourses([...courses, res.data]);
      setShowCourseForm(false);
      setCourseFormData({ name: "", description: "" });
    } catch (err) {
      alert("Failed to create course");
    }
  };

  const handleToggleAvailability = async (courseId) => {
    try {
      await api.patch(`/faculty/courses/${courseId}/toggle`);
      setCourses(courses.map(c => c.course_id === courseId ? { ...c, availability: !c.availability } : c));
    } catch (err) {
      alert("Failed to toggle availability");
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await api.delete(`/faculty/courses/${courseId}`);
      setCourses(courses.filter(c => c.course_id !== courseId));
    } catch (err) {
      alert("Failed to delete course");
    }
  };

  /* ================= COURSE DETAILS (Students/Materials/Assessments) ================= */
  const viewCourseDetails = async (course) => {
    setSelectedCourse(course);
    setLoading(true);
    try {
      const [studentsRes, materialsRes, assessmentsRes] = await Promise.all([
        api.get(`/faculty/courses/${course.course_id}/students`),
        api.get(`/faculty/courses/${course.course_id}/materials`),
        api.get(`/faculty/courses/${course.course_id}/assessments`)
      ]);
      setStudents(studentsRes.data);
      setMaterials(materialsRes.data);
      setAssessments(assessmentsRes.data);
      setActiveTab("course-details");
    } catch (err) {
      console.error("Failed to load course details", err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= MATERIALS ================= */
  const handleUploadMaterial = async (e) => {
    e.preventDefault();
    if (!selectedCourse) return;
    try {
      const res = await api.post(`/faculty/courses/${selectedCourse.course_id}/materials`, materialFormData);
      setMaterials([...materials, res.data]);
      setShowMaterialForm(false);
      setMaterialFormData({ title: "", file_url: "" });
    } catch (err) {
      alert("Failed to upload material");
    }
  };

  const handleDeleteMaterial = async (id) => {
    try {
      await api.delete(`/faculty/materials/${id}`);
      setMaterials(materials.filter(m => m.material_id !== id));
    } catch (err) {
      alert("Failed to delete material");
    }
  };

  /* ================= ASSESSMENTS & SUBMISSIONS ================= */
  const handleCreateAssessment = async (e) => {
    e.preventDefault();
    if (!selectedCourse) return;
    try {
      const res = await api.post(`/faculty/courses/${selectedCourse.course_id}/assessments`, assessmentFormData);
      setAssessments([...assessments, res.data]);
      setShowAssessmentForm(false);
      setAssessmentFormData({ title: "", description: "", deadline: "" });
    } catch (err) {
      alert("Failed to create assessment");
    }
  };

  const viewSubmissions = async (assessmentId) => {
    try {
      const res = await api.get(`/faculty/assessments/${assessmentId}/submissions`);
      setSubmissions(res.data);
      setActiveTab("submissions");
    } catch (err) {
      alert("Failed to load submissions");
    }
  };

  const handleEvaluate = async (e) => {
    e.preventDefault();
    try {
      const numericScore = parseInt(gradeFormData.score, 10);
      await api.patch(`/faculty/submissions/${gradeFormData.submission_id}/evaluate`, {
        score: numericScore,
        feedback: gradeFormData.feedback
      });
      setSubmissions(prev =>
          prev.map(s =>
            s.submission_id === gradeFormData.submission_id
              ? {
                  ...s,
                  score: numericScore,
                  feedback: gradeFormData.feedback
                }
              : s
          )
      );
      setShowGradeForm(false);
    } catch (err) {
      alert("Failed to evaluate submission");
    }
  };

  const handleRespondToDoubt = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/faculty/doubts/${responseFormData.doubt_id}/respond`, { response: responseFormData.response });
      setDoubts(doubts.map(d => d.doubt_id === responseFormData.doubt_id ? { ...d, response: responseFormData.response, status: "RESOLVED" } : d));
      setShowResponseForm(false);
    } catch (err) {
      alert("Failed to respond to doubt");
    }
  };

  const handleVerifyDoc = async (docId, status) => {
    try {
      await api.put(`/advisor/documents/${docId}`, { status });
      setPendingDocs(pendingDocs.filter(d => d.document_id !== docId));
      if (selectedStudentForDocs) {
        loadSpecificStudentDocs(selectedStudentForDocs);
      }
    } catch (err) {
      alert(`Failed to ${status.toLowerCase()} document`);
    }
  };

  const loadSpecificStudentDocs = async (studentId) => {
    try {
      setLoading(true);
      const res = await api.get(`/advisor/students/${studentId}/documents`);
      setSpecificStudentDocs(res.data);
    } catch(err) {
      alert("Failed to load documents for student");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDoc = async (docId) => {
    try {
      const res = await api.get(`/advisor/documents/${docId}/view`);
      if (res.data && res.data.url) {
        window.open(res.data.url, '_blank');
      }
    } catch (err) {
      alert("Failed to view document");
    }
  };

const loadDoubtChat = async (doubtId) => {
  try {
    const res = await api.get(`/faculty/doubts/${doubtId}/messages`);
    setMessages(res.data);
  } catch (err) {
    console.error("Failed to load messages");
  }
};

const sendMessage = async () => {
  if (!newMessage.trim() || !selectedDoubt) return;

  try {
    await api.post(`/faculty/doubts/${selectedDoubt.doubt_id}/message`, {
      message: newMessage
    });

    setNewMessage("");
    loadDoubtChat(selectedDoubt.doubt_id); // refresh
  } catch (err) {
    alert("Failed to send message");
  }
};



  /* ================= SIDEBAR ================= */
  const sidebarItems = [
    { id: "classes", label: "My Classes" },
    { id: "doubts", label: "Doubts" },
    ...(isAdvisor ? [{ id: "advisor", label: "Advisor Panel" }] : [])
  ];

  if (loading && activeTab !== "course-details" && activeTab !== "doubts" && activeTab !== "advisor") {
    return <div className="loading-text">Loading dashboard...</div>;
  }

  return (
    <DashboardLayout
      user={user}
      sidebarItems={sidebarItems}
      activeItem={activeTab === "course-details" || activeTab === "submissions" ? "classes" : activeTab}
      onSidebarChange={(id) => {
  setActiveTab(id);
}}
      title="Faculty Portal"
    >
      <header className="page-header">
        <h1 className="page-title">
          {activeTab === "classes" ? "My Courses" : 
           activeTab === "course-details" ? selectedCourse?.name : 
           activeTab === "doubts" ? "Student Doubts" :
           activeTab === "submissions" ? "Submissions" :
           "Advisor Dashboard"}
        </h1>
        <p className="page-subtitle">
          {activeTab === "classes" ? "Manage your teaching load and materials" : 
           activeTab === "course-details" ? "Manage students, materials, and assessments" : 
           activeTab === "doubts" ? "Answer student questions and clarify doubts" :
           activeTab === "submissions" ? "Review and grade student work" :
           "Verify student credentials and placement documents"}
        </p>
      </header>

      {/* CLASSES LIST */}
      {activeTab === "classes" && (
        <section className="content-card">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
            <h2>Active Courses</h2>
            <button className="btn btn-primary" onClick={() => setShowCourseForm(true)}>+ New Course</button>
          </div>

          {showCourseForm && (
            <form onSubmit={handleCreateCourse} className="content-card" style={{ marginBottom: "2rem" }}>
              <h3>Create New Course</h3>
              <div style={{ display: "flex", gap: "1rem", flexDirection: "column" }}>
                <input className="form-input" placeholder="Course Name" required value={courseFormData.name} onChange={e => setCourseFormData({...courseFormData, name: e.target.value})} />
                <textarea className="form-input" placeholder="Description" value={courseFormData.description} onChange={e => setCourseFormData({...courseFormData, description: e.target.value})} />
                <div className="action-buttons">
                  <button type="submit" className="btn btn-primary">Save Course</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCourseForm(false)}>Cancel</button>
                </div>
              </div>
            </form>
          )}
         
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Course Name</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.length === 0 ? <tr><td colSpan={3}>No courses found.</td></tr> : 
                  courses.map(course => (
                    <tr key={course.course_id}>
                      <td><strong>{course.name}</strong></td>
                      <td>
                        <span className={`status-badge ${course.availability ? "selected" : "unverified"}`}>
                          {course.availability ? "Open" : "Closed"}
                        </span>
                      </td>
                      <td className="action-buttons">
                        <button className="btn btn-secondary" onClick={() => viewCourseDetails(course)}>Manage</button>
                        <button className="btn btn-secondary" onClick={() => handleToggleAvailability(course.course_id)}>Toggle</button>
                        <button className="btn btn-danger" onClick={() => handleDeleteCourse(course.course_id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* COURSE DETAILS */}
      {activeTab === "course-details" && selectedCourse && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <button className="btn btn-secondary" style={{ alignSelf: "flex-start" }} onClick={() => setActiveTab("classes")}>← Back to Courses</button>
          
          {/* STUDENTS */}
          <section className="content-card">
            <h2>Enrolled Students ({students.length})</h2>
            <div className="table-responsive">
              <table className="data-table">
                <thead><tr><th>Name</th><th>Email</th><th>Attendance</th></tr></thead>
                <tbody>
                  {students.length === 0 ? <tr><td colSpan={3}>No students enrolled.</td></tr> :
                    students.map(s => 
                       <tr key={s.user_id}>
                        <td>{s.fname} {s.lname}</td>
                        <td>{s.email}</td>
                       <td>
                          {s.attendance !== null && s.attendance !== undefined
                            ? Number(s.attendance).toFixed(2)
                            : "-"}
                      </td>
            </tr>
                    )}
                </tbody>
              </table>
            </div>
          </section>

          {/* MATERIALS */}
          <section className="content-card">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
              <h2>Materials</h2>
              <button className="btn btn-primary" onClick={() => setShowMaterialForm(true)}>+ Add Material</button>
            </div>
            
            {showMaterialForm && (
              <form onSubmit={handleUploadMaterial} className="content-card" style={{ marginBottom: "1rem" }}>
                <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
                  <input className="form-input" placeholder="Title" required value={materialFormData.title} onChange={e => setMaterialFormData({...materialFormData, title: e.target.value})} />
                  <input className="form-input" placeholder="Drive Link" required value={materialFormData.file_url} onChange={e => setMaterialFormData({...materialFormData, file_url: e.target.value})} />
                </div>
                <div className="action-buttons">
                  <button type="submit" className="btn btn-primary">Upload</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowMaterialForm(false)}>Cancel</button>
                </div>
              </form>
            )}

            <div className="table-responsive">
              <table className="data-table">
                <thead><tr><th>Title</th><th>Link</th><th>Actions</th></tr></thead>
                <tbody>
                  {materials.length === 0 ? <tr><td colSpan={3}>No materials uploaded.</td></tr> :
                    materials.map(m => (
                      <tr key={m.material_id}>
                        <td>{m.title}</td>
                        <td><a href={m.file_url} target="_blank" rel="noreferrer">Open Link</a></td>
                        <td><button className="btn btn-danger" onClick={() => handleDeleteMaterial(m.material_id)}>Delete</button></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ASSESSMENTS */}
          <section className="content-card">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
              <h2>Assessments</h2>
              <button className="btn btn-primary" onClick={() => setShowAssessmentForm(true)}>+ New Assessment</button>
            </div>

            {showAssessmentForm && (
              <form onSubmit={handleCreateAssessment} className="content-card" style={{ marginBottom: "1rem" }}>
                <div style={{ display: "flex", gap: "1rem", flexDirection: "column" }}>
                  <input className="form-input" placeholder="Title" required value={assessmentFormData.title} onChange={e => setAssessmentFormData({...assessmentFormData, title: e.target.value})} />
                  <textarea className="form-input" placeholder="Description" value={assessmentFormData.description} onChange={e => setAssessmentFormData({...assessmentFormData, description: e.target.value})} />
                  <input className="form-input" type="date" required value={assessmentFormData.deadline} onChange={e => setAssessmentFormData({...assessmentFormData, deadline: e.target.value})} />
                  <div className="action-buttons">
                    <button type="submit" className="btn btn-primary">Create</button>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowAssessmentForm(false)}>Cancel</button>
                  </div>
                </div>
              </form>
            )}

            <div className="table-responsive">
              <table className="data-table">
                <thead><tr><th>Title</th><th>Deadline</th><th>Actions</th></tr></thead>
                <tbody>
                  {assessments.length === 0 ? <tr><td colSpan={3}>No assessments created.</td></tr> :
                    assessments.map(a => (
                      <tr key={a.assessment_id}>
                        <td>{a.title}</td>
                        <td>{new Date(a.deadline).toLocaleDateString()}</td>
                        <td style={{ display: "flex", gap: "0.5rem" }}>
                          <button className="btn btn-secondary" onClick={() => viewSubmissions(a.assessment_id)}>View Submissions</button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={async () => {
                              if (!window.confirm("Delete this assessment? This will also delete all student submissions.")) return;

                              try {
                                await api.delete(`/faculty/assessments/${a.assessment_id}`);
                                alert("Assessment deleted");
                                
                                // Re-fetch by calling viewCourseDetails
                                viewCourseDetails(selectedCourse);
                              } catch (err) {
                                alert("Delete failed");
                              }
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* SUBMISSIONS GRADING */}
      {activeTab === "submissions" && (
        <section className="content-card">
          <button className="btn btn-secondary" style={{ marginBottom: "1rem" }} onClick={() => setActiveTab("course-details")}>← Back to Course</button>
          <h2>Submissions</h2>

          {showGradeForm && (
            <form onSubmit={handleEvaluate} className="content-card" style={{ marginBottom: "1rem" }}>
              <h3>Grade Submission</h3>
              <div style={{ display: "flex", gap: "1rem", flexDirection: "column" }}>
                <input type="number" className="form-input" placeholder="Marks (e.g. 90, 80)" required value={gradeFormData.score} onChange={e => setGradeFormData({...gradeFormData, score: e.target.value})} />
                <textarea className="form-input" placeholder="Feedback" value={gradeFormData.feedback} onChange={e => setGradeFormData({...gradeFormData, feedback: e.target.value})} />
                <div className="action-buttons">
                  <button type="submit" className="btn btn-primary">Submit Mark</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowGradeForm(false)}>Cancel</button>
                </div>
              </div>
            </form>
          )}

          <div className="table-responsive">
            <table className="data-table">
              <thead><tr><th>Student</th><th>Link</th><th>Grade</th><th>Action</th></tr></thead>
              <tbody>
                {submissions.length === 0 ? <tr><td colSpan={4}>No submissions yet.</td></tr> :
                  submissions.map(s => (
                    <tr key={s.submission_id}>
                      <td>
                          {s.fname} {s.lname}
                          {s.is_late && (
                            <span style={{ marginLeft: "8px", color: "red", fontSize: "12px" }}>
                              (Late)
                            </span>
                          )}
                      </td>
                      <td><a href={s.submission_url} target="_blank" rel="noreferrer">View Work</a></td>
                      <td>{s.score !== null && s.score !== undefined ? s.score : "Not Graded"}</td>
                      <td><button className="btn btn-secondary" onClick={() => { setGradeFormData({ submission_id: s.submission_id, score: s.score || "", feedback: s.feedback || "" }); setShowGradeForm(true); }}>Grade</button></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* DOUBTS */}
    {activeTab === "doubts" && (
  <div
    style={{
      display: "flex",
      gap: "1.5rem",
      height: "70vh",
      background: "var(--bg-primary)",
      padding: "1rem",
      borderRadius: "10px",
      border: "1px solid #e5e7eb"
    }}
  >

    {/* LEFT PANEL */}
    <div style={{ width: "35%", display: "flex", flexDirection: "column", gap: "1rem" }}>

      {/* HEADER */}
      <div>
        <h3 style={{ marginBottom: "0.5rem" }}>Student Doubts</h3>
      </div>

      {/* DOUBT LIST */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          border: "1px solid #e5e7eb",
          borderRadius: "8px"
        }}
      >
        {doubts.length === 0 ? (
          <p style={{ padding: "1rem" }}>No doubts</p>
        ) : (
          doubts.map(d => (
            <div
              key={d.doubt_id}
              style={{
                padding: "12px",
                cursor: "pointer",
                borderBottom: "1px solid #eee",
                background:
                  selectedDoubt?.doubt_id === d.doubt_id
                    ? "#eef2ff"
                    : "transparent"
              }}
             onClick={async () => {
                  setSelectedDoubt(d);

                  await loadDoubtChat(d.doubt_id);

                  const res = await api.get("/faculty/doubts");
                  setDoubts(res.data);
            }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                  
                  {/* LEFT SIDE */}
                  <div>
                    <strong>{d.course_name}</strong>
                    <br />

                    <span style={{ fontSize: "12px", color: "#6b7280" }}>
                      {d.last_message
                        ? d.last_message.slice(0, 40)
                        : "No messages yet"}
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

                  {/* RIGHT SIDE */}
                  <div style={{ textAlign: "right" }}>
                    
                    {/* UNREAD BADGE */}
                    {d.unread_count > 0 && (
                      <div
                        style={{
                          background: "#41e794ff",
                          color: "white",
                          borderRadius: "50%",
                          width: "15px",
                          height: "15px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          fontWeight: "bold",
                          marginBottom: "5px"
                        }}
                      >
                        {/* {d.unread_count} */}
                      </div>
                    )}

                    {/* TIME */}
                    <span style={{ fontSize: "10px", color: "#9ca3af" }}>
                      {d.last_message_time
                        ? new Date(d.last_message_time).toLocaleTimeString()
                        : ""}
                    </span>
                  </div>
                </div>
            </div>
          ))
        )}
      </div>
    </div>

    {/* RIGHT PANEL */}
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        border: "1px solid rgba(255, 255, 255, 1)",
        borderRadius: "8px",
        padding: "1rem"
      }}
    >

      {!selectedDoubt ? (
        <div style={{ textAlign: "center", marginTop: "2rem", color: "#6b7280" }}>
          Select a doubt to view conversation
        </div>
      ) : (
        <>
          {/* HEADER */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div>
              <h3 style={{ margin: 0 }}>Doubt #{selectedDoubt.doubt_id}</h3>
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
                      await api.put(`/faculty/doubts/${selectedDoubt.doubt_id}/status`, { status: "RESOLVED" });
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
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedDoubt(null)}
              >
                Close ✕
              </button>
            </div>
          </div>

          {/* CHAT */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "10px",
              background: "#f9fafb",
              borderRadius: "6px",
              marginBottom: "1rem"
            }}
          >
            {messages.map(msg => (
              <div
                key={msg.response_id}
                style={{
                  textAlign: msg.sender_role === "faculty" ? "right" : "left",
                  marginBottom: "10px"
                }}
              >
                <div
                  style={{
                    display: "inline-block",
                    padding: "8px 12px",
                    borderRadius: "10px",
                    background:
                      msg.sender_role === "faculty"
                        ? "#3b82f6"
                        : "#e5e7eb",
                    color:
                      msg.sender_role === "faculty"
                        ? "white"
                        : "black",
                    maxWidth: "70%"
                  }}
                >
                  <strong style={{ fontSize: "12px" }}>
                    {msg.fname}
                  </strong>
                  <br />
                  {msg.message}
                </div>
              </div>
            ))}
            <div ref={chatEndRef}></div>
          </div>

          {/* INPUT */}
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
      )}
    </div>
  </div>
)}

      {/* ADVISOR PANEL */}
      {activeTab === "advisor" && isAdvisor && (
        <section className="content-card">
          <div className="tab-header" style={{ marginBottom: '1rem' }}>
            <button className={`btn ${advisorTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setAdvisorTab('overview')}>Overview</button>
            <button className={`btn ${advisorTab === 'student-docs' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setAdvisorTab('student-docs')}>Student Documents</button>
          </div>

          {advisorTab === 'overview' && (
            <>
              {/* ADVISOR STUDENTS */}
              <section className="content-card" style={{ marginBottom: "2rem" }}>
                <h3>My Students ({advisorStudents.length})</h3>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>First Name</th>
                        <th>Last Name</th>
                        <th>Email</th>
                        <th>Department</th>
                        <th>Graduation Year</th>
                        <th>CGPA</th>
                        <th>Placement Eligible</th>
                        <th>Verified</th>
                      </tr>
                    </thead>
                    <tbody>
                      {advisorStudents.length === 0 ? (
                        <tr>
                          <td colSpan={8}>No students assigned.</td>
                        </tr>
                      ) : (
                        advisorStudents.map((s) => (
                          <tr key={s.user_id}>
                             <td>{s.fname}</td>
                            <td>{s.lname}</td>
                            <td>{s.email}</td>
                            <td>{s.department}</td>
                            <td>{s.graduation_year}</td>
                            <td>{s.cgpa}</td>
                            <td>{s.placement_eligible ? "Yes" : "No"}</td>
                            <td>{s.is_verified ? "Yes" : "No"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                <h2>Advisor Dashboard</h2>
              </div>
              <div className="table-responsive">
                <table className="data-table">
                  <thead><tr><th>Student</th><th>Document</th><th>View</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {pendingDocs.length === 0 ? <tr><td colSpan={5}>No pending documents.</td></tr> :
                      pendingDocs.map(doc => (
                        <tr key={doc.document_id}>
                          <td>{doc.fname} {doc.lname}</td>
                          <td>{doc.document_type} - {doc.file_name}</td>
                          <td>
                            <button className="btn btn-secondary" onClick={() => handleViewDoc(doc.document_id)}>View</button>
                          </td>
                          <td><span className="status-badge pending">{doc.status}</span></td>
                          <td className="action-buttons">
                            <button className="btn btn-primary" onClick={() => handleVerifyDoc(doc.document_id, "VERIFIED")}>Approve</button>
                            <button className="btn btn-danger" onClick={() => handleVerifyDoc(doc.document_id, "REJECTED")}>Reject</button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {advisorTab === 'student-docs' && (
            <div className="student-docs-container">
              <h3>View Student Documents</h3>
              <div style={{ marginBottom: "1rem" }}>
                <select 
                  className="form-select" 
                  value={selectedStudentForDocs}
                  onChange={(e) => {
                    const newId = e.target.value;
                    setSelectedStudentForDocs(newId);
                    if (newId) loadSpecificStudentDocs(newId);
                    else setSpecificStudentDocs([]);
                  }}
                  style={{ maxWidth: "300px" }}
                >
                  <option value="">-- Select a Student --</option>
                  {advisorStudents.map(s => (
                    <option key={s.user_id} value={s.user_id}>{s.fname} {s.lname}</option>
                  ))}
                </select>
              </div>

              {selectedStudentForDocs && (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead><tr><th>Document</th><th>View</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                      {specificStudentDocs.length === 0 ? <tr><td colSpan={4}>No documents uploaded yet.</td></tr> :
                        specificStudentDocs.map(doc => (
                          <tr key={doc.document_id}>
                            <td>{doc.document_type} - {doc.file_name}</td>
                            <td>
                              <button className="btn btn-secondary" onClick={() => handleViewDoc(doc.document_id)}>View</button>
                            </td>
                            <td>
                              <span style={{ 
                                color: doc.status === 'VERIFIED' ? '#16a34a' : doc.status === 'REJECTED' ? '#dc2626' : '#f59e0b', 
                                fontWeight: 'bold' 
                              }}>
                                {doc.status}
                              </span>
                            </td>
                            <td className="action-buttons">
                              {doc.status !== 'VERIFIED' && <button className="btn btn-primary" onClick={() => handleVerifyDoc(doc.document_id, "VERIFIED")}>Approve</button>}
                              {doc.status !== 'REJECTED' && <button className="btn btn-danger" onClick={() => handleVerifyDoc(doc.document_id, "REJECTED")}>Reject</button>}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </section>
      )}
    </DashboardLayout>
  );
}
