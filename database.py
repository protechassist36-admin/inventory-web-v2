import pymysql
import logging
from pymysql import Error
from config import DB_CONFIG, TABLES
from utils import hash_password
from datetime import datetime
import os

logger = logging.getLogger(__name__)

class Database:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Database, cls).__new__(cls)
            cls._instance.connection = None
        return cls._instance
    
    def connect(self):
        try:
            if not self.connection or not self.connection.open:
                # First connect without database to create it if needed
                temp_config = DB_CONFIG.copy()
                db_name = temp_config.pop('database')
                self.connection = pymysql.connect(
                    **temp_config,
                    connect_timeout=30,
                    read_timeout=30,
                    write_timeout=30
                )
                
                # Create database if it doesn't exist
                with self.connection.cursor() as cursor:
                    cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name}")
                    cursor.execute(f"USE {db_name}")
                
                # Now reconnect with the database
                self.connection = pymysql.connect(
                    **DB_CONFIG,
                    connect_timeout=30,
                    read_timeout=30,
                    write_timeout=30
                )
            return self.connection
        except Error as e:
            logger.error(f"Error connecting to database: {e}")
            return None
    
    def disconnect(self):
        """Disconnect from the database"""
        if self.connection:
            self.connection.close()
            self.connection = None
    
    def execute_query(self, query, params=None):
        """Execute a query and return results"""
        try:
            if not self.connection or not self.connection.open:
                self.connect()
                
            with self.connection.cursor(pymysql.cursors.DictCursor) as cursor:
                cursor.execute(query, params or ())
                if query.strip().upper().startswith(('SELECT', 'SHOW', 'DESCRIBE', 'EXPLAIN')):
                    result = cursor.fetchall()
                    return result if result else []
                else:
                    self.connection.commit()
                    return cursor.lastrowid if query.strip().upper().startswith('INSERT') else cursor.rowcount
        except Error as e:
            logger.error(f"Query execution error: {e}")
            if self.connection:
                self.connection.rollback()
            return []
    
    def table_exists(self, table_name):
        """Check if a table exists in the database"""
        try:
            result = self.execute_query(
                "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = %s AND table_name = %s",
                (DB_CONFIG['database'], table_name)
            )
            return result[0]['count'] > 0 if result else False
        except Error as e:
            logger.error(f"Error checking table existence: {e}")
            return False
    
    def add_column_if_not_exists(self, table_name, column_name, column_definition):
        """Add a column to a table if it doesn't exist"""
        try:
            if not self.table_exists(table_name):
                return False
                
            result = self.execute_query(
                "SHOW COLUMNS FROM {} LIKE '{}'".format(table_name, column_name)
            )
            if not result:
                query = f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_definition}"
                self.execute_query(query)
                logger.info(f"Added column {column_name} to table {table_name}")
                return True
            return False
        except Error as e:
            logger.error(f"Error adding column: {e}")
            return False
    
    def ensure_timestamp_columns(self, table_name):
        """Ensure timestamp columns exist in a table"""
        timestamp_columns = {
            'created_at': 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
            'updated_at': 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
            'password_changed': 'TIMESTAMP NULL DEFAULT NULL',
            'last_login': 'TIMESTAMP NULL DEFAULT NULL'
        }
        
        for col_name, col_def in timestamp_columns.items():
            self.add_column_if_not_exists(table_name, col_name, col_def)
    
    def update_database_schema(self):
        """Update database schema with missing columns"""
        self.connect()
        try:
            # Update users table
            if self.table_exists('users'):
                self.ensure_timestamp_columns('users')
                self.add_column_if_not_exists('users', 'status', "ENUM('active','inactive') DEFAULT 'active'")
            
            # Update products table
            if self.table_exists('products'):
                self.add_column_if_not_exists('products', 'expiry_date', 'DATE')
                self.add_column_if_not_exists('products', 'status', "ENUM('active','inactive','discontinued') DEFAULT 'active'")
            
            # Update categories table
            if self.table_exists('categories'):
                self.add_column_if_not_exists('categories', 'status', "ENUM('active','inactive') DEFAULT 'active'")
            
            # Update suppliers table
            if self.table_exists('suppliers'):
                self.add_column_if_not_exists('suppliers', 'status', "ENUM('active','inactive') DEFAULT 'active'")
            
            # Update sales table
            if self.table_exists('sales'):
                self.add_column_if_not_exists('sales', 'status', "ENUM('completed','pending','cancelled') DEFAULT 'completed'")
            
            # Update purchases table
            if self.table_exists('purchases'):
                self.add_column_if_not_exists('purchases', 'status', "ENUM('completed','pending','cancelled') DEFAULT 'completed'")
            
            # Update returns table
            if self.table_exists('returns'):
                self.add_column_if_not_exists('returns', 'status', "ENUM('pending','approved','rejected') DEFAULT 'pending'")
            
            # Update stock table
            if self.table_exists('stock'):
                self.add_column_if_not_exists('stock', 'min_quantity', 'INT NOT NULL DEFAULT 10')
                
            # Update any other tables that might need timestamp columns
            for table_name in TABLES:
                if self.table_exists(table_name):
                    self.ensure_timestamp_columns(table_name)
                    
        except pymysql.Error as e:
            logger.error(f"Error updating database schema: {e}")
    
    def initialize_database(self):
        """Initialize the database with tables and default data"""
        if not self.connect():
            return False
            
        try:
            # Create database if it doesn't exist
            self.execute_query(f"CREATE DATABASE IF NOT EXISTS {DB_CONFIG['database']}")
            self.connection.close()
            
            # Connect to the specific database
            self.connection = pymysql.connect(
                host=DB_CONFIG['host'],
                user=DB_CONFIG['user'],
                password=DB_CONFIG['password'],
                database=DB_CONFIG['database'],
                charset='utf8mb4',
                cursorclass=pymysql.cursors.DictCursor
            )
            
            # Create all tables
            for table_name, table_config in TABLES.items():
                columns = ', '.join([f"{col_name} {col_type}" for col_name, col_type in table_config['columns']])
                create_table_query = f"CREATE TABLE IF NOT EXISTS {table_name} ({columns})"
                self.execute_query(create_table_query)
            
            # Update schema to add any missing columns
            self.update_database_schema()
            
            # Create default admin user if not exists
            admin_username = os.getenv('DEFAULT_ADMIN_USERNAME', 'admin')
            admin_exists = self.execute_query(
                "SELECT id FROM users WHERE username = %s",
                (admin_username,)
            )
            
            if not admin_exists:
                admin_password = os.getenv('DEFAULT_ADMIN_PASSWORD', 'admin123')
                hashed_password = hash_password(admin_password)
                self.execute_query(
                    """INSERT INTO users (username, password, name, role, created_at) 
                    VALUES (%s, %s, %s, %s, %s)""",
                    (
                        admin_username,
                        hashed_password,
                        admin_username.capitalize(),
                        'admin',
                        datetime.now()
                    )
                )
                
            return True
        except Error as e:
            logger.error(f"Database initialization error: {e}")
            return False
    
    def get_dashboard_stats(self):
        """Get dashboard statistics with error handling"""
        try:
            stats = {
                'total_users': 0,
                'total_products': 0,
                'low_stock_items': 0,
                'recent_orders': []
            }
            
            # Get total users
            users_result = self.execute_query("SELECT COUNT(*) as count FROM users WHERE status = 'active'")
            stats['total_users'] = users_result[0]['count'] if users_result else 0
            
            # Get total products
            products_result = self.execute_query("SELECT COUNT(*) as count FROM products WHERE status = 'active'")
            stats['total_products'] = products_result[0]['count'] if products_result else 0
            
            # Get low stock items
            stock_result = self.execute_query(
                """SELECT COUNT(*) as count FROM stock s 
                   JOIN products p ON s.product_id = p.id 
                   WHERE s.quantity <= s.min_quantity AND p.status = 'active'"""
            )
            stats['low_stock_items'] = stock_result[0]['count'] if stock_result else 0
            
            # Get recent orders
            orders_result = self.execute_query(
                """SELECT s.*, p.name as product_name 
                   FROM sales s 
                   JOIN products p ON s.product_id = p.id 
                   ORDER BY s.created_at DESC LIMIT 5"""
            )
            stats['recent_orders'] = orders_result if orders_result else []
            
            return stats
        except Error as e:
            logger.error(f"Error loading dashboard stats: {e}")
            return {
                'total_users': 0,
                'total_products': 0,
                'low_stock_items': 0,
                'recent_orders': []
            }
    
    def get_low_stock_items(self):
        """Get all products with low stock levels"""
        try:
            query = """
                SELECT p.id, p.name, p.expiry_date, p.status, s.quantity, s.min_quantity
                FROM products p
                JOIN stock s ON p.id = s.product_id
                WHERE s.quantity <= s.min_quantity AND p.status = 'active'
                ORDER BY s.quantity ASC
            """
            return self.execute_query(query)
        except Error as e:
            logger.error(f"Error getting low stock items: {e}")
            return []
    
    def get_products_near_expiry(self, days=30):
        """Get products that will expire within the specified number of days"""
        try:
            query = """
                SELECT id, name, expiry_date, status
                FROM products
                WHERE expiry_date IS NOT NULL
                AND expiry_date <= DATE_ADD(CURRENT_DATE(), INTERVAL %s DAY)
                AND status = 'active'
                ORDER BY expiry_date ASC
            """
            return self.execute_query(query, (days,))
        except Error as e:
            logger.error(f"Error getting products near expiry: {e}")
            return []
    
    def __del__(self):
        """Ensure connection is closed when object is destroyed"""
        self.disconnect()
