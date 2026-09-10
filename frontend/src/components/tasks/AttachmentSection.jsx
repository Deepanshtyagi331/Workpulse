import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Paperclip,
  Upload,
  Download,
  Trash2,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  File,
} from 'lucide-react';

import Button from '../common/Button';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../feedback/EmptyState';
import ErrorState from '../feedback/ErrorState';
import attachmentService from '../../services/attachmentService';
import { formatFileSize } from '../../utils/formatters';
import { useWebSocket } from '../../hooks/useWebSocket';

const ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.webp';
const MAX_BYTES = 10 * 1024 * 1024;

function fileIcon(filename) {
  const ext = (filename || '').split('.').pop()?.toLowerCase();
  if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) return ImageIcon;
  if (['xls', 'xlsx', 'csv'].includes(ext)) return FileSpreadsheet;
  if (['pdf', 'doc', 'docx', 'txt'].includes(ext)) return FileText;
  return File;
}

export function AttachmentSection({
  taskId,
  canUpload = false,
  canDeleteAttachment,
  onChanged,
  onNotify,
}) {
  const inputRef = useRef(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const fetchAttachments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await attachmentService.getAttachments(taskId, { limit: 50 });
      setItems(res.items || []);
    } catch (err) {
      setError(err.message || 'Failed to load attachments.');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  // Real-time WebSocket event listeners for attachments
  const { subscribe } = useWebSocket();
  useEffect(() => {
    const unsubUpload = subscribe('attachment.uploaded', (event) => {
      if (Number(event.data?.task_id) === Number(taskId)) {
        fetchAttachments();
      }
    });

    const unsubDelete = subscribe('attachment.deleted', (event) => {
      if (Number(event.data?.task_id) === Number(taskId)) {
        fetchAttachments();
      }
    });

    return () => {
      unsubUpload();
      unsubDelete();
    };
  }, [taskId, subscribe, fetchAttachments]);

  const notify = (message, type = 'success') => {
    if (onNotify) onNotify(message, type);
  };

  const handlePick = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > MAX_BYTES) {
      notify('File is larger than 10 MB.', 'error');
      return;
    }
    setSelected(file);
  };

  const handleUpload = async () => {
    if (!selected) return;
    setUploading(true);
    try {
      await attachmentService.upload(taskId, selected);
      setSelected(null);
      notify('Attachment uploaded.');
      await fetchAttachments();
      if (onChanged) onChanged();
    } catch (err) {
      notify(err.message || 'Upload failed.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (attachment) => {
    setBusyId(attachment.id);
    try {
      await attachmentService.download(attachment.id, attachment.original_filename);
    } catch (err) {
      notify(err.message || 'Download failed.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    setBusyId(deleting.id);
    try {
      await attachmentService.delete(deleting.id);
      setDeleting(null);
      notify('Attachment deleted.');
      await fetchAttachments();
      if (onChanged) onChanged();
    } catch (err) {
      notify(err.message || 'Could not delete attachment.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4 min-w-0">
      {loading ? (
        <div className="py-8">
          <LoadingSpinner label="Loading attachments..." />
        </div>
      ) : error ? (
        <ErrorState
          title="Unable to load attachments"
          message={error}
          onRetry={fetchAttachments}
          className="p-6"
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Paperclip}
          title="No attachments yet"
          description="Upload a document or image to keep related files with this task."
          className="p-8 shadow-none"
        />
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-700/60 rounded-xl border border-slate-200 dark:border-slate-700/80 overflow-hidden">
          {items.map((item) => {
            const Icon = fileIcon(item.original_filename);
            const showDelete = canDeleteAttachment ? canDeleteAttachment(item) : false;
            return (
              <li
                key={item.id}
                className="flex flex-col gap-3 bg-white dark:bg-slate-800 p-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="break-all text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {item.original_filename}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {formatFileSize(item.file_size)}
                      <span className="mx-1.5 text-slate-300 dark:text-slate-600">·</span>
                      Uploaded by {item.uploaded_by?.name || 'Unknown / Deleted User'}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      {item.created_at
                        ? new Date(item.created_at).toLocaleString('en-US', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })
                        : ''}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Download}
                    loading={busyId === item.id && !deleting}
                    onClick={() => handleDownload(item)}
                  >
                    Download
                  </Button>
                  {showDelete && (
                    <Button
                      variant="danger"
                      size="sm"
                      icon={Trash2}
                      onClick={() => setDeleting(item)}
                      data-testid={`delete-attachment-${item.id}`}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {canUpload && (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/50 p-3.5 space-y-3">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={handlePick}
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="min-w-0 text-xs text-slate-500 dark:text-slate-400 break-all">
              {selected
                ? `${selected.name} (${formatFileSize(selected.size)})`
                : 'PDF, Office, CSV, TXT, or images up to 10 MB.'}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={Paperclip}
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
              >
                Choose file
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Upload}
                onClick={handleUpload}
                loading={uploading}
                disabled={!selected || uploading}
              >
                Upload Attachment
              </Button>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete Attachment"
        size="sm"
        footer={
          <div className="flex w-full items-center justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmDelete}
              loading={Boolean(deleting && busyId === deleting.id)}
              data-testid="confirm-delete-attachment"
            >
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-sm text-slate-700 dark:text-slate-300">
          Delete <strong className="break-all text-slate-900 dark:text-slate-100">{deleting?.original_filename}</strong>? This removes
          the file from the task and from storage.
        </p>
      </Modal>
    </div>
  );
}

export default AttachmentSection;
