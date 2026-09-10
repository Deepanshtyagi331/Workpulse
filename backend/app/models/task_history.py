import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database.session import Base


class HistoryAction(str, enum.Enum):
    CREATED = "created"
    UPDATED = "updated"
    STATUS_CHANGED = "status_changed"
    PRIORITY_CHANGED = "priority_changed"
    ASSIGNEE_CHANGED = "assignee_changed"
    DELETED = "deleted"
    ATTACHMENT_UPLOADED = "attachment_uploaded"
    ATTACHMENT_DELETED = "attachment_deleted"


class TaskHistory(Base):
    __tablename__ = "task_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    task_id = Column(
        Integer,
        ForeignKey("tasks.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    action = Column(String(40), nullable=False, index=True)
    field_name = Column(String(50), nullable=True)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    task = relationship("Task", back_populates="history")
    user = relationship("User", back_populates="task_history")

    __table_args__ = (
        Index("ix_task_history_task_created", "task_id", "created_at"),
    )

    def __repr__(self) -> str:
        return (
            f"<TaskHistory(id={self.id}, task_id={self.task_id}, "
            f"action='{self.action}', field='{self.field_name}')>"
        )
