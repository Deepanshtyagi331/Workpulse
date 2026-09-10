import math
import os
import uuid
from pathlib import Path
from typing import Dict, Any, Optional, Set

from fastapi import HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.roles import UserAppRole
from app.core.storage import max_upload_bytes, stored_file_path, upload_root
from app.models.attachment import Attachment
from app.models.task import Task
from app.models.task_history import HistoryAction
from app.models.user import User
from app.repositories.attachment_repository import AttachmentRepository
from app.repositories.task_repository import TaskRepository
from app.schemas.attachment import AttachmentResponse
from app.schemas.user import UserSummary
from app.services.task_history_service import TaskHistoryService
from app.websocket.manager import manager, create_ws_event

ALLOWED_EXTENSIONS: Set[str] = {
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".csv",
    ".txt",
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
}

ALLOWED_CONTENT_TYPES = {
    ".pdf": {"application/pdf"},
    ".png": {"image/png"},
    ".jpg": {"image/jpeg"},
    ".jpeg": {"image/jpeg"},
    ".webp": {"image/webp"},
    ".txt": {"text/plain", "text/plain; charset=utf-8", "application/octet-stream"},
    ".csv": {"text/csv", "text/plain", "application/csv", "application/octet-stream"},
    ".doc": {"application/msword", "application/octet-stream"},
    ".xls": {"application/vnd.ms-excel", "application/octet-stream"},
    ".docx": {
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/zip",
        "application/octet-stream",
    },
    ".xlsx": {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/zip",
        "application/octet-stream",
    },
}

CHUNK_SIZE = 64 * 1024


def _sanitize_original_name(raw: Optional[str]) -> str:
    name = Path(raw or "download").name.replace("\x00", "")
    if not name or name in {".", ".."} or ".." in name:
        return "download"
    return name[:255]


def _extension(filename: str) -> str:
    return Path(filename).suffix.lower()


def _matches_magic(ext: str, header: bytes) -> bool:
    if ext == ".pdf":
        return header.startswith(b"%PDF")
    if ext == ".png":
        return header.startswith(b"\x89PNG")
    if ext in {".jpg", ".jpeg"}:
        return header.startswith(b"\xff\xd8\xff")
    if ext == ".webp":
        return header.startswith(b"RIFF") and b"WEBP" in header[:16]
    if ext in {".docx", ".xlsx"}:
        return header.startswith(b"PK")
    if ext in {".doc", ".xls"}:
        return header.startswith(b"\xd0\xcf\x11\xe0") or header.startswith(b"PK")
    if ext in {".txt", ".csv"}:
        return b"\x00" not in header[:512]
    return False


class AttachmentService:
    def __init__(self, db: Session):
        self.repo = AttachmentRepository(db)
        self.task_repo = TaskRepository(db)
        self.history_service = TaskHistoryService(db)

    def _require_task(self, task_id: int) -> Task:
        task = self.task_repo.get_by_id(task_id)
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Task with ID {task_id} not found",
            )
        return task

    def _can_mutate(self, actor: User, task: Task) -> bool:
        if actor.app_role in {UserAppRole.ADMIN.value, UserAppRole.MANAGER.value}:
            return True
        return task.assigned_to == actor.id

    def _can_delete(self, actor: User, task: Task, attachment: Attachment) -> bool:
        if actor.app_role in {UserAppRole.ADMIN.value, UserAppRole.MANAGER.value}:
            return True
        return task.assigned_to == actor.id and attachment.uploaded_by == actor.id

    def _to_response(self, attachment: Attachment) -> AttachmentResponse:
        uploader = None
        if attachment.uploader is not None:
            uploader = UserSummary.model_validate(attachment.uploader)
        return AttachmentResponse(
            id=attachment.id,
            original_filename=attachment.original_filename,
            content_type=attachment.content_type,
            file_size=attachment.file_size,
            uploaded_by=uploader,
            created_at=attachment.created_at,
        )

    def list_for_task(
        self,
        task_id: int,
        page: int = 1,
        limit: int = 20,
    ) -> Dict[str, Any]:
        self._require_task(task_id)
        items, total = self.repo.list_for_task(task_id, page=page, limit=limit)
        total_pages = math.ceil(total / limit) if total > 0 else 0
        return {
            "items": [self._to_response(item) for item in items],
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages,
        }

    async def upload(self, task_id: int, upload: UploadFile, actor: User) -> AttachmentResponse:
        task = self._require_task(task_id)
        if not self._can_mutate(actor, task):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to attach files to this task.",
            )
        if upload is None or not upload.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A file is required.",
            )

        original = _sanitize_original_name(upload.filename)
        ext = _extension(original)
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported file type. Allowed: PDF, Word, Excel, CSV, TXT, PNG, JPG, WEBP.",
            )

        claimed_type = (upload.content_type or "application/octet-stream").split(";")[0].strip().lower()
        allowed_types = ALLOWED_CONTENT_TYPES.get(ext, set())
        if claimed_type and allowed_types and claimed_type not in allowed_types:
            # Still allow if magic bytes match; claimed type is untrusted.
            pass

        upload_root()
        stored_name = f"{uuid.uuid4().hex}{ext}"
        dest = stored_file_path(stored_name)
        limit = max_upload_bytes()
        written = 0
        header = b""

        try:
            with dest.open("wb") as out:
                while True:
                    chunk = await upload.read(CHUNK_SIZE)
                    if not chunk:
                        break
                    if len(header) < 16:
                        header += chunk[: 16 - len(header)]
                    written += len(chunk)
                    if written > limit:
                        raise HTTPException(
                            status_code=413,
                            detail=f"File exceeds the maximum size of {limit // (1024 * 1024)} MB.",
                        )
                    out.write(chunk)
        except HTTPException:
            if dest.exists():
                dest.unlink()
            raise
        except Exception:
            if dest.exists():
                dest.unlink()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not store the uploaded file.",
            )
        finally:
            await upload.close()

        if written == 0:
            if dest.exists():
                dest.unlink()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded file is empty.",
            )

        if not _matches_magic(ext, header):
            dest.unlink(missing_ok=True)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File contents do not match the declared file type.",
            )

        stored_type = claimed_type if claimed_type in allowed_types else next(iter(allowed_types))
        relative_path = f"{dest.parent.name}/{stored_name}"
        record = self.repo.create(
            {
                "task_id": task.id,
                "uploaded_by": actor.id,
                "original_filename": original,
                "stored_filename": stored_name,
                "file_path": relative_path,
                "content_type": stored_type,
                "file_size": written,
            }
        )
        self.history_service.repo.create_entries(
            [
                {
                    "task_id": task.id,
                    "user_id": actor.id,
                    "action": HistoryAction.ATTACHMENT_UPLOADED.value,
                    "field_name": "attachment",
                    "old_value": None,
                    "new_value": original,
                }
            ]
        )
        loaded = self.repo.get_by_id_with_uploader(record.id)
        response = self._to_response(loaded)

        # Broadcast attachment.uploaded
        event = create_ws_event(
            event_type="attachment.uploaded",
            entity="attachment",
            action="uploaded",
            entity_id=record.id,
            data={
                "id": record.id,
                "task_id": task.id,
                "original_filename": original,
                "file_size": written,
                "content_type": stored_type,
            },
            actor=actor,
        )
        manager.broadcast_sync(event)

        return response

    def download(self, attachment_id: int, actor: User) -> FileResponse:
        attachment = self.repo.get_by_id_with_uploader(attachment_id)
        if not attachment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Attachment not found.",
            )
        self._require_task(attachment.task_id)
        try:
            path = stored_file_path(attachment.stored_filename)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid attachment storage path.",
            )
        if not path.is_file():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="The file is no longer available on the server.",
            )
        return FileResponse(
            path=str(path),
            media_type=attachment.content_type or "application/octet-stream",
            filename=attachment.original_filename,
        )

    def delete(self, attachment_id: int, actor: User) -> AttachmentResponse:
        attachment = self.repo.get_by_id_with_uploader(attachment_id)
        if not attachment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Attachment not found.",
            )
        task = self._require_task(attachment.task_id)
        if not self._can_delete(actor, task, attachment):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to delete this attachment.",
            )

        filename = attachment.original_filename
        task_id = attachment.task_id
        response = self._to_response(attachment)

        disk_error = None
        try:
            path = stored_file_path(attachment.stored_filename)
            if path.is_file():
                os.remove(path)
        except FileNotFoundError:
            pass
        except ValueError:
            disk_error = "Invalid attachment storage path."
        except OSError:
            disk_error = "The file could not be removed from disk."

        if disk_error:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=disk_error,
            )

        self.history_service.repo.create_entries(
            [
                {
                    "task_id": task_id,
                    "user_id": actor.id,
                    "action": HistoryAction.ATTACHMENT_DELETED.value,
                    "field_name": "attachment",
                    "old_value": filename,
                    "new_value": None,
                }
            ]
        )
        self.repo.delete(attachment.id)

        # Broadcast attachment.deleted
        event = create_ws_event(
            event_type="attachment.deleted",
            entity="attachment",
            action="deleted",
            entity_id=attachment.id,
            data={
                "id": attachment.id,
                "task_id": task_id,
                "original_filename": filename,
            },
            actor=actor,
        )
        manager.broadcast_sync(event)

        return response

    def delete_files_for_task(self, task_id: int) -> None:
        """Remove physical files for a task. Missing files are ignored."""
        for attachment in self.repo.list_all_for_task(task_id):
            try:
                path = stored_file_path(attachment.stored_filename)
                if path.is_file():
                    path.unlink()
            except (ValueError, OSError):
                continue
