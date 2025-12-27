import jwt
import datetime
import bcrypt
from functools import wraps
from flask import request, jsonify
from config import Config
from models import users_db, User, Role

config = Config()
SECRET_KEY = "your-very-secret-key-change-this-in-env" # In production, load from env

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def check_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def generate_token(username: str, role: str) -> str:
    payload = {
        'sub': username,
        'role': role,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
        
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        
        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            current_user = users_db.get(data['sub'])
            if not current_user:
                 return jsonify({'message': 'User not found'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid token'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

def role_required(allowed_roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(current_user, *args, **kwargs):
            if current_user.role not in allowed_roles:
                # Provide specific message based on operation
                operation_name = f.__name__
                role_str = current_user.role.value
                
                if 'delete' in operation_name.lower() or 'drop' in operation_name.lower():
                    message = f"You don't have permission to delete/drop resources. Only administrators can perform this action. Current role: {role_str}"
                else:
                    message = f"You don't have the required permissions to perform this action. Required role(s): {', '.join([r.value for r in allowed_roles])}. Current role: {role_str}"
                
                return jsonify({'message': message, 'error': 'PERMISSION_DENIED'}), 403
            return f(current_user, *args, **kwargs)
        return decorated_function
    return decorator

# Initialize a default admin user if not exists
if "admin" not in users_db:
    users_db["admin"] = User(
        username="admin", 
        password_hash=hash_password("admin123"), 
        role=Role.ADMIN,
        permissions=User.get_default_permissions(Role.ADMIN)
    )
    # Also add a viewer for testing
    users_db["viewer"] = User(
        username="viewer", 
        password_hash=hash_password("viewer123"), 
        role=Role.VIEWER,
        permissions=User.get_default_permissions(Role.VIEWER)
    )
