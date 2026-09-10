import React, { useState } from 'react';
import { Send } from 'lucide-react';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';

export function CommentForm({ onSubmit, loading = false, placeholder = 'Write a comment or status update...' }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = content.trim();

    if (!trimmed) {
      setError('Comment cannot be empty.');
      return;
    }

    if (trimmed.length > 3000) {
      setError('Comment cannot exceed 3000 characters.');
      return;
    }

    setError(null);
    onSubmit(trimmed, () => {
      setContent('');
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2.5">
      <div className="flex items-start gap-3">
        <div className="hidden sm:flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-xs shadow-sm mt-0.5">
          {user ? (() => { const p=(user.name||'').trim().split(' '); return p.length>=2?(p[0][0]+p[p.length-1][0]).toUpperCase():(user.name||'??').slice(0,2).toUpperCase(); })() : '??'}
        </div>
        <div className="flex-1 space-y-2">
          <div className="relative">
            <textarea
              rows={3}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (error) setError(null);
              }}
              placeholder={placeholder}
              disabled={loading}
              maxLength={3000}
              className={`block w-full rounded-xl border bg-white p-3 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 disabled:bg-slate-100 disabled:cursor-not-allowed ${
                error ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : 'border-slate-300'
              }`}
            />
          </div>

          {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-400">
              {content.length}/3000 characters
            </span>
            <div className="flex items-center gap-2">
              {content && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setContent('');
                    setError(null);
                  }}
                  disabled={loading}
                >
                  Clear
                </Button>
              )}
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={loading}
                disabled={!content.trim() || loading}
                icon={Send}
              >
                Post Comment
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

export default CommentForm;
