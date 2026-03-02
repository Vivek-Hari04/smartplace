import { useState } from 'react';
import { supabase } from '../lib/supabase';

type RegisterProps = {
  onSuccess?: () => void;
  onSwitchToLogin: () => void;
};

export default function Register({ onSwitchToLogin }: RegisterProps) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fname, setFname] = useState('');
  const [lname, setLname] = useState('');
  const [role, setRole] = useState('student');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Sign up the user
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          role: role,
          fname: fname,
          lname: lname
        }
      }
    });
    
    if (error) {
      alert(error.message);
    } else if (data.user) {
      // Create or update a user record
      // We use upsert in case a DB trigger already created the record
      const { error: profileError } = await supabase
        .from('users')
        .upsert([{ 
          user_id: data.user.id, 
          role: role,
          fname: fname,
          lname: lname
        }]);
      
      if (profileError) {
        console.warn('Error syncing user details:', profileError.message);
      }
      alert('Check your email for the confirmation link!');
      onSwitchToLogin();
    }
    setLoading(false);
  };

  return (
    <div className="auth-form-wrapper">
      <h3 className="auth-subtitle">Create an account</h3>
      <form className="auth-form" onSubmit={handleSignUp}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">First Name</label>
            <input
              className="form-input"
              type="text"
              placeholder="John"
              value={fname}
              onChange={(e) => setFname(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Last Name</label>
            <input
              className="form-input"
              type="text"
              placeholder="Doe"
              value={lname}
              onChange={(e) => setLname(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input
            className="form-input"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            className="form-input"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">I am a...</label>
          <select 
            className="form-select"
            value={role} 
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="student">Student</option>
            <option value="faculty">Faculty Member</option>
            <option value="admin">Admin / Placement Officer</option>
            <option value="alumni">Alumni</option>
            <option value="company">Company Recruiter</option>
          </select>
        </div>

        <button 
          type="submit" 
          className="auth-btn auth-btn-primary" 
          disabled={loading}
        >
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>
        
        <p className="auth-switch-text">
          Already have an account?{' '}
          <button type="button" className="auth-link-btn" onClick={onSwitchToLogin}>
            Login
          </button>
        </p>
      </form>
    </div>
  );
}
