import bcrypt
import re
from datetime import datetime
from typing import Union, Tuple, List, Dict
from config import CURRENCY, CURRENCY_SYMBOL

def hash_password(password: str) -> str:
    """Hash a password using bcrypt algorithm"""
    # Generate a salt and hash the password
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    # Return the hash as a string
    return hashed.decode('utf-8')

def verify_password(password: str, hashed_password: str) -> bool:
    """Verify a password against its bcrypt hash"""
    # Convert the stored hash back to bytes
    hashed_bytes = hashed_password.encode('utf-8')
    # Check if the provided password matches the hash
    return bcrypt.checkpw(password.encode('utf-8'), hashed_bytes)

def validate_email(email: str) -> bool:
    """Validate email address format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_phone(phone: str) -> bool:
    """Validate phone number format"""
    # Remove any spaces, dashes, or parentheses
    cleaned_phone = re.sub(r'[\s\-\(\)]', '', phone)
    # Check if it contains only digits and is between 7-15 digits
    return cleaned_phone.isdigit() and 7 <= len(cleaned_phone) <= 15

def format_currency(amount):
    """Format amount with currency symbol"""
    return f"{amount:,.2f} {CURRENCY_SYMBOL}"

def parse_currency(amount_str: str) -> float:
    """Parse currency string back to float"""
    # Remove currency symbol and any commas
    cleaned = amount_str.replace(CURRENCY_SYMBOL, '').replace(',', '')
    try:
        return float(cleaned)
    except ValueError:
        return 0.0

def format_datetime(dt: datetime = None) -> str:
    """Format datetime object to string"""
    if dt is None:
        dt = datetime.now()
    return dt.strftime("%Y-%m-%d %H:%M:%S")

def parse_datetime(dt_str: str) -> datetime:
    """Parse datetime string back to datetime object"""
    try:
        return datetime.strptime(dt_str, "%Y-%m-%d %H:%M:%S")
    except ValueError:
        return datetime.now()

def validate_product_name(name: str) -> Tuple[bool, str]:
    """Validate product name"""
    if not name or len(name.strip()) == 0:
        return False, "Product name cannot be empty"
    if len(name) > 100:
        return False, "Product name too long (max 100 characters)"
    return True, ""

def validate_quantity(quantity: Union[int, str]) -> Tuple[bool, str]:
    """Validate quantity"""
    try:
        qty = int(quantity)
        if qty < 0:
            return False, "Quantity cannot be negative"
        return True, ""
    except ValueError:
        return False, "Invalid quantity format"

def validate_price(price: Union[float, str]) -> Tuple[bool, str]:
    """Validate price"""
    try:
        price_val = float(price)
        if price_val < 0:
            return False, "Price cannot be negative"
        if price_val > 99999999.99:
            return False, "Price too large"
        return True, ""
    except ValueError:
        return False, "Invalid price format"

def generate_invoice_number() -> str:
    """Generate unique invoice number based on timestamp"""
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    return f"INV-{timestamp}"

def calculate_total(items: List[Dict[str, Union[int, float]]]) -> float:
    """Calculate total amount from list of items with quantity and price"""
    return sum(item['quantity'] * item['price'] for item in items)

def validate_stock_level(current_stock: int, min_stock: int) -> str:
    """Check stock level and return status"""
    if current_stock <= 0:
        return "out_of_stock"
    elif current_stock <= min_stock:
        return "low_stock"
    return "in_stock"

def format_large_number(number: Union[int, float]) -> str:
    """Format large numbers with K, M, B suffixes"""
    if number < 1000:
        return str(number)
    elif number < 1000000:
        return f"{number/1000:.1f}K"
    elif number < 1000000000:
        return f"{number/1000000:.1f}M"
    else:
        return f"{number/1000000000:.1f}B"

def sanitize_string(text: str) -> str:
    """Remove potentially dangerous characters from string"""
    # Remove any HTML tags
    clean = re.sub(r'<[^>]+>', '', text)
    # Remove any special SQL characters
    clean = clean.replace("'", "''")
    return clean.strip()

def truncate_string(text: str, length: int) -> str:
    """Truncate string to specified length"""
    if len(text) <= length:
        return text
    return text[:length-3] + "..."
