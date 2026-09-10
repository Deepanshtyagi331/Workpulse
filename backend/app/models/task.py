import enum
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.database.session import Base
from app.models.base import TimestampMixin


class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    BLOCKED = "blocked"


class TaskPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class Task(Base, TimestampMixin):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    status = Column(
        String(50),
        nullable=False,
        default=TaskStatus.PENDING.value,
        index=True,
    )
    priority = Column(
        String(50),
        nullable=False,
        default=TaskPriority.MEDIUM.value,
        index=True,
    )
    assigned_to = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    due_date = Column(DateTime, nullable=True, index=True)

    # Relationships
    assignee = relationship("User", back_populates="tasks")
    notes = relationship(
        "Note",
        back_populates="task",
        cascade="all, delete-orphan",
        order_by="Note.created_at.desc()",
    )
    history = relationship(
        "TaskHistory",
        back_populates="task",
        cascade="all, delete-orphan",
        order_by="TaskHistory.created_at.desc()",
    )
    attachments = relationship(
        "Attachment",
        back_populates="task",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Task(id={self.id}, title='{self.title[:30]}', status='{self.status}', priority='{self.priority}')>"
