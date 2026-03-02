import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import Auth from "./components/Auth";
import HomePage from "./pages/HomePage";
import StudentDashboard from "./pages/StudentDashboard";
import FacultyDashboard from "./pages/FacultyDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AlumniDashboard from "./pages/AlumniDashboard";

function App() {
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);

  /*INITIAL SESSION CHECK*/

  useEffect(() => {
    const initialize = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      setSession(session);

      if (session) {
        await fetchRole(session.user.id);
      } else {
        setLoading(false);
      }
    };

    initialize();

    /*LISTEN FOR AUTH CHANGES*/

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange(async (_event, session) => {
        setSession(session);

        if (session) {
          await fetchRole(session.user.id);
        } else {
          setRole(null);
          setLoading(false);
        }
      });

    return () => subscription.unsubscribe();
  }, []);

  /* FETCH USER ROLE*/

  const fetchRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("user_id", userId)
        .single();

      if (error) {
        console.warn(
          "Error fetching role, defaulting to student:",
          error.message
        );
        setRole("student");
      } else {
        setRole(data?.role || "student");
      }
    } catch (err) {
      console.error("Role fetch failed:", err);
      setRole("student");
    } finally {
      setLoading(false);
    }
  };

  /* LOADING SCREEN*/

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "5rem" }}>
        Loading application...
      </div>
    );
  }

  /* NOT LOGGED IN*/

  if (!session) {
    if (showAuth) return <Auth onBack={() => setShowAuth(false)} />;
    return <HomePage onEnter={() => setShowAuth(true)} />;
  }

  /* ROLE-BASED ROUTING*/

  const renderPage = () => {
    switch (role) {
      case "student":
        return (
          <StudentDashboard
            user={session.user}
            accessToken={session.access_token}
          />
        );

      case "faculty":
        return (
          <FacultyDashboard
            user={session.user}
            accessToken={session.access_token}
          />
        );

      case "alumni":
        return (
          <AlumniDashboard
            user={session.user}
            accessToken={session.access_token}
          />
        );

      case "admin":
        return (
          <AdminDashboard
            user={session.user}
            accessToken={session.access_token}
          />
        );

      default:
        return (
          <StudentDashboard
            user={session.user}
            accessToken={session.access_token}
          />
        );
    }
  };

  return <div>{renderPage()}</div>;
}

export default App;