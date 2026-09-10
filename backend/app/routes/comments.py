from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.comment import (
    CommentCreate,
    CommentUpdate,
    CommentResponse,
    CommentPaginationResponse,
)
from app.services.note_service import NoteService
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
    current_user: User = Depends(get_current_user),
    service: NoteService = Depends(get_note_service),
):
    """Create a comment, binding the author to the authenticated user."""
    # Build a CommentCreate with the authenticated user's ID
    full_comment = CommentCreate(
        content=comment_in.content,
        user_id=current_user.id,
    )
    return service.create_comment_for_task(task_id=task_id, comment_in=full_comment)


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
    current_user: User = Depends(get_current_user),
    service: NoteService = Depends(get_note_service),
):
    comment = service.note_repo.get_by_id(comment_id)
    if not comment:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Comment with ID {comment_id} not found",
        )
    if current_user.app_role != "admin" and comment.user_id != current_user.id:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit your own comments.",
        )
    return service.update_comment(comment_id=comment_id, comment_in=comment_in)


@router.delete(
    "/comments/{comment_id}",
    response_model=CommentResponse,
    summary="Delete Comment",
    description="Remove a specific comment/note by ID. Requires Bearer token. Users can delete their own comments; Admins can delete any comment.",
)
def delete_comment(
    comment_id: int,
    current_user: User = Depends(get_current_user),
    service: NoteService = Depends(get_note_service),
):
    comment = service.note_repo.get_by_id(comment_id)
    if not comment:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Comment with ID {comment_id} not found",
        )
    if current_user.app_role != "admin" and comment.user_id != current_user.id:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own comments.",
        )
    return service.delete_comment(comment_id=comment_id)
