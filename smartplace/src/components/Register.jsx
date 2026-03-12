import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Register({ onSwitchToLogin }) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fname, setFname] = useState('');
  const [lname, setLname] = useState('');
  const [role, setRole] = useState('student');

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Proactive Guardrail: Check if the email already exists in our public.users table
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('user_id')
        .eq('email', email)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing user:', checkError.message);
      }

      if (existingUser) {
        alert('This email is already registered. Please login to your account.');
        onSwitchToLogin();
        setLoading(false);
        return;
      }
      
      // 2. Sign up the user
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
        // 3. Secondary Guardrail: Check identities
        // Supabase returns an empty identities array if the email is already taken (with confirmations enabled)
        if (data.user.identities && data.user.identities.length === 0) {
          alert('This email is already registered. Please login to your account.');
          onSwitchToLogin();
          setLoading(false);
          return;
        }

        // Create or update a user record
        const { error: profileError } = await supabase
          .from('users')
          .upsert([{ 
            user_id: data.user.id, 
            email: email, // Include email in the record
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
    } catch (err) {
      alert('An unexpected error occurred: ' + err.message);
    } finally {
      setLoading(false);
    }
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
