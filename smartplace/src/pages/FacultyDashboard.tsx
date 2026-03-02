import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import DashboardLayout from "../components/layout/DashboardLayout";
import "../styles/Dashboard.css";

interface Course {
  course_id: number;
  name: string;
  availability: boolean;
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
  const [students, setStudents] = useState<any[]>([]);
  const [pendingDocs, setPendingDocs] = useState<any[]>([]);
  const [isAdvisor, setIsAdvisor] = useState(false);
  const [loading, setLoading] = useState(true);

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
        // Ensure data is an array before setting state
        if (Array.isArray(coursesRes.data)) {
          setCourses(coursesRes.data);
        } else {
          console.error("Courses data is not an array:", coursesRes.data);
          setCourses([]);
        }

        try {
          const advisorRes = await api.get("/advisor/students");
          setIsAdvisor(Array.isArray(advisorRes.data));
        } catch {
          setIsAdvisor(false);
        }

      } catch (err) {
        console.error("Initialization failed", err);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [api]);

  /* ================= LOAD STUDENTS ================= */

  const loadStudents = async (courseId: number) => {
    try {
      const res = await api.get(`/faculty/courses/${courseId}/students`);
      setStudents(res.data);
      setActiveTab("students");
    } catch (err) {
      console.error("Failed to load students", err);
    }
  };

  /* ================= LOAD PENDING DOCS ================= */

  const loadPendingDocuments = async () => {
    try {
      const studentsRes = await api.get("/advisor/students");

      const allDocs: any[] = [];

      for (const student of studentsRes.data) {
        const docsRes = await api.get(
          `/advisor/students/${student.user_id}/documents`
        );

        const pending = docsRes.data.filter(
          (doc: any) => doc.status === "PENDING"
        );

        const docsWithStudent = pending.map((doc: any) => ({
          ...doc,
          fname: student.fname,
          lname: student.lname
        }));

        allDocs.push(...docsWithStudent);
      }

      setPendingDocs(allDocs);
      setActiveTab("advisor");
    } catch (err) {
      console.error("Failed to load pending docs", err);
    }
  };

  /* ================= SIDEBAR ================= */

  const sidebarItems = [
    { id: "classes", label: "My Classes" },
    { id: "students", label: "Student Progress" },
    ...(isAdvisor ? [{ id: "advisor", label: "Advisor Panel" }] : [])
  ];

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "4rem" }}>
        Loading dashboard...
      </div>
    );
  }

  /* ================= RENDER ================= */

  return (
    <DashboardLayout
      user={user}
      sidebarItems={sidebarItems}
      activeItem={activeTab}
      onSidebarChange={setActiveTab}
      title="Faculty Portal"
    >
      <header className="page-header">
        <h1 className="page-title">Faculty Dashboard</h1>
        <p className="page-subtitle">
          Manage courses, students and advisor responsibilities
        </p>
      </header>

      {activeTab === "classes" && (
        <section className="content-card">
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
                {courses.length === 0 ? (
                  <tr>
                    <td colSpan={3}>No courses found.</td>
                  </tr>
                ) : (
                  courses.map((course) => (
                    <tr key={course.course_id}>
                      <td>{course.name}</td>
                      <td>{course.availability ? "Open" : "Closed"}</td>
                      <td>
                        <button
                          className="btn btn-secondary"
                          onClick={() => loadStudents(course.course_id)}
                        >
                          View Students
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "students" && (
        <section className="content-card">
          <h2>Enrolled Students</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Department</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={2}>No students found.</td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.user_id}>
                    <td>{student.fname} {student.lname}</td>
                    <td>{student.department}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === "advisor" && isAdvisor && (
        <section className="content-card">
          <h2>Pending Document Verifications</h2>

          <button
            className="btn btn-primary"
            onClick={loadPendingDocuments}
            style={{ marginBottom: "15px" }}
          >
            Refresh
          </button>

          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Document Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pendingDocs.length === 0 ? (
                <tr>
                  <td colSpan={3}>No pending documents.</td>
                </tr>
              ) : (
                pendingDocs.map((doc) => (
                  <tr key={doc.document_id}>
                    <td>{doc.fname} {doc.lname}</td>
                    <td>{doc.document_type}</td>
                    <td>{doc.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      )}
    </DashboardLayout>
  );
}