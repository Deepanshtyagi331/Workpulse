import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  User,
  Clock,
  Edit2,
  Trash2,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  FolderTree,
  Shield,
} from 'lucide-react';

import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import PriorityBadge from '../components/common/PriorityBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/feedback/EmptyState';
import ErrorState from '../components/feedback/ErrorState';
import TaskForm from '../components/tasks/TaskForm';
import CommentForm from '../components/tasks/CommentForm';
import CommentItem from '../components/tasks/CommentItem';

import taskService from '../services/taskService';
import commentService from '../services/commentService';
import { useAuth } from '../context/AuthContext';

export function TaskDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Task & Comments State
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [loadingTask, setLoadingTask] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);
  const [taskError, setTaskError] = useState(null);
  const [commentsError, setCommentsError] = useState(null);
  const [is404, setIs404] = useState(false);

  // Notifications & Modals
  const [notification, setNotification] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteTaskOpen, setIsDeleteTaskOpen] = useState(false);
  const [deletingComment, setDeletingComment] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [postingComment, setPostingComment] = useState(false);

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Load Task Details
  const fetchTask = useCallback(async () => {
    setLoadingTask(true);
    setTaskError(null);
    setIs404(false);
    try {
      const data = await taskService.getTask(id);
      setTask(data);
    } catch (err) {
      const msg = err.message || 'Failed to load task details.';
      if (msg.includes('404') || msg.toLowerCase().includes('not found')) {
        setIs404(true);
      } else {
        setTaskError(msg);
      }
    } finally {
      setLoadingTask(false);
    }
  }, [id]);

  // Load Comments
  const fetchComments = useCallback(async () => {
    setLoadingComments(true);
    setCommentsError(null);
    try {
      const res = await commentService.getComments(id, { limit: 100, sort_order: 'asc' });
      const items = res.items || (Array.isArray(res) ? res : []);
      setComments(items);
    } catch (err) {
      setCommentsError(err.message || 'Failed to load comments for this task.');
    } finally {
      setLoadingComments(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTask();
    fetchComments();
  }, [fetchTask, fetchComments]);

  // Overdue Logic: due_date < now AND status != 'completed'
  const isOverdue = Boolean(
    task?.due_date &&
      new Date(task.due_date).getTime() < Date.now() &&
      task?.status !== 'completed'
  );

  // Edit Task
  const handleUpdateTask = async (payload) => {
    setFormSubmitting(true);
    setFormError(null);
    try {
      const updated = await taskService.updateTask(task.id, payload);
      setTask(updated);
      setIsEditModalOpen(false);
      showToast('Task updated successfully!');
    } catch (err) {
      setFormError(err.message || 'Failed to update task.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete Task
  const handleDeleteTask = async () => {
    setFormSubmitting(true);
    try {
      await taskService.deleteTask(task.id);
      setIsDeleteTaskOpen(false);
      navigate('/tasks', { replace: true });
    } catch (err) {
      showToast(`Could not delete task: ${err.message}`, 'error');
      setFormSubmitting(false);
    }
  };

  // Add Comment
  const handleAddComment = async (content, resetCallback) => {
    setPostingComment(true);
    try {
      // The backend derives the author from the JWT token — no user_id needed in body
      await commentService.createComment(task.id, { content });
      resetCallback();
      fetchComments();
      showToast('Comment posted.');
    } catch (err) {
      showToast(`Failed to post comment: ${err.message}`, 'error');
    } finally {
      setPostingComment(false);
    }
  };

  // Update Comment
  const handleUpdateComment = async (commentId, content) => {
    try {
      await commentService.updateComment(commentId, { content });
      fetchComments();
      showToast('Comment updated.');
    } catch (err) {
      showToast(`Failed to update comment: ${err.message}`, 'error');
    }
  };

  // Delete Comment
  const handleConfirmDeleteComment = async () => {
    if (!deletingComment) return;
    try {
      await commentService.deleteComment(deletingComment.id);
      setDeletingComment(null);
      fetchComments();
      showToast('Comment removed.');
    } catch (err) {
      showToast(`Failed to delete comment: ${err.message}`, 'error');
    }
  };

  // 1. Initial Loading State
  if (loadingTask) {
    return (
      <div className="py-24 max-w-4xl mx-auto">
        <LoadingSpinner size="lg" label={`Loading Task #${id}...`} />
      </div>
    );
  }

  // 2. 404 Not Found State
  if (is404) {
    return (
      <div className="py-16 max-w-xl mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
          <AlertTriangle className="w-6 h-6 text-amber-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Task Not Found</h2>
        <p className="text-sm text-slate-500">
          Task #{id} could not be located. It may have been removed or deleted.
        </p>
        <div className="pt-2">
          <Link to="/tasks">
            <Button variant="primary" size="md" icon={ArrowLeft}>
              Back to Tasks
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // 3. Other API Errors State
  if (taskError) {
    return (
      <div className="py-16 max-w-xl mx-auto space-y-4">
        <Link to="/tasks">
          <Button variant="ghost" size="sm" icon={ArrowLeft}>
            Back to Tasks
          </Button>
        </Link>
        <ErrorState
          title={`Error loading Task #${id}`}
          message={taskError}
          onRetry={fetchTask}
        />
      </div>
    );
  }

  if (!task) return null;

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Notification Banner */}
      {notification && (
        <div
          className={`flex items-center gap-2.5 p-3.5 rounded-xl text-xs font-medium border shadow-sm animate-in fade-in duration-200 ${
            notification.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {notification.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-start sm:items-center gap-3">
          <Link to="/tasks">
            <Button
              variant="secondary"
              size="sm"
              icon={ArrowLeft}
              className="text-slate-600 hover:text-slate-900"
              title="Return to Tasks list"
            >
              Tasks
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold text-slate-400">
                TASK-{task.id}
              </span>
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
              {isOverdue && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  <AlertTriangle className="w-3 h-3 text-rose-500" />
                  Overdue
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
              {task.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setFormError(null);
              setIsEditModalOpen(true);
            }}
            icon={Edit2}
          >
            Edit Task
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setIsDeleteTaskOpen(true)}
            icon={Trash2}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Description & Comments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Description Card */}
          <Card title="Task Description" subtitle="Scope and acceptance criteria" headerBorder={true}>
            {task.description ? (
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {task.description}
              </p>
            ) : (
              <p className="text-sm text-slate-400 italic">
                No description provided for this task.
              </p>
            )}
          </Card>

          {/* Comments / Notes Card */}
          <Card
            title="Comments & Notes"
            subtitle={`${comments.length} updates recorded on this task`}
            headerBorder={true}
            action={
              <button
                onClick={fetchComments}
                className="text-xs text-slate-400 hover:text-indigo-600 inline-flex items-center gap-1 transition-colors"
                title="Refresh comments"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh</span>
              </button>
            }
          >
            <div className="space-y-6">
              {/* Add Comment Form */}
              <div className="pb-4 border-b border-slate-100">
                <CommentForm
                  onSubmit={handleAddComment}
                  loading={postingComment}
                  placeholder={`Add a progress note as ${user?.name ?? 'you'}...`}
                />
              </div>

              {/* Comments Stream */}
              {loadingComments ? (
                <div className="py-8">
                  <LoadingSpinner label="Loading comments..." />
                </div>
              ) : commentsError ? (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 space-y-2">
                  <p>{commentsError}</p>
                  <Button variant="secondary" size="sm" onClick={fetchComments}>
                    Retry Loading Comments
                  </Button>
                </div>
              ) : comments.length === 0 ? (
                <EmptyState
                  icon={MessageSquare}
                  title="No comments yet"
                  description="Keep your team in sync by posting the first comment or status update above."
                />
              ) : (
                <div className="space-y-3">
                  {comments.map((c) => (
                    <CommentItem
                      key={c.id}
                      comment={c}
                      onUpdate={handleUpdateComment}
                      onDelete={setDeletingComment}
                    />
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column (1 Col): Metadata Details */}
        <div className="space-y-6">
          <Card title="Task Information" subtitle="System metadata & tracking" headerBorder={true}>
            <div className="space-y-4 text-xs">
              {/* Assignee Row */}
              <div className="flex items-start justify-between gap-2 py-1.5 border-b border-slate-100">
                <span className="font-semibold text-slate-500 uppercase tracking-wider">
                  Assignee
                </span>
                <div className="text-right">
                  {task.assignee ? (
                    <div className="flex items-center gap-2 justify-end">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px]">
                        {task.assignee.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-xs">{task.assignee.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {task.assignee.role || task.assignee.department || 'User'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">Unassigned</span>
                  )}
                </div>
              </div>

              {/* Status Row */}
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="font-semibold text-slate-500 uppercase tracking-wider">
                  Status
                </span>
                <StatusBadge status={task.status} />
              </div>

              {/* Priority Row */}
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="font-semibold text-slate-500 uppercase tracking-wider">
                  Priority
                </span>
                <PriorityBadge priority={task.priority} />
              </div>

              {/* Due Date Row */}
              <div className="flex items-start justify-between gap-2 py-1.5 border-b border-slate-100">
                <span className="font-semibold text-slate-500 uppercase tracking-wider">
                  Due Date
                </span>
                <div className="text-right">
                  <p
                    className={`font-semibold ${
                      isOverdue ? 'text-rose-600 font-bold' : 'text-slate-800'
                    }`}
                  >
                    {task.due_date
                      ? new Date(task.due_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'None specified'}
                  </p>
                  {isOverdue && (
                    <span className="text-[10px] text-rose-600 font-medium">
                      Past target deadline
                    </span>
                  )}
                </div>
              </div>

              {/* Created Date Row */}
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="font-semibold text-slate-500 uppercase tracking-wider">
                  Created
                </span>
                <span className="text-slate-700 font-medium">
                  {task.created_at
                    ? new Date(task.created_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })
                    : '—'}
                </span>
              </div>

              {/* Last Updated Row */}
              <div className="flex items-center justify-between py-1.5">
                <span className="font-semibold text-slate-500 uppercase tracking-wider">
                  Last Updated
                </span>
                <span className="text-slate-700 font-medium">
                  {task.updated_at
                    ? new Date(task.updated_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })
                    : '—'}
                </span>
              </div>
            </div>
          </Card>

          {/* Quick Context Card */}
          <Card title="Quick Pathways" subtitle="Associated workflows" headerBorder={true}>
            <div className="space-y-2 text-xs">
              <Link to="/tasks" className="block">
                <Button variant="secondary" size="sm" className="w-full justify-start text-xs">
                  <FolderTree className="w-3.5 h-3.5 mr-2 text-slate-400" />
                  <span>Browse All Tasks</span>
                </Button>
              </Link>
              <Link to="/tasks?assignee=2" className="block">
                <Button variant="secondary" size="sm" className="w-full justify-start text-xs">
                  <User className="w-3.5 h-3.5 mr-2 text-slate-400" />
                  <span>View My Assigned Tasks</span>
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Task Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Task #${task.id}`}
        subtitle="Modify attributes, status, or assignee."
        size="lg"
      >
        <TaskForm
          initialData={task}
          onSubmit={handleUpdateTask}
          onCancel={() => setIsEditModalOpen(false)}
          loading={formSubmitting}
          error={formError}
        />
      </Modal>

      {/* Delete Task Confirmation Modal */}
      <Modal
        isOpen={isDeleteTaskOpen}
        onClose={() => setIsDeleteTaskOpen(false)}
        title="Delete Task"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsDeleteTaskOpen(false)}
              disabled={formSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteTask}
              loading={formSubmitting}
            >
              Delete Task
            </Button>
          </div>
        }
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-rose-100 text-rose-600 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Are you sure you want to delete this task?
            </p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Task <strong className="text-slate-700">"{task.title}"</strong> and all its{' '}
              {comments.length} comments will be permanently removed. This action cannot be undone.
            </p>
          </div>
        </div>
      </Modal>

      {/* Delete Comment Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingComment)}
        onClose={() => setDeletingComment(null)}
        title="Delete Comment"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDeletingComment(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmDeleteComment}
            >
              Delete Comment
            </Button>
          </div>
        }
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-rose-100 text-rose-600 shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Are you sure you want to delete this comment?
            </p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Your comment will be permanently removed from this task.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default TaskDetailsPage;
