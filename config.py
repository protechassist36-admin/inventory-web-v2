import os
import pymysql
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Application Settings
APP_NAME = 'Advanced Inventory Management System'
VERSION = '1.0.0'

# GUI Configuration
GUI_CONFIG = {
    'theme': 'System',
    'color_theme': 'blue',
    'color_secondary': ('#2b2b2b', '#2b2b2b')
}

# Button Configuration
BUTTON_CONFIG = {
    'width': 120,
    'height': 35,
    'corner_radius': 8,
    'hover_color': ('gray70', 'gray30'),
    'fg_color': ('#1a6fff', '#1a6fff'),
    'text_color': ('#FFFFFF', '#FFFFFF')
}

# Currency Settings
CURRENCY = 'SLL'
CURRENCY_SYMBOL = 'Le'

# Database Configuration
# Create a .env file in the root directory and add the following:
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=your_password
# DB_NAME=inventory_db
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD'),
    'database': os.getenv('DB_NAME', 'inventory_db'),
    'charset': 'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor
}

# Database Tables Configuration
TABLES = {
    'users': {
        'columns': [
            ('id', 'INT AUTO_INCREMENT PRIMARY KEY'),
            ('username', 'VARCHAR(50) NOT NULL UNIQUE'),
            ('password', 'VARCHAR(255) NOT NULL'),
            ('name', 'VARCHAR(100)'),
            ('role', "ENUM('admin', 'employee', 'supplier') NOT NULL DEFAULT 'admin'"),
            ('status', "ENUM('active', 'inactive') DEFAULT 'active'"),
            ('created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'),
            ('updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        ]
    },
    'categories': {
        'columns': [
            ('id', 'INT AUTO_INCREMENT PRIMARY KEY'),
            ('name', 'VARCHAR(100) NOT NULL UNIQUE'),
            ('description', 'TEXT'),
            ('status', "ENUM('active', 'inactive') DEFAULT 'active'"),
            ('created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'),
            ('updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        ]
    },
    'suppliers': {
        'columns': [
            ('id', 'INT AUTO_INCREMENT PRIMARY KEY'),
            ('name', 'VARCHAR(100) NOT NULL'),
            ('contact_person', 'VARCHAR(100)'),
            ('email', 'VARCHAR(100)'),
            ('phone', 'VARCHAR(20)'),
            ('address', 'TEXT'),
            ('status', "ENUM('active', 'inactive') DEFAULT 'active'"),
            ('created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'),
            ('updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        ]
    },
    'products': {
        'columns': [
            ('id', 'INT AUTO_INCREMENT PRIMARY KEY'),
            ('name', 'VARCHAR(100) NOT NULL'),
            ('description', 'TEXT'),
            ('sku', 'VARCHAR(50) UNIQUE'),
            ('unit_price', 'DECIMAL(10,2) NOT NULL'),
            ('cost_price', 'DECIMAL(10,2)'),
            ('category_id', 'INT'),
            ('supplier_id', 'INT'),
            ('expiry_date', 'DATE'),
            ('status', "ENUM('active', 'inactive', 'discontinued') DEFAULT 'active'"),
            ('created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'),
            ('updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
            ('FOREIGN KEY (category_id)', 'REFERENCES categories(id) ON DELETE SET NULL'),
            ('FOREIGN KEY (supplier_id)', 'REFERENCES suppliers(id) ON DELETE SET NULL')
        ]
    },
    'stock': {
        'columns': [
            ('id', 'INT AUTO_INCREMENT PRIMARY KEY'),
            ('product_id', 'INT NOT NULL UNIQUE'),
            ('quantity', 'INT NOT NULL DEFAULT 0'),
            ('min_quantity', 'INT NOT NULL DEFAULT 10'),
            ('max_quantity', 'INT'),
            ('reorder_level', 'INT DEFAULT 10'),
            ('last_updated', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
            ('FOREIGN KEY (product_id)', 'REFERENCES products(id) ON DELETE CASCADE')
        ]
    },
    'sales': {
        'columns': [
            ('id', 'INT AUTO_INCREMENT PRIMARY KEY'),
            ('invoice_number', 'VARCHAR(50) UNIQUE'),
            ('product_id', 'INT NOT NULL'),
            ('quantity', 'INT NOT NULL'),
            ('unit_price', 'DECIMAL(10,2) NOT NULL'),
            ('total_amount', 'DECIMAL(10,2) NOT NULL'),
            ('discount', 'DECIMAL(10,2) DEFAULT 0'),
            ('payment_method', "ENUM('Cash', 'Credit', 'Mobile Money') DEFAULT 'Cash'"),
            ('payment_status', "ENUM('Paid', 'Unpaid', 'Partially Paid') DEFAULT 'Paid'"),
            ('customer_name', "VARCHAR(100) DEFAULT 'Walk-in Customer'"),
            ('customer_contact', 'VARCHAR(20)'),
            ('date', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'),
            ('status', "ENUM('completed', 'pending', 'cancelled') DEFAULT 'completed'"),
            ('created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'),
            ('updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
            ('FOREIGN KEY (product_id)', 'REFERENCES products(id) ON DELETE CASCADE')
        ]
    },
    'sales_items': {
        'columns': [
            ('id', 'INT AUTO_INCREMENT PRIMARY KEY'),
            ('sale_id', 'INT NOT NULL'),
            ('product_id', 'INT NOT NULL'),
            ('quantity', 'INT NOT NULL'),
            ('unit_price', 'DECIMAL(10,2) NOT NULL'),
            ('total', 'DECIMAL(10,2) NOT NULL'),
            ('FOREIGN KEY (sale_id)', 'REFERENCES sales(id) ON DELETE CASCADE'),
            ('FOREIGN KEY (product_id)', 'REFERENCES products(id) ON DELETE CASCADE')
        ]
    },
    'purchases': {
        'columns': [
            ('id', 'INT AUTO_INCREMENT PRIMARY KEY'),
            ('purchase_number', 'VARCHAR(50) UNIQUE'),
            ('supplier_id', 'INT NOT NULL'),
            ('product_id', 'INT NOT NULL'),
            ('quantity', 'INT NOT NULL'),
            ('unit_cost', 'DECIMAL(10,2) NOT NULL'),
            ('total_amount', 'DECIMAL(10,2) NOT NULL'),
            ('payment_method', "ENUM('Cash', 'Credit', 'Bank Transfer') DEFAULT 'Cash'"),
            ('payment_status', "ENUM('Paid', 'Unpaid', 'Partially Paid') DEFAULT 'Paid'"),
            ('date', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'),
            ('status', "ENUM('completed', 'pending', 'cancelled') DEFAULT 'completed'"),
            ('created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'),
            ('updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
            ('FOREIGN KEY (supplier_id)', 'REFERENCES suppliers(id) ON DELETE CASCADE'),
            ('FOREIGN KEY (product_id)', 'REFERENCES products(id) ON DELETE CASCADE')
        ]
    },
    'purchase_items': {
        'columns': [
            ('id', 'INT AUTO_INCREMENT PRIMARY KEY'),
            ('purchase_id', 'INT NOT NULL'),
            ('product_id', 'INT NOT NULL'),
            ('quantity', 'INT NOT NULL'),
            ('unit_cost', 'DECIMAL(10,2) NOT NULL'),
            ('total', 'DECIMAL(10,2) NOT NULL'),
            ('FOREIGN KEY (purchase_id)', 'REFERENCES purchases(id) ON DELETE CASCADE'),
            ('FOREIGN KEY (product_id)', 'REFERENCES products(id) ON DELETE CASCADE')
        ]
    },
    'credits': {
        'columns': [
            ('id', 'INT AUTO_INCREMENT PRIMARY KEY'),
            ('sale_id', 'INT NOT NULL'),
            ('customer_name', 'VARCHAR(100) NOT NULL'),
            ('customer_contact', 'VARCHAR(20)'),
            ('amount', 'DECIMAL(10,2) NOT NULL'),
            ('paid_amount', 'DECIMAL(10,2) DEFAULT 0'),
            ('balance', 'DECIMAL(10,2) GENERATED ALWAYS AS (amount - paid_amount) STORED'),
            ('due_date', 'DATE NOT NULL'),
            ('status', "ENUM('Unpaid', 'Partially Paid', 'Paid') DEFAULT 'Unpaid'"),
            ('created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'),
            ('updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
            ('FOREIGN KEY (sale_id)', 'REFERENCES sales(id) ON DELETE CASCADE')
        ]
    },
    'returns': {
        'columns': [
            ('id', 'INT AUTO_INCREMENT PRIMARY KEY'),
            ('sale_id', 'INT NOT NULL'),
            ('product_id', 'INT NOT NULL'),
            ('quantity', 'INT NOT NULL'),
            ('reason', 'TEXT'),
            ('refund_amount', 'DECIMAL(10,2) NOT NULL'),
            ('status', "ENUM('pending', 'approved', 'rejected') DEFAULT 'pending'"),
            ('created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'),
            ('updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
            ('FOREIGN KEY (sale_id)', 'REFERENCES sales(id) ON DELETE CASCADE'),
            ('FOREIGN KEY (product_id)', 'REFERENCES products(id) ON DELETE CASCADE')
        ]
    },
    'user_settings': {
        'columns': [
            ('id', 'INT AUTO_INCREMENT PRIMARY KEY'),
            ('user_id', 'INT NOT NULL'),
            ('name', 'VARCHAR(100) NOT NULL'),
            ('email', 'VARCHAR(100)'),
            ('theme', "ENUM('light', 'dark', 'system') DEFAULT 'system'"),
            ('language', "VARCHAR(10) DEFAULT 'en'"),
            ('created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'),
            ('updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
            ('FOREIGN KEY (user_id)', 'REFERENCES users(id) ON DELETE CASCADE')
        ]
    }
}

# User Roles Configuration
ROLES = {
    'admin': 'Administrator',
    'employee': 'Employee',
    'supplier': 'Supplier'
}