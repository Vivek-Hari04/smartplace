import React from 'react';
import Sidebar from './Sidebar';

export default function DashboardLayout({ 
  children, 
  user, 
  sidebarItems, 
  activeItem, 
  onSidebarChange,
  title
}) {
  return (
    <div className="layout-container">
      <Sidebar 
        user={user} 
        items={sidebarItems} 
        activeItem={activeItem} 
        onItemClick={onSidebarChange} 
        title={title}
      />
      
      <main className="layout-main">
        <div className="layout-content">
          {children}
        </div>
      </main>

      <style>{`
        .layout-container {
          display: flex;
          min-height: 100vh;
          background-color: var(--bg-primary);
          color: var(--text-primary);
        }

        .layout-main {
          flex: 1;
          margin-left: 260px; /* Sidebar width */
          width: calc(100% - 260px);
          min-height: 100vh;
          background-color: var(--bg-primary);
        }

        .layout-content {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        @media (max-width: 768px) {
          .layout-main {
            margin-left: 0;
            width: 100%;
          }
          /* We'll need a mobile sidebar toggle eventually */
        }
      `}</style>
    </div>
  );
}
