import { useEffect, useMemo, useState } from "react";
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

  // Form states
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [courseFormData, setCourseFormData] = useState({ name: "", description: "" });
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [materialFormData, setMaterialFormData] = useState({ title: "", file_url: "" });
  const [showAssessmentForm, setShowAssessmentForm] = useState(false);
  const [assessmentFormData, setAssessmentFormData] = useState({ title: "", description: "", deadline: "" });
  const [responseFormData, setResponseFormData] = useState({ doubt_id: 0, response: "" });
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [gradeFormData, setGradeFormData] = useState({ submission_id: 0, grade: "", feedback: "" });
  const [showGradeForm, setShowGradeForm] = useState(false);

  const [selectedDoubt, setSelectedDoubt] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

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
      const allDocs = [];

      for (const student of studentsRes.data) {
        const docsRes = await api.get(`/advisor/students/${student.user_id}/documents`);
        const pending = docsRes.data.filter((doc) => doc.status === "PENDING");

        allDocs.push(
          ...pending.map((doc) => ({
            ...doc,
            fname: student.fname,
            lname: student.lname
          }))
        );
      }

      setPendingDocs(allDocs);
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
      await api.patch(`/faculty/submissions/${gradeFormData.submission_id}/evaluate`, {
        grade: gradeFormData.grade,
        feedback: gradeFormData.feedback
      });
      setSubmissions(submissions.map(s => s.submission_id === gradeFormData.submission_id ? { ...s, grade: gradeFormData.grade, feedback: gradeFormData.feedback } : s));
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
      const endpoint = status === "VERIFIED" ? "verify" : "reject";
      await api.patch(`/advisor/documents/${docId}/${endpoint}`);
      setPendingDocs(pendingDocs.filter(d => d.document_id !== docId));
    } catch (err) {
      alert(`Failed to ${status.toLowerCase()} document`);
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
                <input className="form-input" placeholder="Grade (e.g., A, 90, Good)" required value={gradeFormData.grade} onChange={e => setGradeFormData({...gradeFormData, grade: e.target.value})} />
                <textarea className="form-input" placeholder="Feedback" value={gradeFormData.feedback} onChange={e => setGradeFormData({...gradeFormData, feedback: e.target.value})} />
                <div className="action-buttons">
                  <button type="submit" className="btn btn-primary">Submit Grade</button>
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
                      <td>{s.fname} {s.lname}</td>
                      <td><a href={s.submission_url} target="_blank" rel="noreferrer">View Work</a></td>
                      <td>{s.grade || "Not Graded"}</td>
                      <td><button className="btn btn-secondary" onClick={() => { setGradeFormData({ submission_id: s.submission_id, grade: s.grade || "", feedback: s.feedback || "" }); setShowGradeForm(true); }}>Grade</button></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* DOUBTS */}
     {activeTab === "doubts" && (
  <div style={{ display: "flex", gap: "1rem", height: "70vh" }}>

    {/* LEFT: DOUBT THREADS */}
    <div style={{ width: "30%", borderRight: "1px solid #ddd", overflowY: "auto" }}>
      <h3>Student Doubts</h3>

      {doubts.length === 0 ? (
        <p>No doubts</p>
      ) : (
        doubts.map(d => (
          <div
            key={d.doubt_id}
            style={{
              padding: "10px",
              cursor: "pointer",
              borderBottom: "1px solid #eee",
              background: selectedDoubt?.doubt_id === d.doubt_id ? "#f3f4f6" : "transparent"
            }}
            onClick={() => {
              setSelectedDoubt(d);
              loadDoubtChat(d.doubt_id);
            }}
          >
            <strong>Doubt #{d.doubt_id}</strong>
            <br />
            <small>{d.status}</small>
          </div>
        ))
      )}
    </div>

    {/* RIGHT: CHAT */}
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      
      {!selectedDoubt ? (
        <p>Select a doubt to view messages</p>
      ) : (
        <>
          <h3>Doubt #{selectedDoubt.doubt_id}</h3>

          {/* MESSAGES */}
          <div style={{ flex: 1, overflowY: "auto", marginBottom: "1rem" }}>
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
                    background: msg.sender_role === "faculty" ? "#3b82f6" : "#e5e7eb",
                    color: msg.sender_role === "faculty" ? "white" : "black"
                  }}
                >
                  <strong>{msg.fname}</strong><br />
                  {msg.message}
                </div>
              </div>
            ))}
          </div>

          {/* INPUT */}
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              className="form-input"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type message..."
            />
            <button className="btn btn-primary" onClick={sendMessage}>
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
          <div style={{ display: "flex", gap: "1rem" }}>
            <button className="btn btn-primary" onClick={() => {
              setLoading(true);
              // fetchPendingDocuments is logic from useEffect, we just call it indirectly or replicate here
            }}>
              Refresh Documents
            </button>
          </div>
        </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead><tr><th>Student</th><th>Document</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {pendingDocs.length === 0 ? <tr><td colSpan={4}>No pending documents.</td></tr> :
                  pendingDocs.map(doc => (
                    <tr key={doc.document_id}>
                      <td>{doc.fname} {doc.lname}</td>
                      <td><a href={doc.file_url} target="_blank" rel="noreferrer">{doc.document_type}</a></td>
                      <td><span className="status-badge pending">{doc.status}</span></td>
                      <td className="action-buttons">
                        <button className="btn btn-primary" onClick={() => handleVerifyDoc(doc.document_id, "VERIFIED")}>Verify</button>
                        <button className="btn btn-danger" onClick={() => handleVerifyDoc(doc.document_id, "REJECTED")}>Reject</button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </DashboardLayout>
  );
}
