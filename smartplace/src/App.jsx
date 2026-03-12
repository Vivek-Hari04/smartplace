import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import Auth from "./components/Auth";
import ThemeToggle from "./components/ThemeToggle";
import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import FacultyDashboard from "./pages/FacultyDashboard";
import CompanyDashboard from "./pages/CompanyDashboard";
import AlumniDashboard from "./pages/AlumniDashboard";
import HomePage from "./pages/HomePage";
import ProfileEditing from "./pages/ProfileEditing";
import "./index.css";

function App() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchRole(session.user.id);
      else setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchRole(session.user.id);
      else {
        setRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchRole = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("user_id", userId)
        .single();

      if (error) throw error;
      console.log("Synced role from DB:", data.role);
      setRole(data.role);
    } catch (err) {
      console.error("Error fetching role:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <Auth />
      </div>
    );
  }

  const renderDashboard = () => {
    switch (role) {
      case "admin": return <AdminDashboard user={session.user} accessToken={session.access_token} />;
      case "student": return <StudentDashboard user={session.user} accessToken={session.access_token} />;
      case "faculty": return <FacultyDashboard user={session.user} accessToken={session.access_token} />;
      case "company": return <CompanyDashboard user={session.user} accessToken={session.access_token} />;
      case "alumni": return <AlumniDashboard user={session.user} accessToken={session.access_token} />;
      default: return <ProfileEditing user={session.user} onComplete={() => fetchRole(session.user.id)} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {renderDashboard()}
    </div>
  );
}

export default App;
