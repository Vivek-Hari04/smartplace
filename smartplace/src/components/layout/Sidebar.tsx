import { supabase } from '../../lib/supabase';

interface SidebarItem {
  id: string;
  label: string;
  icon?: string; // Optional icon for future
}

interface SidebarProps {
  user: any;
  items: SidebarItem[];
  activeItem: string;
  onItemClick: (id: string) => void;
  title?: string;
}

export default function Sidebar({ user, items, activeItem, onItemClick, title = 'SmartPlace' }: SidebarProps) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">{title}</div>
        <div className="sidebar-user">
          <div className="user-avatar">{user.email?.charAt(0).toUpperCase()}</div>
          <div className="user-info">
            <span className="user-email">{user.email}</span>
            <span className="user-role">{user.user_metadata?.role || 'User'}</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {items.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activeItem === item.id ? 'active' : ''}`}
            onClick={() => onItemClick(item.id)}
          >
            {item.icon && <span className="nav-icon">{item.icon}</span>}
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>  
      <style>{`
        .sidebar {
          width: 260px;
          background-color: var(--bg-secondary);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          height: 100vh;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 100;
          padding: 1.5rem;
        }

        .sidebar-header {
          margin-bottom: 2rem;
        }

        .sidebar-logo {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          text-transform: uppercase;
          letter-spacing: -0.02em;
        }

        .sidebar-user {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background-color: var(--bg-tertiary);
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-color);
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          background-color: var(--text-primary);
          color: var(--bg-primary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .user-info {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .user-email {
          font-size: 0.85rem;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 140px;
        }

        .user-role {
          font-size: 0.75rem;
          color: var(--text-secondary);
          text-transform: capitalize;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex: 1;
          overflow-y: auto;
        }

        .nav-item {
          text-align: left;
          padding: 0.75rem 1rem;
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          background: transparent;
          border: 1px solid transparent;
          cursor: pointer;
          transition: var(--transition-speed);
          font-size: 0.9rem;
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .nav-item:hover {
          color: var(--text-primary);
          background-color: var(--bg-tertiary);
        }

        .nav-item.active {
          color: var(--text-primary);
          background-color: var(--bg-tertiary);
          border-color: var(--border-color);
          font-weight: 500;
        }

        .nav-icon {
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
        }

        .sidebar-footer {
          margin-top: auto;
          padding-top: 1rem;
          border-top: 1px solid var(--border-color);
        }

        .logout-btn {
          width: 100%;
          padding: 0.75rem;
          color: var(--danger-color);
          background: transparent;
          border: 1px solid transparent;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: var(--transition-speed);
          font-size: 0.9rem;
        }

        .logout-btn:hover {
          background-color: rgba(255, 68, 68, 0.1);
          border-color: var(--danger-color);
        }
      `}</style>
    </aside>
  );
}
