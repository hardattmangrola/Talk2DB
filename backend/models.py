from dataclasses import dataclass, field
from typing import List, Optional
import enum

class Role(str, enum.Enum):
    ADMIN = "admin"
    EDITOR = "editor"
    VIEWER = "viewer"

@dataclass
class User:
    username: str
    password_hash: str
    role: Role = Role.VIEWER
    permissions: List[str] = field(default_factory=list)

    @staticmethod
    def get_default_permissions(role: Role) -> List[str]:
        if role == Role.ADMIN:
            return ["*"] # All permissions
        elif role == Role.EDITOR:
            return ["read", "insert", "update", "delete", "analyze"]
        else: # Viewer
            return ["read", "analyze"]

# Simple in-memory user store for demonstration (in a real app, this would be in the DB)
# In this phase, we are initializing with a default admin
users_db = {}
