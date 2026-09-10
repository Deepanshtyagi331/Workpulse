from typing import Optional
from fastapi import APIRouter, Depends, Query, status, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.comment import (
    CommentCreate,
    CommentUpdate,
    CommentResponse,
    CommentPaginationResponse,
)
from app.services.note_service import NoteService
from app.services.background_service import background_job_service
from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter()


def get_note_service(db: Session = Depends(get_db)) -> NoteService:
    return NoteService(db)


# -----------------------------------------------------------------------------
# Task-scoped Comment Endpoints: /tasks/{task_id}/comments
# -----------------------------------------------------------------------------

@router.get(
    "/tasks/{task_id}/comments",
    response_model=CommentPaginationResponse,
    summary="List Comments for Task",
    description="Retrieve paginated comments/notes for a specific task with author details. Requires Bearer token.",
)
def list_task_comments(
    task_id: int,
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    limit: int = Query(20, ge=1, le=100, description="Max comments per page"),
    sort_order: str = Query("desc", pattern="^(asc|desc|ASC|DESC)$", description="Sort order by date"),
    current_user: User = Depends(get_current_user),
    service: NoteService = Depends(get_note_service),
):
    return service.get_comments_for_task(
        task_id=task_id,
        page=page,
        limit=limit,
        sort_order=sort_order,
    )


@router.post(
    "/tasks/{task_id}/comments",
    response_model=CommentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Task Comment",
    description=(
        "Add a new comment/note to a task. "
        "The comment author is determined from the Bearer token — "
        "the frontend does NOT need to supply user_id. Requires Bearer token."
    ),
)
def create_task_comment(
    task_id: int,
    comment_in: CommentUpdate,  # Only requires 'content' — author is from JWT
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    service: NoteService = Depends(get_note_service),
):
    """Create a comment, binding the author to the authenticated user."""
    full_comment = CommentCreate(
        content=comment_in.content,
        user_id=current_user.id,
    )
    result = service.create_comment_for_task(task_id=task_id, comment_in=full_comment)
    background_tasks.add_task(
        background_job_service.process_comment_telemetry_job,
        task_id=task_id,
        comment_id=result.id,
        author_id=current_user.id,
        action="COMMENT_CREATED",
    )
    return result


# -----------------------------------------------------------------------------
# Direct Comment Endpoints: /comments/{comment_id}
# -----------------------------------------------------------------------------

@router.put(
    "/comments/{comment_id}",
    response_model=CommentResponse,
    summary="Update Comment",
    description="Modify the text content of an existing comment/note. Requires Bearer token. Users can only edit their own comments (admin can edit any).",
)
def update_comment(
    comment_id: int,
    comment_in: CommentUpdate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    service: NoteService = Depends(get_note_service),
):
    comment = service.note_repo.get_by_id(comment_id)
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Comment with ID {comment_id} not found",
        )
    if current_user.app_role != "admin" and comment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit your own comments.",
        )
    result = service.update_comment(comment_id=comment_id, comment_in=comment_in)
    background_tasks.add_task(
        background_job_service.process_comment_telemetry_job,
        task_id=result.task_id,
        comment_id=result.id,
        author_id=current_user.id,
        action="COMMENT_UPDATED",
    )
    return result


@router.delete(
    "/comments/{comment_id}",
    response_model=CommentResponse,
    summary="Delete Comment",
    description="Remove a specific comment/note by ID. Requires Bearer token. Users can delete their own comments; Admins can delete any comment.",
)
def delete_comment(
    comment_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    service: NoteService = Depends(get_note_service),
):
    comment = service.note_repo.get_by_id(comment_id)
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Comment with ID {comment_id} not found",
        )
    if current_user.app_role != "admin" and comment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own comments.",
        )
    task_id = comment.task_id
    result = service.delete_comment(comment_id=comment_id)
    background_tasks.add_task(
        background_job_service.process_comment_telemetry_job,
        task_id=task_id,
        comment_id=comment_id,
        author_id=current_user.id,
        action="COMMENT_DELETED",
    )
    return result
