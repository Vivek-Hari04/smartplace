import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import DashboardLayout from "../components/layout/DashboardLayout";
import "../styles/Dashboard.css";

interface Course {
  course_id: number;
  name: string;
  availability: boolean;
  description?: string;
}

interface Material {
  material_id: number;
  course_id: number;
  title: string;
  drive_link: string;
}

interface Doubt {
  doubt_id: number;
  student_id: string;
  course_id: number;
  question: string;
  response?: string;
  status: string;
  fname: string;
  lname: string;
  course_name: string;
}

interface Assessment {
  assessment_id: number;
  course_id: number;
  title: string;
  description: string;
  deadline: string;
}

interface Submission {
  submission_id: number;
  assessment_id: number;
  student_id: string;
  submission_url: string;
  grade?: string;
  feedback?: string;
  fname: string;
  lname: string;
}

export default function FacultyDashboard({
  user,
  accessToken
}: {
  user: any;
  accessToken: string;
}) {
  const [activeTab, setActiveTab] = useState("classes");
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [pendingDocs, setPendingDocs] = useState<any[]>([]);
  const [isAdvisor, setIsAdvisor] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [courseFormData, setCourseFormData] = useState({ name: "", description: "" });
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [materialFormData, setMaterialFormData] = useState({ title: "", drive_link: "" });
  const [showAssessmentForm, setShowAssessmentForm] = useState(false);
  const [assessmentFormData, setAssessmentFormData] = useState({ title: "", description: "", deadline: "" });
  const [responseFormData, setResponseFormData] = useState({ doubt_id: 0, response: "" });
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [gradeFormData, setGradeFormData] = useState({ submission_id: 0, grade: "", feedback: "" });
  const [showGradeForm, setShowGradeForm] = useState(false);

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
        } catch {
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

  /* ================= COURSE MANAGEMENT ================= */
  const handleCreateCourse = async (e: React.FormEvent) => {
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

  const handleToggleAvailability = async (courseId: number) => {
    try {
      await api.patch(`/faculty/courses/${courseId}/toggle`);
      setCourses(courses.map(c => c.course_id === courseId ? { ...c, availability: !c.availability } : c));
    } catch (err) {
      alert("Failed to toggle availability");
    }
  };

  const handleDeleteCourse = async (courseId: number) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await api.delete(`/faculty/courses/${courseId}`);
      setCourses(courses.filter(c => c.course_id !== courseId));
    } catch (err) {
      alert("Failed to delete course");
    }
  };

  /* ================= COURSE DETAILS (Students/Materials/Assessments) ================= */
  const viewCourseDetails = async (course: Course) => {
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
  const handleUploadMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    try {
      const res = await api.post(`/faculty/courses/${selectedCourse.course_id}/materials`, materialFormData);
      setMaterials([...materials, res.data]);
      setShowMaterialForm(false);
      setMaterialFormData({ title: "", drive_link: "" });
    } catch (err) {
      alert("Failed to upload material");
    }
  };

  const handleDeleteMaterial = async (id: number) => {
    try {
      await api.delete(`/faculty/materials/${id}`);
      setMaterials(materials.filter(m => m.material_id !== id));
    } catch (err) {
      alert("Failed to delete material");
    }
  };

  /* ================= ASSESSMENTS & SUBMISSIONS ================= */
  const handleCreateAssessment = async (e: React.FormEvent) => {
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

  const viewSubmissions = async (assessmentId: number) => {
    try {
      const res = await api.get(`/faculty/assessments/${assessmentId}/submissions`);
      setSubmissions(res.data);
      setActiveTab("submissions");
    } catch (err) {
      alert("Failed to load submissions");
    }
  };

  const handleEvaluate = async (e: React.FormEvent) => {
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

  /* ================= DOUBTS ================= */
  const loadDoubts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/faculty/doubts");
      setDoubts(res.data);
      setActiveTab("doubts");
    } catch (err) {
      console.error("Failed to load doubts", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/faculty/doubts/${responseFormData.doubt_id}/respond`, { response: responseFormData.response });
      setDoubts(doubts.map(d => d.doubt_id === responseFormData.doubt_id ? { ...d, response: responseFormData.response, status: "RESOLVED" } : d));
      setShowResponseForm(false);
    } catch (err) {
      alert("Failed to respond to doubt");
    }
  };

  /* ================= ADVISOR ================= */
  const loadPendingDocuments = async () => {
    try {
      setLoading(true);
      const studentsRes = await api.get("/advisor/students");
      const allDocs: any[] = [];
      for (const student of studentsRes.data) {
        const docsRes = await api.get(`/advisor/students/${student.user_id}/documents`);
        const pending = docsRes.data.filter((doc: any) => doc.status === "PENDING");
        allDocs.push(...pending.map((doc: any) => ({ ...doc, fname: student.fname, lname: student.lname })));
      }
      setPendingDocs(allDocs);
      setActiveTab("advisor");
    } catch (err) {
      console.error("Failed to load pending docs", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDoc = async (docId: number, status: "VERIFIED" | "REJECTED") => {
    try {
      const endpoint = status === "VERIFIED" ? "verify" : "reject";
      await api.patch(`/advisor/documents/${docId}/${endpoint}`);
      setPendingDocs(pendingDocs.filter(d => d.document_id !== docId));
    } catch (err) {
      alert(`Failed to ${status.toLowerCase()} document`);
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
        if (id === "classes") setActiveTab("classes");
        if (id === "doubts") loadDoubts();
        if (id === "advisor") loadPendingDocuments();
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
                <thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead>
                <tbody>
                  {students.length === 0 ? <tr><td colSpan={3}>No students enrolled.</td></tr> :
                    students.map(s => <tr key={s.user_id}><td>{s.fname} {s.lname}</td><td>{s.email}</td><td>{s.role}</td></tr>)}
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
                  <input className="form-input" placeholder="Drive Link" required value={materialFormData.drive_link} onChange={e => setMaterialFormData({...materialFormData, drive_link: e.target.value})} />
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
                        <td><a href={m.drive_link} target="_blank" rel="noreferrer">Open Link</a></td>
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
                        <td><button className="btn btn-secondary" onClick={() => viewSubmissions(a.assessment_id)}>View Submissions</button></td>
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
        <section className="content-card">
          <h2>Student Questions</h2>

          {showResponseForm && (
            <form onSubmit={handleRespondToDoubt} className="content-card" style={{ marginBottom: "2rem" }}>
              <h3>Respond to Doubt</h3>
              <div style={{ display: "flex", gap: "1rem", flexDirection: "column" }}>
                <textarea className="form-input" required placeholder="Type your answer here..." value={responseFormData.response} onChange={e => setResponseFormData({...responseFormData, response: e.target.value})} />
                <div className="action-buttons">
                  <button type="submit" className="btn btn-primary">Send Response</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowResponseForm(false)}>Cancel</button>
                </div>
              </div>
            </form>
          )}

          <div className="table-responsive">
            <table className="data-table">
              <thead><tr><th>Student</th><th>Course</th><th>Question</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {doubts.length === 0 ? <tr><td colSpan={5}>No doubts reported.</td></tr> :
                  doubts.map(d => (
                    <tr key={d.doubt_id}>
                      <td>{d.fname} {d.lname}</td>
                      <td>{d.course_name}</td>
                      <td>{d.question}</td>
                      <td><span className={`status-badge ${d.status === "RESOLVED" ? "selected" : "pending"}`}>{d.status}</span></td>
                      <td>
                        <button className="btn btn-secondary" onClick={() => { setResponseFormData({ doubt_id: d.doubt_id, response: d.response || "" }); setShowResponseForm(true); }}>
                          {d.response ? "Edit Response" : "Respond"}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ADVISOR PANEL */}
      {activeTab === "advisor" && isAdvisor && (
        <section className="content-card">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
            <h2>Pending Verifications</h2>
            <button className="btn btn-primary" onClick={loadPendingDocuments}>Refresh</button>
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