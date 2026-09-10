import math
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.note import Note
from app.repositories.note_repository import NoteRepository
from app.repositories.task_repository import TaskRepository
from app.repositories.user_repository import UserRepository
from app.schemas.comment import CommentCreate, CommentUpdate, CommentResponse


class NoteService:
    def __init__(self, db: Session):
        self.note_repo = NoteRepository(db)
        self.task_repo = TaskRepository(db)
        self.user_repo = UserRepository(db)

    def get_comments_for_task(
        self,
        task_id: int,
        page: int = 1,
        limit: int = 20,
        sort_order: str = "desc",
    ) -> Dict[str, Any]:
        """
        Retrieves paginated comments for a specific task after validating task existence.
        """
        task = self.task_repo.get_by_id(task_id)
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Task with ID {task_id} not found",
            )

        items, total = self.note_repo.get_notes_by_task(
            task_id=task_id,
            page=page,
            limit=limit,
            sort_order=sort_order,
        )

        total_pages = math.ceil(total / limit) if total > 0 else 0

        return {
            "items": items,
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages,
        }

    def create_comment_for_task(self, task_id: int, comment_in: CommentCreate) -> Note:
        """
        Validates task and author existence before creating a comment.
        """
        task = self.task_repo.get_by_id(task_id)
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Task with ID {task_id} not found",
            )

        author = self.user_repo.get_by_id(comment_in.user_id)
        if not author:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Author with User ID {comment_in.user_id} not found",
            )

        note_data = {
            "task_id": task_id,
            "user_id": comment_in.user_id,
            "content": comment_in.content,
        }
        created_note = self.note_repo.create(note_data)
        return self.note_repo.get_by_id_with_relations(created_note.id)

    def update_comment(self, comment_id: int, comment_in: CommentUpdate) -> Note:
        """Updates comment text content or raises HTTP 404."""
        comment = self.note_repo.get_by_id(comment_id)
        if not comment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Comment with ID {comment_id} not found",
            )

        updated_note = self.note_repo.update(comment, {"content": comment_in.content})
        return self.note_repo.get_by_id_with_relations(updated_note.id)

    def delete_comment(self, comment_id: int) -> CommentResponse:
        """Deletes a comment or raises HTTP 404."""
        comment = self.note_repo.get_by_id_with_relations(comment_id)
        if not comment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Comment with ID {comment_id} not found",
            )

        # Pre-serialize to avoid SQLAlchemy DetachedInstanceError on author relation
        response = CommentResponse.model_validate(comment)
        self.note_repo.delete(comment.id)
        return response
