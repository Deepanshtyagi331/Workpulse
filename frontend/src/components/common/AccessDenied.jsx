import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AccessDenied({ message, requiredRoles }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="w-16 h-16 mb-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Access Denied</h1>
      <p className="text-slate-500 dark:text-slate-400 max-w-md mb-6">
        {message || "You don't have permission to view or perform actions on this resource."}
      </p>

      {requiredRoles && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 mb-8">
          <span>Required role:</span>
          <span className="font-semibold text-rose-500 dark:text-rose-400 uppercase">
            {Array.isArray(requiredRoles) ? requiredRoles.join(' or ') : requiredRoles}
          </span>
          <span className="text-slate-400 dark:text-slate-500">•</span>
          <span>Your role:</span>
          <span className="font-semibold text-cyan-600 dark:text-cyan-400 uppercase">
            {user?.app_role || 'None'}
          </span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700/50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
        >
          <Home className="w-4 h-4" />
          Dashboard
        </Link>
      </div>
    </div>
  );
}
