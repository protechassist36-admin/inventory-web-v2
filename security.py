# security.py
import bcrypt
import secrets
import hashlib
import re
import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from config import SECURITY_CONFIG

class SecurityManager:
    """Handles all security-related operations"""
    
    def __init__(self):
        self.rounds = SECURITY_CONFIG['bcrypt_rounds']
    
    def hash_password(self, password: str) -> str:
        """Hash a password using bcrypt"""
        salt = bcrypt.gensalt(rounds=self.rounds)
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    def verify_password(self, password: str, hashed_password: str) -> bool:
        """Verify a password against its bcrypt hash"""
        try:
            return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))
        except Exception:
            return False
    
    def generate_token(self, data: Dict[str, Any]) -> str:
        """Generate JWT token for authentication"""
        data['exp'] = datetime.utcnow() + timedelta(seconds=SECURITY_CONFIG['session_timeout'])
        return jwt.encode(data, SECURITY_CONFIG['secret_key'], algorithm='HS256')
    
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify JWT token and return payload"""
        try:
            return jwt.decode(token, SECURITY_CONFIG['secret_key'], algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    def generate_csrf_token(self) -> str:
        """Generate CSRF token"""
        return secrets.token_urlsafe(32)
    
    def validate_csrf_token(self, token: str, session_token: str) -> bool:
        """Validate CSRF token"""
        return secrets.compare_digest(token, session_token)
    
    def sanitize_input(self, input_string: str, allow_html: bool = False) -> str:
        """Sanitize user input to prevent XSS and injection attacks"""
        if not input_string:
            return ""
        
        # Remove potentially dangerous characters
        sanitized = re.sub(r'[<>]', '', input_string)
        
        if not allow_html:
            # Remove HTML entities
            sanitized = re.sub(r'&[a-zA-Z]+;', '', sanitized)
        
        # Escape SQL special characters
        sanitized = sanitized.replace("'", "''")
        sanitized = sanitized.replace('"', '""')
        sanitized = sanitized.replace(";", "")
        
        return sanitized.strip()
    
    def validate_email(self, email: str) -> bool:
        """Validate email format"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    def validate_phone(self, phone: str) -> bool:
        """Validate phone number format"""
        cleaned = re.sub(r'[\s\-\(\)]', '', phone)
        return cleaned.isdigit() and 7 <= len(cleaned) <= 15
    
    def validate_password_strength(self, password: str) -> tuple[bool, str]:
        """Validate password strength requirements"""
        errors = []
        
        if len(password) < SECURITY_CONFIG['password_min_length']:
            errors.append(f"Password must be at least {SECURITY_CONFIG['password_min_length']} characters")
        
        if not re.search(r'[A-Z]', password):
            errors.append("Password must contain at least one uppercase letter")
        
        if not re.search(r'[a-z]', password):
            errors.append("Password must contain at least one lowercase letter")
        
        if not re.search(r'\d', password):
            errors.append("Password must contain at least one number")
        
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            errors.append("Password must contain at least one special character")
        
        return len(errors) == 0, "; ".join(errors)
    
    def is_password_expired(self, last_changed: datetime) -> bool:
        """Check if password has expired"""
        if not last_changed:
            return True
        return datetime.utcnow() > last_changed + timedelta(seconds=SECURITY_CONFIG['password_reset_timeout'])
    
    def generate_secure_filename(self, original_filename: str) -> str:
        """Generate a secure filename"""
        # Remove potentially dangerous characters
        name = self.sanitize_input(original_filename)
        # Generate random string
        random_str = secrets.token_urlsafe(16)
        # Get file extension
        ext = name.split('.')[-1] if '.' in name else ''
        # Combine with random string
        return f"{random_str}.{ext}" if ext else random_str
    
    def validate_file_type(self, filename: str, allowed_types: list) -> bool:
        """Validate file type against allowed types"""
        ext = filename.split('.')[-1].lower() if '.' in filename else ''
        return ext in [t.lower() for t in allowed_types]
    
    def check_file_size(self, file_size: int) -> bool:
        """Check if file size is within allowed limits"""
        return file_size <= SECURITY_CONFIG['max_upload_size']
    
    def rate_limit_check(self, identifier: str, action: str, window_minutes: int = 60) -> bool:
        """Simple rate limiting implementation"""
        # This is a basic implementation. In production, consider using Redis
        current_time = datetime.utcnow()
        key = f"rate_limit:{identifier}:{action}"
        
        # Store and check timestamps in a more permanent storage
        # This is a placeholder for the actual implementation
        return True  # Placeholder
    
    def log_security_event(self, event_type: str, details: str, severity: str = "INFO"):
        """Log security events for audit trail"""
        from logger import log_security_event
        log_security_event(event_type, details, severity)
    
    def encrypt_sensitive_data(self, data: str) -> str:
        """Encrypt sensitive data using AES"""
        # This is a placeholder. In production, implement proper encryption
        return hashlib.sha256(data.encode()).hexdigest()
    
    def create_password_reset_token(self) -> tuple[str, datetime]:
        """Create password reset token"""
        token = secrets.token_urlsafe(32)
        expiry = datetime.utcnow() + timedelta(hours=1)  # 1 hour expiry
        return token, expiry

# Global security manager instance
security_manager = SecurityManager()

# Convenience functions
def hash_password(password: str) -> str:
    return security_manager.hash_password(password)

def verify_password(password: str, hashed_password: str) -> bool:
    return security_manager.verify_password(password, hashed_password)

def sanitize_input(input_string: str, allow_html: bool = False) -> str:
    return security_manager.sanitize_input(input_string, allow_html)

def validate_email(email: str) -> bool:
    return security_manager.validate_email(email)

def validate_phone(phone: str) -> bool:
    return security_manager.validate_phone(phone)
