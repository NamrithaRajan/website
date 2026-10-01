import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Mail, Lock, ChevronRight, Shield } from 'lucide-react';
import { login } from '../lib/api';
import { useCampusStore } from '../store/useStore';

const DEMO_ACCOUNTS = [
  { email: 'admin@campus.edu', role: 'Administrator', color: '#ef4444' },
  { email: 'facility@campus.edu', role: 'Facility Manager', color: '#3b82f6' },
  { email: 'security@campus.edu', role: 'Security Officer', color: '#f59e0b' },
  { email: 'student@campus.edu', role: 'Student/Faculty', color: '#10b981' },
];

export default function Login() {
  const [email, setEmail] = useState('admin@campus.edu');
  const [password, setPassword] = useState('campus123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useCampusStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      setAuth(data.user, data.token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Animated background */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 20% 50%, rgba(59,130,246,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(6,182,212,0.06) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(139,92,246,0.05) 0%, transparent 50%)',
      }} />

      <div style={{ width: '100%', maxWidth: 420, padding: 24, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, margin: '0 auto 14px',
            background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 40px rgba(59,130,246,0.3)',
          }}>
            <Activity size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
            SmartCampus
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', letterSpacing: '1px' }}>
            AUTOMATION CONTROL CENTER
          </p>
        </div>

        {/* Login Form */}
        <div className="card" style={{ padding: 28 }}>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full" style={{ paddingLeft: 36 }}
                  placeholder="you@campus.edu" required
                />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full" style={{ paddingLeft: 36 }}
                  placeholder="••••••••" required minLength={6}
                />
              </div>
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--accent-red)' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
              style={{ justifyContent: 'center', padding: '12px 20px', fontSize: 15, fontWeight: 600 }}
            >
              {loading ? <><div className="spinner" /> Authenticating...</> : <>Sign In <ChevronRight size={16} /></>}
            </button>
          </form>
        </div>

        {/* Demo Accounts */}
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Quick Login Demo Accounts
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {DEMO_ACCOUNTS.map(acc => (
              <button
                key={acc.email}
                className="btn btn-ghost btn-sm"
                onClick={() => { setEmail(acc.email); setPassword('campus123'); }}
                style={{ justifyContent: 'flex-start', padding: '8px 10px' }}
              >
                <Shield size={12} color={acc.color} />
                <span style={{ fontSize: 11 }}>{acc.role}</span>
              </button>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 10, fontSize: 10, color: 'var(--text-muted)' }}>
            All demo accounts use password: <span className="font-mono" style={{ color: 'var(--accent-cyan)' }}>campus123</span>
          </div>
        </div>
      </div>
    </div>
  );
}
