import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "./lib/supabase";
import Auth from "./components/Auth";
import ThemeToggle from "./components/ThemeToggle";
import HomePage from "./pages/HomePage";
import StudentDashboard from "./pages/StudentDashboard";
import FacultyDashboard from "./pages/FacultyDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AlumniDashboard from "./pages/AlumniDashboard";
import CompanyDashboard from "./pages/CompanyDashboard";
import NotFound from "./pages/NotFound";

function App() {
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  
  // Track the last processed user ID to prevent redundant fetches
  const lastFetchedUserId = useRef<string | null>(null);

  /* ================= FETCH USER ROLE ================= */

  // Removed 'role' from dependencies to prevent the loop
  const fetchRole = useCallback(async (userId: string, currentSession: any) => {
    // If we already have a role for this user, we can skip re-fetching 
    // BUT we should still set loading to false.
    if (lastFetchedUserId.current === userId && lastFetchedUserId.current !== null) {
      setLoading(false);
      return;
    }
    
    console.log("Fetching role for user:", userId);
    lastFetchedUserId.current = userId;

    // 1. Check Metadata first (available immediately)
    const metadataRole = currentSession.user?.user_metadata?.role;
    if (metadataRole) {
      console.log("Using role from metadata:", metadataRole);
      setRole(metadataRole);
      setLoading(false); 
      // We continue to sync with DB in background
    }

    try {
      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("user_id", userId)
        .single();

      if (!error && data?.role) {
        console.log("Synced role from DB:", data.role);
        setRole(data.role);
      } else if (error) {
        console.warn("DB role fetch skipped/failed:", error.message);
        // Fallback if metadata was also missing
        if (!metadataRole) setRole("student");
      }
    } catch (err: any) {
      console.error("Role fetch exception:", err.message);
      if (!metadataRole) setRole("student");
    } finally {
      setLoading(false);
    }
  }, []); // Stable dependency array

  /* ================= AUTH INITIALIZATION ================= */

  useEffect(() => {
    let mounted = true;

    // Safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn("Auth safety timeout reached");
        setLoading(false);
      }
    }, 5000);

    const initializeAuth = async () => {
      try {
        // 1. Explicitly check for an existing session first
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (mounted) {
          if (initialSession) {
            setSession(initialSession);
            await fetchRole(initialSession.user.id, initialSession);
          } else {
            setLoading(false);
          }
        }
      } catch (err) {
        console.error("Initial session check failed:", err);
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    // 2. Listen for future changes
    const { data: { subscription } } =
      supabase.auth.onAuthStateChange(async (event, newSession) => {
        if (!mounted) return;
        
        console.log(`Auth Event: ${event}`);
        
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setRole(null);
          lastFetchedUserId.current = null;
          setLoading(false);
        } else if (newSession) {
          setSession(newSession);
          fetchRole(newSession.user.id, newSession);
        }
      });

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, [fetchRole]); // fetchRole is now stable

  /* ================= RENDER LOGIC ================= */

  if (window.location.pathname !== "/") {
    return (
      <>
        <ThemeToggle />
        <NotFound />
      </>
    );
  }

  if (loading) {
    return (
      <>
        <ThemeToggle />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>SmartPlace</div>
          <div>Loading application...</div>
        </div>
      </>
    );
  }

  if (!session) {
    if (showAuth) {
      return (
        <>
          <ThemeToggle />
          <Auth onBack={() => setShowAuth(false)} />
        </>
      );
    }
    return (
      <HomePage onEnter={() => setShowAuth(true)} />
    );
  }

  const renderDashboard = () => {
    /* Wait for role before rendering dashboard */
      if (!role) {
        return (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            Loading dashboard...
          </div>
        );
      }    
    switch (role) {
      case "student": return <StudentDashboard user={session.user} accessToken={session.access_token} />;
      case "faculty": return <FacultyDashboard user={session.user} accessToken={session.access_token} />;
      case "alumni": return <AlumniDashboard user={session.user} accessToken={session.access_token} />;
      case "admin": return <AdminDashboard user={session.user} accessToken={session.access_token} />;
      case "company": return <CompanyDashboard user={session.user} accessToken={session.access_token} />;
      default: return null;
    }
  };

  return (
    <>
      <ThemeToggle />
      {renderDashboard()}
    </>
  );
}

export default App;
