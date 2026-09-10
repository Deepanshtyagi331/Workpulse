import React, { useState } from 'react';
import { Edit2, Trash2, Check, X, Clock, User } from 'lucide-react';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';


export function CommentItem({ comment, onUpdate, onDelete }) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Author & ownership determination
  const author = comment.author;
  const authorName = author?.name || `User #${comment.user_id}`;
  const authorRole = author?.role || author?.department || 'Team Member';
  const avatarInitials = authorName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const isOwner = user?.id != null && Number(comment.user_id) === Number(user.id);

  // Format dates
  const createdDate = new Date(comment.created_at);
  const isEdited =
    comment.updated_at &&
    new Date(comment.updated_at).getTime() - createdDate.getTime() > 2000;

  const formattedTime = createdDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const handleSave = async () => {
    const trimmed = editContent.trim();
    if (!trimmed) {
      setError('Comment content cannot be empty.');
      return;
    }
    if (trimmed.length > 3000) {
      setError('Comment cannot exceed 3000 characters.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onUpdate(comment.id, trimmed);
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update comment.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditContent(comment.content || '');
    setError(null);
    setIsEditing(false);
  };

  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-white border border-slate-200/90 shadow-sm transition-all hover:border-slate-300">
      {/* Author Avatar */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-sm mt-0.5 ${
          isOwner ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
        }`}
      >
        {avatarInitials}
      </div>

      <div className="flex-1 min-w-0">
        {/* Comment Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-900">{authorName}</span>
            <span className="text-[11px] text-slate-400">•</span>
            <span className="text-[11px] text-slate-500">{authorRole}</span>
            {isOwner && (
              <span className="px-1.5 py-0.2 text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded">
                You
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span>{formattedTime}</span>
            {isEdited && <span className="italic text-slate-400">(edited)</span>}

            {/* Ownership Actions: Only show for current user's comments */}
            {isOwner && !isEditing && (
              <div className="flex items-center gap-1 ml-2 border-l border-slate-200 pl-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                  title="Edit comment"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span className="sr-only">Edit</span>
                </button>
                <button
                  onClick={() => onDelete(comment)}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                  title="Delete comment"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="sr-only">Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Comment Content or Edit Mode */}
        {isEditing ? (
          <div className="space-y-2 mt-2">
            <textarea
              rows={3}
              value={editContent}
              onChange={(e) => {
                setEditContent(e.target.value);
                if (error) setError(null);
              }}
              disabled={saving}
              className="block w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
            {error && <p className="text-xs text-rose-600">{error}</p>}
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCancel}
                disabled={saving}
                className="text-xs py-1 px-2.5"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                loading={saving}
                disabled={!editContent.trim() || saving}
                className="text-xs py-1 px-2.5"
              >
                Save
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
            {comment.content}
          </p>
        )}
      </div>
    </div>
  );
}

export default CommentItem;
