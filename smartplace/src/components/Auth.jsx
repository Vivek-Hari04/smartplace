import { useState } from 'react';
import Login from './Login';
import Register from './Register';
import '../styles/Auth.css';

export default function Auth({ onBack }) {
  const [isLogin, setIsLogin] = useState(true);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-header">
        <button
          type="button"
          className="auth-back"
          onClick={handleBack}
          aria-label="Back to home"
        >
          <span className="auth-back-icon" aria-hidden="true">←</span></button>
          <h2 className="auth-title">SmartPlace</h2>
      </div>

      {isLogin ? (
        <Login onSwitchToRegister={() => setIsLogin(false)} />
      ) : (
        <Register onSwitchToLogin={() => setIsLogin(true)} />
      )}
    </div>
  );
}
