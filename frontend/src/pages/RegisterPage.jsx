import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Zap, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/common/ThemeToggle';

const DEPARTMENTS = [
  'Engineering',
  'Product',
  'Design',
  'Operations',
  'Quality Assurance',
  'Security',
  'Marketing',
  'Finance',
  'Human Resources',
];

const ROLES = [
  'Member',
  'Senior Engineer',
  'Lead Architect',
  'Senior Backend Engineer',
  'Senior Frontend Engineer',
  'Senior Product Manager',
  'Staff UI/UX Designer',
  'DevOps Lead',
  'QA Automation Lead',
  'InfoSec Analyst',
  'Engineering Manager',
  'Product Director',
];

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    department: '',
    role: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (apiError) setApiError('');
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Full name is required.';
    if (!form.email.trim()) {
      next.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = 'Please enter a valid email address.';
    }
    if (!form.password) {
      next.password = 'Password is required.';
    } else if (form.password.length < 8) {
      next.password = 'Password must be at least 8 characters.';
    }
    if (!form.department) next.department = 'Department is required.';
    if (!form.role) next.role = 'Role is required.';
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fieldErrors = validate();
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    setLoading(true);
    setApiError('');
    try {
      await register(form);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setApiError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = (name) =>
    `w-full px-3.5 py-2.5 bg-white dark:bg-white/8 border rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${
      errors[name]
        ? 'border-rose-300 dark:border-rose-500/50 focus:ring-rose-500/30'
        : 'border-slate-300 dark:border-white/15 focus:ring-indigo-500/50 focus:border-indigo-500'
    }`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-100 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 flex items-center justify-center p-4 relative transition-colors">
      {/* Theme Toggle in top-right */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle id="register-theme-toggle" />
      </div>

      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/30 mb-4">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">WorkPulse</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Create your account</p>
        </div>

        {/* Card */}
        <div className="bg-white/90 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-8 shadow-xl dark:shadow-2xl">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">Join the team</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Fill in your details to create an account.</p>

          {/* API error */}
          {apiError && (
            <div className="flex items-start gap-2.5 p-3 mb-5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl">
              <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 mt-0.5 shrink-0" />
              <p className="text-rose-700 dark:text-rose-300 text-sm font-medium">{apiError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Full Name */}
            <div>
              <label htmlFor="reg-name" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="reg-name"
                name="name"
                type="text"
                autoComplete="name"
                value={form.name}
                onChange={handleChange}
                disabled={loading}
                placeholder="Alex Rivera"
                className={fieldClass('name')}
              />
              {errors.name && <p className="text-rose-600 dark:text-rose-400 text-xs mt-1 font-medium">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                id="reg-email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                disabled={loading}
                placeholder="you@workpulse.internal"
                className={fieldClass('email')}
              />
              {errors.email && <p className="text-rose-600 dark:text-rose-400 text-xs mt-1 font-medium">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="reg-password" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Min. 8 characters"
                  className={`${fieldClass('password')} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-rose-600 dark:text-rose-400 text-xs mt-1 font-medium">{errors.password}</p>}
              {form.password.length >= 8 && !errors.password && (
                <p className="text-emerald-600 dark:text-emerald-400 text-xs mt-1 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3 h-3" /> Looks good
                </p>
              )}
            </div>

            {/* Department */}
            <div>
              <label htmlFor="reg-department" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Department <span className="text-rose-500">*</span>
              </label>
              <select
                id="reg-department"
                name="department"
                value={form.department}
                onChange={handleChange}
                disabled={loading}
                className={`${fieldClass('department')} appearance-none`}
              >
                <option value="" disabled className="text-slate-400">Select a department</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{d}</option>
                ))}
              </select>
              {errors.department && <p className="text-rose-600 dark:text-rose-400 text-xs mt-1 font-medium">{errors.department}</p>}
            </div>

            {/* Role */}
            <div>
              <label htmlFor="reg-role" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Role <span className="text-rose-500">*</span>
              </label>
              <select
                id="reg-role"
                name="role"
                value={form.role}
                onChange={handleChange}
                disabled={loading}
                className={`${fieldClass('role')} appearance-none`}
              >
                <option value="" disabled className="text-slate-400">Select a role</option>
                {ROLES.map((r) => (
                  <option key={r} value={r} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{r}</option>
                ))}
              </select>
              {errors.role && <p className="text-rose-600 dark:text-rose-400 text-xs mt-1 font-medium">{errors.role}</p>}
            </div>

            {/* Submit */}
            <button
              id="register-submit"
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/25 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
