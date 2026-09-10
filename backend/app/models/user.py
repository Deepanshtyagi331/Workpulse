from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from app.database.session import Base
from app.models.base import TimestampMixin


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=True)  # Populated by auth; nullable for seeded accounts
    department = Column(String(100), nullable=False, default="Engineering")
    role = Column(String(50), nullable=False, default="Member")
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    tasks = relationship("Task", back_populates="assignee")
    notes = relationship("Note", back_populates="author", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<User(id={self.id}, name='{self.name}', email='{self.email}')>"
