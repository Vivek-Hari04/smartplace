import { useMemo, useState } from "react";
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
  const [activeTab, setActiveTab] = useState("profile");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ================= AXIOS INSTANCE (LIKE FACULTY) ================= */

  const api = useMemo(() => {
    return axios.create({
      baseURL: `${import.meta.env.VITE_API_URL}/student`,
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
  }, [accessToken]);

  /* ================= ERROR HANDLER ================= */

  const handleError = (err: any) => {
    console.error("Student API Error:", err);

    if (err.response) {
      return `Server Error (${err.response.status}): ${
        err.response.data?.error || "Backend error"
      }`;
    }

    if (err.request) {
      return "Network Error: Backend not reachable";
    }

    return "Unexpected error occurred";
  };

  /* ================= FETCH WRAPPER ================= */

  const fetchData = async (apiCall: Promise<any>) => {
    try {
      setLoading(true);
      setError(null);
      setData(null);

      const res = await apiCall;
      setData(res.data);
    } catch (err: any) {
      setError(handleError(err));
    } finally {
      setLoading(false);
    }
  };

  const sidebarItems = [
    { id: "profile", label: "Profile" },
    { id: "courses", label: "Courses" },
    { id: "assessments", label: "Assessments" },
    { id: "slots", label: "Placement Slots" },
    { id: "offers", label: "Offers" }
  ];

  return (
    <DashboardLayout
      user={user}
      sidebarItems={sidebarItems}
      activeItem={activeTab}
      onSidebarChange={setActiveTab}
      title="Student Portal"
    >
      <header className="page-header">
        <h1 className="page-title">Student Dashboard</h1>
        <p className="page-subtitle">
          Manage courses, assessments and placements
        </p>
      </header>

      {loading && <p>Loading...</p>}
      {error && <div style={{ color: "red" }}>{error}</div>}

      {/* ================= PROFILE ================= */}
      {activeTab === "profile" && (
        <section className="content-card">
          <button
            className="btn btn-primary"
            onClick={() => fetchData(api.get("/profile"))}
          >
            View Profile
          </button>

          <button
            className="btn btn-secondary"
            onClick={() =>
              fetchData(api.put("/profile", { cgpa: 9.2 }))
            }
          >
            Update Profile
          </button>

          {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
        </section>
      )}

      {/* ================= COURSES ================= */}
      {activeTab === "courses" && (
        <section className="content-card">
          <button
            className="btn btn-primary"
            onClick={() => fetchData(api.get("/courses/enrolled"))}
          >
            My Courses
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => fetchData(api.get("/courses/available"))}
          >
            Available Courses
          </button>

          <button
            className="btn btn-secondary"
            onClick={() =>
              fetchData(api.post("/courses/enroll", { courseId: 1 }))
            }
          >
            Enroll (Course 1)
          </button>

          {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
        </section>
      )}

      {/* ================= ASSESSMENTS ================= */}
      {activeTab === "assessments" && (
        <section className="content-card">
          <button
            className="btn btn-primary"
            onClick={() =>
              fetchData(api.get("/assessments/upcoming"))
            }
          >
            Upcoming
          </button>

          <button
            className="btn btn-secondary"
            onClick={() =>
              fetchData(
                api.post("/assessments/submit", {
                  assessmentId: 1,
                  submissionUrl: "http://test.com"
                })
              )
            }
          >
            Submit Assessment
          </button>

          {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
        </section>
      )}

      {/* ================= SLOTS ================= */}
      {activeTab === "slots" && (
        <section className="content-card">
          <button
            className="btn btn-primary"
            onClick={() =>
              fetchData(api.get("/slots/available"))
            }
          >
            Available Slots
          </button>

          <button
            className="btn btn-secondary"
            onClick={() =>
              fetchData(api.post("/slots/book", { driveId: 1 }))
            }
          >
            Book Slot
          </button>

          {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
        </section>
      )}

      {/* ================= OFFERS ================= */}
      {activeTab === "offers" && (
        <section className="content-card">
          <button
            className="btn btn-primary"
            onClick={() =>
              fetchData(api.get("/offers/eligible"))
            }
          >
            Eligible Offers
          </button>

          <button
            className="btn btn-secondary"
            onClick={() =>
              fetchData(api.post("/offers/apply", { offerId: 1 }))
            }
          >
            Apply Offer
          </button>

          {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
        </section>
      )}
    </DashboardLayout>
  );
}