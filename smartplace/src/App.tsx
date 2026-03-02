import { useEffect, useState, useCallback } from "react";
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

  /* ================= FETCH USER ROLE ================= */

  const fetchRole = useCallback(async (userId: string) => {
    console.log("Fetching role for user:", userId);
    try {
      // Adding a local timeout for the DB query specifically
      const promise = supabase
        .from("users")
        .select("role")
        .eq("user_id", userId)
        .single();
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Database query timed out")), 10000)
      );

      const { data, error }: any = await Promise.race([promise, timeoutPromise]);

      if (error) {
        console.warn("Error fetching role, defaulting to student:", error.message);
        setRole("student");
      } else {
        console.log("Role fetched successfully:", data?.role);
        setRole(data?.role || "student");
      }
    } catch (err: any) {
      console.error("Role fetch failed or timed out:", err.message);
      setRole("student");
    } finally {
      setLoading(false);
    }
  }, []);

  /* ================= AUTH INITIALIZATION ================= */

  useEffect(() => {
    let mounted = true;

    // Safety timeout: If everything hangs, just stop loading after 6 seconds
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn("Global Auth safety timeout triggered");
        setLoading(false);
      }
    }, 6000);

    const checkSession = async () => {
      console.log("Checking initial session...");
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (mounted) {
          console.log("Initial session status:", !!session);
          setSession(session);
          if (session) {
            await fetchRole(session.user.id);
          } else {
            setLoading(false);
          }
        }
      } catch (err) {
        console.error("Session check failed:", err);
        if (mounted) setLoading(false);
      }
    };

    checkSession();

    /* ================= LISTEN FOR AUTH CHANGES ================= */
    const { data: { subscription } } =
      supabase.auth.onAuthStateChange(async (event, newSession) => {
        if (!mounted) return;
        
        console.log("Auth event fired:", event, "Session exists:", !!newSession);
        
        setSession(newSession);
        if (newSession) {
          await fetchRole(newSession.user.id);
        } else {
          setRole(null);
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, [fetchRole]);

  /* ================= RENDER LOGIC ================= */

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>SmartPlace</div>
        <div>Loading application...</div>
      </div>
    );
  }

  if (!session) {
    if (showAuth) return <Auth onBack={() => setShowAuth(false)} />;
    return <HomePage onEnter={() => setShowAuth(true)} />;
  }

  const renderDashboard = () => {
    const userRole = role || "student";
    
    switch (userRole) {
      case "student": return <StudentDashboard user={session.user} accessToken={session.access_token} />;
      case "faculty": return <FacultyDashboard user={session.user} accessToken={session.access_token} />;
      case "alumni": return <AlumniDashboard user={session.user} accessToken={session.access_token} />;
      case "admin": return <AdminDashboard user={session.user} accessToken={session.access_token} />;
      default: return <StudentDashboard user={session.user} accessToken={session.access_token} />;
    }
  };

  return <>{renderDashboard()}</>;
}

export default App;
