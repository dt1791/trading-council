import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await authAPI.login(email, password);
      localStorage.setItem('token', res.data.token);
      navigate('/');
    } catch (e) {
      setError('Invalid email or password');
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.left}>
        <div style={styles.brandContent}>
          <div style={styles.logoWrap}>
            <svg width="52" height="52" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="8" fill="#c9a84c" opacity="0.08"/>
              <circle cx="20" cy="20" r="5" fill="#c9a84c" opacity="0.15"/>
              <circle cx="20" cy="20" r="2.5" fill="#e8c85a"/>
              <circle cx="20" cy="4" r="1.5" fill="#c9a84c"/>
              <circle cx="20" cy="36" r="1.5" fill="#c9a84c"/>
              <circle cx="4" cy="20" r="1.5" fill="#c9a84c"/>
              <circle cx="36" cy="20" r="1.5" fill="#c9a84c"/>
              <circle cx="8" cy="8" r="1.5" fill="#c9a84c"/>
              <circle cx="32" cy="32" r="1.5" fill="#c9a84c"/>
              <circle cx="32" cy="8" r="1.5" fill="#c9a84c"/>
              <circle cx="8" cy="32" r="1.5" fill="#c9a84c"/>
              <line x1="20" y1="20" x2="20" y2="4" stroke="#c9a84c" strokeWidth="0.75" opacity="0.6"/>
              <line x1="20" y1="20" x2="20" y2="36" stroke="#c9a84c" strokeWidth="0.75" opacity="0.6"/>
              <line x1="20" y1="20" x2="4" y2="20" stroke="#c9a84c" strokeWidth="0.75" opacity="0.6"/>
              <line x1="20" y1="20" x2="36" y2="20" stroke="#c9a84c" strokeWidth="0.75" opacity="0.6"/>
              <line x1="20" y1="20" x2="8" y2="8" stroke="#c9a84c" strokeWidth="0.75" opacity="0.6"/>
              <line x1="20" y1="20" x2="32" y2="32" stroke="#c9a84c" strokeWidth="0.75" opacity="0.6"/>
              <line x1="20" y1="20" x2="32" y2="8" stroke="#c9a84c" strokeWidth="0.75" opacity="0.6"/>
              <line x1="20" y1="20" x2="8" y2="32" stroke="#c9a84c" strokeWidth="0.75" opacity="0.6"/>
            </svg>
            <span style={styles.brandName}>SAGE</span>
          </div>
          <div style={styles.tagline}>
            <p style={styles.line1}>Your money.</p>
            <p style={styles.line1}>Your personal board of advisors.</p>
            <p style={styles.line2}>No blind spots.</p>
          </div>
          <p style={styles.sub}>
            A panel of AI advisors — each with a distinct investment lens, weighted to your financial profile, united by one clear verdict.
          </p>
        </div>
      </div>

      <div style={styles.right}>
        <div style={styles.formBox}>
          <h2 style={styles.formTitle}>Welcome back</h2>
          <p style={styles.formSubtitle}>Sign in to your account</p>
          {error && <p style={styles.error}>{error}</p>}
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </div>
          <button style={styles.button} onClick={handleLogin}>
            Sign in
          </button>
          <p style={styles.link}>
            Don't have an account? <Link to="/register" style={styles.linkAnchor}>Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { display: 'flex', height: '100vh', fontFamily: 'Georgia, serif' },
  left: { flex: 1, background: '#2d3d2e', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem' },
  brandContent: { maxWidth: '640px' },
  logoWrap: { display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '4rem' },
  brandName: { fontSize: '48px', fontWeight: 400, color: '#e8d5a3', letterSpacing: '0.25em', fontFamily: 'Georgia, serif' },
  tagline: { marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0' },
  line1: { fontSize: '36px', fontWeight: 400, color: 'rgba(255,255,255,0.92)', lineHeight: 1.3, letterSpacing: '-0.5px', margin: '0', padding: '0' },
  line2: { fontSize: '36px', fontWeight: 400, color: '#8fad7c', lineHeight: 1.3, letterSpacing: '-0.5px', margin: '0', padding: '0' },
  sub: { fontSize: '13px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.7, borderTop: '0.5px solid rgba(255,255,255,0.08)', paddingTop: '1.5rem' },
  right: { width: '480px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', background: '#f0ede6' },
  formBox: { width: '100%', maxWidth: '360px' },
  formTitle: { fontSize: '26px', fontWeight: 400, color: '#1a2a1b', margin: '0 0 4px', fontFamily: 'Georgia, serif' },
  formSubtitle: { fontSize: '14px', color: '#7a8a7b', margin: '0 0 2rem', fontFamily: 'system-ui, sans-serif' },
  field: { marginBottom: '1rem', fontFamily: 'system-ui, sans-serif' },
  label: { display: 'block', fontSize: '12px', fontWeight: 500, color: '#4a5a4b', marginBottom: '6px', letterSpacing: '0.02em' },
  input: { width: '100%', padding: '11px 14px', border: '0.5px solid #c8d4c9', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', background: 'white', color: '#1a2a1b', fontFamily: 'system-ui, sans-serif' },
  button: { width: '100%', padding: '13px', background: '#2d3d2e', color: 'rgba(255,255,255,0.92)', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 500, cursor: 'pointer', marginTop: '8px', marginBottom: '1.5rem', fontFamily: 'system-ui, sans-serif' },
  error: { color: '#dc2626', fontSize: '13px', marginBottom: '1rem', padding: '10px', background: '#fef2f2', borderRadius: '6px', fontFamily: 'system-ui, sans-serif' },
  link: { textAlign: 'center', fontSize: '13px', color: '#7a8a7b', fontFamily: 'system-ui, sans-serif' },
  linkAnchor: { color: '#4a6b3a', fontWeight: 500 }
};