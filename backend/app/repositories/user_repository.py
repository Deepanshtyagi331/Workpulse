from typing import Optional, List, Dict, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from app.models.user import User
from app.models.task import Task
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self, db: Session):
        super().__init__(User, db)

    def get_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email.strip().lower()).first()

    def count_active(self) -> int:
        return self.db.query(User).filter(User.is_active.is_(True)).count()

    def get_department_distribution(self) -> Dict[str, int]:
        results = (
            self.db.query(User.department, func.count(User.id))
            .group_by(User.department)
            .all()
        )
        return {dept: count for dept, count in results}

    def get_filtered_users(
        self,
        search: Optional[str] = None,
        role: Optional[str] = None,
        department: Optional[str] = None,
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[User], int]:
        """
        Executes search, filtering, and pagination for users strictly at database level.
        """
        query = self.db.query(User)

        if search and search.strip():
            pattern = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    User.name.ilike(pattern),
                    User.email.ilike(pattern),
                )
            )

        if role and role.strip():
            query = query.filter(User.role.ilike(role.strip()))

        if department and department.strip():
            query = query.filter(User.department.ilike(department.strip()))

        total = query.count()
        offset = max(0, (page - 1) * limit)
        items = query.order_by(User.id.asc()).offset(offset).limit(limit).all()

        return items, total

    def safe_delete_user(self, user_id: int) -> Optional[User]:
        """
        Safely deletes a user while preserving task data by decoupling assigned tasks.
        Ensures foreign key constraints are honored without data corruption.
        """
        user = self.get_by_id(user_id)
        if user:
            # Set assigned_to to None on tasks assigned to this user
            self.db.query(Task).filter(Task.assigned_to == user_id).update(
                {Task.assigned_to: None},
                synchronize_session=False,
            )
            self.db.delete(user)
            self.db.commit()
        return user
