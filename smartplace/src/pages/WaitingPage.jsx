import { supabase } from "../lib/supabase";

export default function WaitingPage({ user, rejection }) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="waiting-page-container">
      <style>{`
        .waiting-page-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-primary);
          padding: 1rem;
        }

        .waiting-card {
          max-width: 440px;
          width: 100%;
          background: var(--bg-secondary);
          border-radius: 24px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          padding: 2.5rem;
          text-align: center;
          border: 1px solid var(--border-color);
        }

        .icon-container {
          margin-bottom: 1.5rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 80px;
          height: 80px;
          border-radius: 50%;
        }

        .icon-pending {
          background: rgba(59, 130, 246, 0.1);
        }

        .icon-rejected {
          background: rgba(239, 68, 68, 0.1);
        }

        .icon-container svg {
          width: 40px;
          height: 40px;
        }

        .icon-pending svg { color: #3b82f6; }
        .icon-rejected svg { color: #ef4444; }

        .waiting-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .waiting-description {
          color: var(--text-secondary);
          margin-bottom: 2rem;
          line-height: 1.5;
        }

        .status-alert {
          padding: 1.25rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
          text-align: left;
        }

        .alert-pending {
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.2);
        }

        .alert-rejected {
          background: rgba(239, 68, 68, 0.05);
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .status-alert p {
          font-size: 0.875rem;
          margin: 0;
        }

        .alert-pending p { color: #d97706; }
        .alert-rejected .reason-label { 
          color: #ef4444; 
          font-weight: 700;
          display: block;
          margin-bottom: 0.25rem;
        }
        .alert-rejected .description-text { 
          color: var(--text-primary);
          font-size: 0.9rem;
        }

        .btn-logout {
          width: 100%;
          padding: 0.75rem 1rem;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          font-weight: 600;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-logout:hover {
          background: var(--border-color);
        }
      `}</style>

      <div className="waiting-card">
        <div className={`icon-container ${rejection ? 'icon-rejected' : 'icon-pending'}`}>
          {rejection ? (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ) : (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        
        <h1 className="waiting-title">
          {rejection ? 'Registration Rejected' : 'Registration Pending'}
        </h1>
        
        <p className="waiting-description">
          Hello, <strong>{user.email}</strong>!<br />
          {rejection 
            ? 'Unfortunately, your registration has been declined by the administrator.' 
            : 'Your account is currently awaiting administrator approval.'}
        </p>

        <div className={`status-alert ${rejection ? 'alert-rejected' : 'alert-pending'}`}>
          {rejection ? (
            <>
              <span className="reason-label">REASON: {rejection.reason.toUpperCase()}</span>
              <p className="description-text">{rejection.description || 'No additional details provided.'}</p>
            </>
          ) : (
            <p>This process usually takes 24-48 hours. Please check back later.</p>
          )}
        </div>

        <button onClick={handleLogout} className="btn-logout">
          Sign Out
        </button>
      </div>
    </div>
  );
}
