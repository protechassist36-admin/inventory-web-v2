import customtkinter as ctk
from tkinter import messagebox, ttk
from datetime import datetime, timedelta
import threading
import time
from database import Database
from config import GUI_CONFIG, CURRENCY_SYMBOL
from utils import format_datetime, format_currency

class Dashboard:
    def __init__(self, user_data):
        if user_data is None:
            raise ValueError("User data cannot be None")
        self.user_data = user_data
        self.db = Database()
        
        # Create main window
        self.root = ctk.CTk()
        self.root.title("Inventory Management System - Dashboard")
        self.root.state('zoomed')
        
        # Set appearance
        ctk.set_appearance_mode(GUI_CONFIG['theme'])
        ctk.set_default_color_theme(GUI_CONFIG['color_theme'])
        
        # Configure grid
        self.root.grid_columnconfigure(1, weight=1)
        self.root.grid_rowconfigure(0, weight=1)
        self.root.grid_rowconfigure(1, weight=0)
        
        # Initialize after IDs
        self.footer_animation_id = None
        self.time_update_id = None
        
        # Notification system
        self.notifications = []
        self.notification_thread = None
        self.stop_notification_thread = False
        self.last_notification_check = datetime.now()
        self.notification_window = None
        
        # Create UI components
        self.create_sidebar()
        self.create_main_content()
        self.create_footer()
        
        # Load initial data
        self.load_dashboard_stats()
        self.update_time()
        self.start_notification_system()
        
        # Bind window destroy event
        self.root.protocol("WM_DELETE_WINDOW", self.on_closing)



        # Add this method to Dashboard class
    def handle_category_change(self):
        """Handle category changes by refreshing dashboard"""
        self.show_dashboard()

    # Modify the show_categories method in Dashboard class
    def show_categories(self):
        try:
            from categories import CategoriesWindow
            # Pass the callback function to CategoriesWindow
            CategoriesWindow(self.main_content, self.user_data, self.handle_category_change)
        except ImportError:
            self.show_error("Categories module not found")
        except Exception as e:
            self.show_error(f"Error loading categories: {str(e)}")






    def check_expiry_notifications(self):
        """Check for products nearing expiry and create notifications"""
        try:
            # Get products expiring in the next 7 days
            seven_days_from_now = datetime.now().date() + timedelta(days=7)
            
            expiring_products = self.db.execute_query(
                """
                SELECT p.name, p.expiry_date, s.quantity
                FROM products p
                LEFT JOIN stock s ON p.id = s.product_id
                WHERE p.expiry_date IS NOT NULL 
                AND p.expiry_date <= %s
                AND p.expiry_date >= CURDATE()
                AND s.quantity > 0
                ORDER BY p.expiry_date ASC
                """,
                (seven_days_from_now,)
            )
            
            for product in expiring_products:
                days_until_expiry = (product['expiry_date'] - datetime.now().date()).days
                priority = 'high' if days_until_expiry <= 3 else 'medium'
                
                notification = {
                    'type': 'Expiry Alert',
                    'title': f"Product Expiring Soon: {product['name']}",
                    'message': f"Product '{product['name']}' will expire in {days_until_expiry} days. Current stock: {product['quantity']}",
                    'timestamp': datetime.now(),
                    'read': False,
                    'priority': priority
                }
                
                if not self.has_similar_notification_today(notification):
                    self.add_notification(notification)
                    
            # Check for already expired products
            expired_products = self.db.execute_query(
                """
                SELECT p.name, s.quantity
                FROM products p
                LEFT JOIN stock s ON p.id = s.product_id
                WHERE p.expiry_date IS NOT NULL 
                AND p.expiry_date < CURDATE()
                AND s.quantity > 0
                """
            )
            
            for product in expired_products:
                notification = {
                    'type': 'Expired Product',
                    'title': f"Product Expired: {product['name']}",
                    'message': f"Product '{product['name']}' has expired. Current stock: {product['quantity']}",
                    'timestamp': datetime.now(),
                    'read': False,
                    'priority': 'high'
                }
                
                if not self.has_similar_notification_today(notification):
                    self.add_notification(notification)
                    
        except Exception as e:
            print(f"Error checking expiry notifications: {e}")

    def start_notification_system(self):
        """Start the notification system in a separate thread"""
        self.stop_notification_thread = False
        self.notification_thread = threading.Thread(target=self.check_notifications)
        self.notification_thread.daemon = True
        self.notification_thread.start()

    def check_notifications(self):
        """Check for all types of notifications once per day"""
        while not self.stop_notification_thread:
            try:
                current_date = datetime.now().date()
                
                if not hasattr(self, 'last_notification_date') or self.last_notification_date != current_date:
                    self.check_low_stock_notifications()
                    self.check_recent_activities_notifications()
                    self.check_sales_notifications()
                    self.check_purchase_notifications()
                    self.check_expiry_notifications()
                    
                    self.last_notification_date = current_date
                
                time.sleep(3600)
            except Exception as e:
                print(f"Error in notification system: {e}")
                time.sleep(10)

    def has_similar_notification_today(self, new_notification):
        """Check if we already have a similar notification today"""
        current_date = datetime.now().date()
        for notification in self.notifications:
            if notification['timestamp'].date() == current_date:
                if notification['type'] == new_notification['type']:
                    if notification['type'] in ['Low Stock', 'Out of Stock', 'Expiry Alert', 'Expired Product']:
                        if new_notification['title'] == notification['title']:
                            return True
                    elif notification['type'] == 'Activity':
                        if new_notification['message'] == notification['message']:
                            return True
                    elif notification['type'] == 'Sales Milestone':
                        if new_notification['title'] == notification['title']:
                            return True
                    elif notification['type'] == 'Purchase Approval':
                        return True
        return False

    def check_low_stock_notifications(self):
        """Check for low stock items and create notifications"""
        try:
            low_stock_items = self.db.get_low_stock_items()
            
            for item in low_stock_items:
                if item['quantity'] > 0 and item['quantity'] <= item['min_quantity']:
                    notification = {
                        'type': 'Low Stock',
                        'title': f"Low Stock Alert: {item['name']}",
                        'message': f"Product '{item['name']}' has low stock. Current: {item['quantity']}, Minimum: {item['min_quantity']}",
                        'timestamp': datetime.now(),
                        'read': False,
                        'priority': 'medium' if item['quantity'] > item['min_quantity'] / 2 else 'high'
                    }
                    
                    if not self.has_similar_notification_today(notification):
                        self.add_notification(notification)
                elif item['quantity'] <= 0:
                    notification = {
                        'type': 'Out of Stock',
                        'title': f"Out of Stock: {item['name']}",
                        'message': f"Product '{item['name']}' is out of stock!",
                        'timestamp': datetime.now(),
                        'read': False,
                        'priority': 'high'
                    }
                    
                    if not self.has_similar_notification_today(notification):
                        self.add_notification(notification)
        except Exception as e:
            print(f"Error checking low stock notifications: {e}")

    def check_recent_activities_notifications(self):
        """Check for recent activities and create notifications"""
        try:
            today = datetime.now().date()
            
            activities = self.db.execute_query(
                """
                SELECT 
                    'Sale' as activity_type,
                    created_at,
                    CONCAT('Sale #', id) as details,
                    total_amount
                FROM sales
                WHERE DATE(created_at) = %s
                UNION ALL
                SELECT 
                    'Purchase' as activity_type,
                    created_at,
                    CONCAT('Purchase #', id) as details,
                    total_amount
                FROM purchases
                WHERE DATE(created_at) = %s
                ORDER BY created_at DESC
                """,
                (today, today)
            )
            
            for activity in activities:
                if activity['total_amount'] >= 1000:
                    notification = {
                        'type': 'Activity',
                        'title': f"High-value {activity['activity_type']}",
                        'message': f"{activity['details']} of {format_currency(activity['total_amount'])} at {format_datetime(activity['created_at'])}",
                        'timestamp': activity['created_at'],
                        'read': False,
                        'priority': 'medium'
                    }
                    
                    if not self.has_similar_notification_today(notification):
                        self.add_notification(notification)
        except Exception as e:
            print(f"Error checking recent activities notifications: {e}")

    def check_sales_notifications(self):
        """Check for sales milestones and create notifications"""
        try:
            today_sales = self.db.execute_query(
                "SELECT COALESCE(SUM(total_amount), 0) as total FROM sales WHERE DATE(created_at) = CURDATE()"
            )[0]['total']
            
            milestones = [1000, 5000, 10000, 25000, 50000, 100000]
            for milestone in milestones:
                if today_sales >= milestone and today_sales < milestone * 1.1:
                    notification = {
                        'type': 'Sales Milestone',
                        'title': f"Sales Milestone Reached!",
                        'message': f"Today's sales have reached {format_currency(milestone)}!",
                        'timestamp': datetime.now(),
                        'read': False,
                        'priority': 'low'
                    }
                    
                    if not self.has_similar_notification_today(notification):
                        self.add_notification(notification)
                    break
        except Exception as e:
            print(f"Error checking sales notifications: {e}")

    def check_purchase_notifications(self):
        """Check for purchase approvals and create notifications"""
        try:
            if self.user_data['role'] != 'admin':
                return
                
            try:
                pending_purchases = self.db.execute_query(
                    "SELECT COUNT(*) as count FROM purchases WHERE status = 'pending'"
                )
                if pending_purchases:
                    count = pending_purchases[0]['count']
                else:
                    count = 0
            except Exception as e:
                today = datetime.now().date()
                recent_purchases = self.db.execute_query(
                    "SELECT COUNT(*) as count FROM purchases WHERE DATE(created_at) = %s",
                    (today,)
                )
                if recent_purchases:
                    count = recent_purchases[0]['count']
                else:
                    count = 0
            
            if count > 0:
                notification = {
                    'type': 'Purchase Approval',
                    'title': f"Pending Purchase Approvals",
                    'message': f"You have {count} purchase order(s) waiting for approval.",
                    'timestamp': datetime.now(),
                    'read': False,
                    'priority': 'medium'
                }
                
                if not self.has_similar_notification_today(notification):
                    self.add_notification(notification)
        except Exception as e:
            print(f"Error checking purchase notifications: {e}")

    def add_notification(self, notification):
        """Add a notification and show it"""
        self.notifications.append(notification)
        self.show_notification_popup(notification)
        self.update_notification_count()
        
        if notification['priority'] == 'high':
            self.flash_window()

    def show_notification_popup(self, notification):
        """Show a popup notification"""
        popup = ctk.CTkToplevel(self.root)
        popup.title("Notification")
        popup.geometry("400x250")
        popup.transient(self.root)
        popup.grab_set()
        
        bg_color = {
            'high': '#FFDDDD',
            'medium': '#FFFFDD',
            'low': '#DDFFDD'
        }.get(notification['priority'], '#FFFFFF')
        
        popup.configure(bg_color=bg_color)
        
        popup.update_idletasks()
        x = (popup.winfo_screenwidth() // 2) - (popup.winfo_width() // 2)
        y = (popup.winfo_screenheight() // 2) - (popup.winfo_height() // 2)
        popup.geometry(f"+{x}+{y}")
        
        frame = ctk.CTkFrame(popup)
        frame.pack(fill="both", expand=True, padx=20, pady=20)
        
        priority_label = ctk.CTkLabel(
            frame,
            text=f"Priority: {notification['priority'].upper()}",
            font=ctk.CTkFont(size=10),
            text_color={
                'high': 'red',
                'medium': 'orange',
                'low': 'green'
            }.get(notification['priority'], 'black')
        )
        priority_label.pack(pady=(0, 5), anchor="e")
        
        title_label = ctk.CTkLabel(
            frame,
            text=notification['title'],
            font=ctk.CTkFont(size=16, weight="bold")
        )
        title_label.pack(pady=(0, 10))
        
        message_label = ctk.CTkLabel(
            frame,
            text=notification['message'],
            wraplength=350
        )
        message_label.pack(pady=(0, 10))
        
        time_label = ctk.CTkLabel(
            frame,
            text=format_datetime(notification['timestamp']),
            font=ctk.CTkFont(size=10)
        )
        time_label.pack(pady=(0, 10))
        
        button_frame = ctk.CTkFrame(frame)
        button_frame.pack(fill="x")
        
        if notification['type'] in ['Low Stock', 'Out of Stock']:
            view_button = ctk.CTkButton(
                button_frame,
                text="View Details",
                command=lambda: [self.quick_view_low_stock(), popup.destroy()]
            )
            view_button.pack(side="left", padx=5)
        elif notification['type'] == 'Activity':
            view_button = ctk.CTkButton(
                button_frame,
                text="View Details",
                command=lambda: [self.show_recent_activities(), popup.destroy()]
            )
            view_button.pack(side="left", padx=5)
        elif notification['type'] == 'Sales Milestone':
            view_button = ctk.CTkButton(
                button_frame,
                text="View Sales",
                command=lambda: [self.show_sales(), popup.destroy()]
            )
            view_button.pack(side="left", padx=5)
        elif notification['type'] == 'Purchase Approval':
            view_button = ctk.CTkButton(
                button_frame,
                text="View Purchases",
                command=lambda: [self.show_purchases(), popup.destroy()]
            )
            view_button.pack(side="left", padx=5)
        elif notification['type'] in ['Expiry Alert', 'Expired Product']:
            view_button = ctk.CTkButton(
                button_frame,
                text="View Products",
                command=lambda: [self.show_expiring_products(), popup.destroy()]
            )
            view_button.pack(side="left", padx=5)
        
        mark_read_button = ctk.CTkButton(
            button_frame,
            text="Mark as Read",
            command=lambda: [self.mark_notification_as_read(notification), popup.destroy()]
        )
        mark_read_button.pack(side="right", padx=5)
        
        close_button = ctk.CTkButton(
            button_frame,
            text="Close",
            command=popup.destroy
        )
        close_button.pack(side="right", padx=5)
        
        timeout = 30000 if notification['priority'] == 'high' else 15000
        popup.after(timeout, popup.destroy)
        
        self.flash_window(popup)

    def show_expiring_products(self):
        """Show products that are expiring soon or have expired"""
        try:
            self.clear_main_content()
            
            expiring_frame = ctk.CTkFrame(self.main_content)
            expiring_frame.pack(fill="both", expand=True, padx=20, pady=20)
            
            title_label = ctk.CTkLabel(
                expiring_frame,
                text="Expiring Products",
                font=ctk.CTkFont(size=24, weight="bold")
            )
            title_label.pack(pady=(10, 20))
            
            tree_frame = ctk.CTkFrame(expiring_frame)
            tree_frame.pack(fill="both", expand=True)
            
            tree = ttk.Treeview(
                tree_frame,
                columns=("Name", "Expiry Date", "Days Left", "Stock", "Status"),
                show="headings"
            )
            tree.pack(side="left", fill="both", expand=True)
            
            tree.heading("Name", text="Product Name")
            tree.heading("Expiry Date", text="Expiry Date")
            tree.heading("Days Left", text="Days Left")
            tree.heading("Stock", text="Current Stock")
            tree.heading("Status", text="Status")
            
            tree.column("Name", width=200)
            tree.column("Expiry Date", width=100)
            tree.column("Days Left", width=80)
            tree.column("Stock", width=80)
            tree.column("Status", width=100)
            
            scrollbar = ttk.Scrollbar(tree_frame, orient="vertical", command=tree.yview)
            scrollbar.pack(side="right", fill="y")
            tree.configure(yscrollcommand=scrollbar.set)
            
            seven_days_from_now = datetime.now().date() + timedelta(days=7)
            expiring_products = self.db.execute_query(
                """
                SELECT p.name, p.expiry_date, s.quantity
                FROM products p
                LEFT JOIN stock s ON p.id = s.product_id
                WHERE p.expiry_date IS NOT NULL 
                AND p.expiry_date <= %s
                AND s.quantity > 0
                ORDER BY p.expiry_date ASC
                """,
                (seven_days_from_now,)
            )
            
            for product in expiring_products:
                days_left = (product['expiry_date'] - datetime.now().date()).days
                status = "Expired" if days_left < 0 else f"{days_left} days"
                
                tree.insert("", "end", values=(
                    product['name'],
                    product['expiry_date'].strftime('%Y-%m-%d'),
                    status,
                    product['quantity'],
                    status
                ))
            
            back_button = ctk.CTkButton(
                expiring_frame,
                text="Back to Dashboard",
                command=self.show_dashboard,
                fg_color="#8E24AA",
                hover_color="#6A1B9A"
            )
            back_button.pack(pady=20)
            
        except Exception as e:
            self.show_error(f"Error loading expiring products: {str(e)}")

    def create_footer(self):
        self.footer_frame = ctk.CTkFrame(self.root, height=30)
        self.footer_frame.grid(row=1, column=0, columnspan=2, sticky="ew")
        
        self.footer_text = ctk.CTkLabel(
            self.footer_frame,
            text="Powered By: Protech Assist (SL) Limited - All rights reserved © 2025\t | \tinfo@protechassistlimited@gmail.com\t | \tContact Us: +232 34 955581\t | \t+232 32 881448\t | \tHead Office @ 25c Old Railway Line Tengbeh Town, Freetown Sierra Leone.",
            font=ctk.CTkFont(size=12)
        )
        self.footer_text.place(x=0, y=5)
        
        self.animate_footer()

    def animate_footer(self):
        if self.footer_animation_id:
            self.root.after_cancel(self.footer_animation_id)
        
        current_x = self.footer_text.winfo_x()
        text_width = self.footer_text.winfo_width()
        footer_width = self.footer_frame.winfo_width()
        
        if current_x < -text_width:
            self.footer_text.place(x=footer_width, y=5)
        else:
            self.footer_text.place(x=current_x - 2, y=5)
        
        self.footer_animation_id = self.root.after(50, self.animate_footer)

    def create_sidebar(self):
        self.sidebar = ctk.CTkFrame(self.root, width=200)
        self.sidebar.grid(row=0, column=0, sticky="nsew")
        self.sidebar.grid_rowconfigure(10, weight=1)

        self.inventory_label = ctk.CTkLabel(
            self.sidebar,
            text="📋 Inventory Management",
            font=ctk.CTkFont(size=16, weight="bold")
        )
        self.inventory_label.grid(row=0, column=0, padx=20, pady=(20, 10))
        
        self.time_label = ctk.CTkLabel(
            self.sidebar,
            text="",
            font=ctk.CTkFont(size=12)
        )
        self.time_label.grid(row=1, column=0, padx=20, pady=(0, 20))
        
        self.notification_bell = ctk.CTkLabel(
            self.sidebar,
            text="🔔",
            font=ctk.CTkFont(size=20),
            cursor="hand2"
        )
        self.notification_bell.grid(row=2, column=0, padx=20, pady=(0, 10))
        self.notification_bell.bind("<Button-1>", lambda e: self.show_notification_center())
        
        self.notification_count = ctk.CTkLabel(
            self.sidebar,
            text="",
            font=ctk.CTkFont(size=12, weight="bold"),
            text_color="red"
        )
        self.notification_count.grid(row=2, column=0, padx=20, pady=(0, 10), sticky="e")
        
        self.nav_buttons = []
        nav_items = [
            ("🏠 Dashboard", self.show_dashboard, "#6C5CE7", "#5F4BDB"),
            ("📦 Products", self.show_products, "#00B894", "#00A085"),
            ("📁 Categories", self.show_categories, "#0984E3", "#0770D1"),
            ("🏢 Suppliers", self.show_suppliers, "#6C5CE7", "#5F4BDB"),
            ("💰 Sales", self.show_sales, "#F39C12", "#E67E22"),
            ("💳 Credit", self.show_credit, "#E17055", "#D35400"),
            ("📋 Purchases", self.show_purchases, "#00CEC9", "#00B7B2"),
        ]
        
        if self.user_data['role'] == 'admin':
            nav_items.extend([
                ("📊 Reports", self.show_reports, "#A29BFE", "#9186F3"),
                ("👥 Users", self.show_users, "#FD79A8", "#FD6B9B"),
                ("⚙️ Settings", self.show_settings, "#636E72", "#575C60"),
            ])
        
        for i, (text, command, fg_color, hover_color) in enumerate(nav_items, start=3):
            btn = ctk.CTkButton(
                self.sidebar,
                text=text,
                command=command,
                width=160,
                fg_color=fg_color,
                hover_color=hover_color,
                text_color="white",
                corner_radius=10,
                font=ctk.CTkFont(size=12, weight="bold")
            )
            btn.grid(row=i, column=0, padx=20, pady=6)
            self.nav_buttons.append(btn)
        
        self.user_label = ctk.CTkLabel(
            self.sidebar,
            text=f"Welcome, {self.user_data['role'].title()}",
            font=ctk.CTkFont(size=16, weight="bold")
        )
        self.user_label.grid(row=len(nav_items) + 3, column=0, padx=20, pady=(20, 10))
        
        self.logout_btn = ctk.CTkButton(
            self.sidebar,
            text="🚪 Logout",
            command=self.logout,
            width=160,
            fg_color="#D63031",
            hover_color="#C0392B",
            text_color="white",
            corner_radius=10,
            font=ctk.CTkFont(size=12, weight="bold")
        )
        self.logout_btn.grid(row=len(nav_items) + 4, column=0, padx=20, pady=(20, 20))

    def create_main_content(self):
        self.main_content = ctk.CTkFrame(self.root)
        self.main_content.grid(row=0, column=1, sticky="nsew", padx=20, pady=20)
        self.main_content.grid_columnconfigure(0, weight=1)
        self.main_content.grid_rowconfigure(3, weight=1)
        
        self.header = ctk.CTkLabel(
            self.main_content,
            text="Dashboard",
            font=ctk.CTkFont(size=24, weight="bold")
        )
        self.header.grid(row=0, column=0, sticky="w", padx=20, pady=(20, 10))
        
        self.quick_actions_frame = ctk.CTkFrame(self.main_content)
        self.quick_actions_frame.grid(row=1, column=0, sticky="ew", padx=20, pady=2)
        self.quick_actions_label = ctk.CTkLabel(
            self.quick_actions_frame,
            text="Quick Actions",
            font=ctk.CTkFont(size=12, weight="bold")
        )
        self.quick_actions_label.pack(pady=(1, 0))
        
        self.quick_actions_buttons = ctk.CTkFrame(self.quick_actions_frame)
        self.quick_actions_buttons.pack(fill="x", padx=2, pady=0)
        
        self.quick_actions_buttons.grid_columnconfigure(0, weight=1)
        self.quick_actions_buttons.grid_columnconfigure(4, weight=1)
        
        if self.user_data['role'] == 'admin':
            self.add_product_button = ctk.CTkButton(
                self.quick_actions_buttons,
                text="📦 Add Product",
                command=self.quick_add_product,
                width=90,
                height=20,
                fg_color="#2196F3",
                hover_color="#1976D2",
                text_color="white"
            )
            self.add_product_button.grid(row=0, column=1, padx=5, pady=0)
            
            self.add_category_button = ctk.CTkButton(
                self.quick_actions_buttons,
                text="📁 Add Category",
                command=self.quick_add_category,
                width=90,
                height=20,
                fg_color="#4CAF50",
                hover_color="#388E3C",
                text_color="white"
            )
            self.add_category_button.grid(row=0, column=2, padx=5, pady=0)
            
            self.add_supplier_button = ctk.CTkButton(
                self.quick_actions_buttons,
                text="🏢 Add Supplier",
                command=self.quick_add_supplier,
                width=90,
                height=20,
                fg_color="#FF9800",
                hover_color="#F57C00",
                text_color="white"
            )
            self.add_supplier_button.grid(row=0, column=3, padx=5, pady=0)
            
            self.view_sales_button = ctk.CTkButton(
                self.quick_actions_buttons,
                text="💰 View Sales",
                command=self.quick_view_sales,
                width=90,
                height=20,
                fg_color="#9C27B0",
                hover_color="#7B1FA2",
                text_color="white"
            )
            self.view_sales_button.grid(row=1, column=1, padx=5, pady=0)
            
            self.create_po_button = ctk.CTkButton(
                self.quick_actions_buttons,
                text="📋 Create PO",
                command=self.quick_create_po,
                width=90,
                height=20,
                fg_color="#F44336",
                hover_color="#D32F2F",
                text_color="white"
            )
            self.create_po_button.grid(row=1, column=2, padx=5, pady=0)
            
            self.low_stock_button = ctk.CTkButton(
                self.quick_actions_buttons,
                text="⚠️ Low Stock",
                command=self.quick_view_low_stock,
                width=90,
                height=20,
                fg_color="#FF5722",
                hover_color="#E64A19",
                text_color="white"
            )
            self.low_stock_button.grid(row=1, column=3, padx=5, pady=0)
        
        self.view_graph_button = ctk.CTkButton(
            self.quick_actions_buttons,
            text="📊 View Graph",
            command=self.quick_view_graph,
            width=90,
            height=20,
            fg_color="#00BCD4",
            hover_color="#0097A7",
            text_color="white"
        )
        graph_row = 0 if self.user_data['role'] != 'admin' else 2
        graph_col = 1 if self.user_data['role'] != 'admin' else 1
        self.view_graph_button.grid(row=graph_row, column=graph_col, padx=5, pady=0)
        
        self.refresh_button = ctk.CTkButton(
            self.quick_actions_buttons,
            text="🔄 Refresh",
            command=self.quick_refresh,
            width=90,
            height=20,
            fg_color="#607D8B",
            hover_color="#455A64",
            text_color="white"
        )
        refresh_row = 1 if self.user_data['role'] != 'admin' else 2
        refresh_col = 2 if self.user_data['role'] != 'admin' else 2
        self.refresh_button.grid(row=refresh_row, column=refresh_col, padx=5, pady=0)
        
        if self.user_data['role'] != 'admin':
            self.low_stock_button = ctk.CTkButton(
                self.quick_actions_buttons,
                text="⚠️ Low Stock",
                command=self.quick_view_low_stock,
                width=90,
                height=20,
                fg_color="#FF5722",
                hover_color="#E64A19",
                text_color="white"
            )
            self.low_stock_button.grid(row=refresh_row, column=3, padx=5, pady=0)
        
        self.stats_frame = ctk.CTkFrame(self.main_content)
        self.stats_frame.grid(row=2, column=0, sticky="nsew", padx=20, pady=10)
        self.stats_frame.grid_columnconfigure((0, 1, 2, 3), weight=1)
        
        self.create_stat_cards()
        
        self.activities_frame = ctk.CTkFrame(self.main_content)
        self.activities_frame.grid(row=3, column=0, sticky="nsew", padx=20, pady=10)
        self.activities_frame.grid_columnconfigure(0, weight=1)
        
        self.create_activities_table()

    def create_stat_cards(self):
        if self.user_data['role'] == 'admin':
            self.stats_title = ctk.CTkLabel(
                self.stats_frame,
                text="Statistics Overview",
                font=ctk.CTkFont(size=18, weight="bold")
            )
            self.stats_title.grid(row=0, column=0, columnspan=4, pady=(0, 10))
            
            self.products_card = ctk.CTkFrame(self.stats_frame)
            self.products_card.grid(row=1, column=0, padx=10, pady=10, sticky="nsew")
            self.products_label = ctk.CTkLabel(
                self.products_card,
                text="Total Products",
                font=ctk.CTkFont(size=14)
            )
            self.products_label.pack(padx=20, pady=(20, 5))
            self.products_value = ctk.CTkLabel(
                self.products_card,
                text="0",
                font=ctk.CTkFont(size=24, weight="bold"),
                text_color="green"
            )
            self.products_value.pack(padx=20, pady=(0, 20))
            
            self.sales_card = ctk.CTkFrame(self.stats_frame)
            self.sales_card.grid(row=1, column=1, padx=10, pady=10, sticky="nsew")
            self.sales_label = ctk.CTkLabel(
                self.sales_card,
                text="Total Sales",
                font=ctk.CTkFont(size=14)
            )
            self.sales_label.pack(padx=20, pady=(20, 5))
            self.sales_value = ctk.CTkLabel(
                self.sales_card,
                text=f"0 {CURRENCY_SYMBOL}",
                font=ctk.CTkFont(size=24, weight="bold"),
                text_color="firebrick3"
            )
            self.sales_value.pack(padx=20, pady=(0, 20))
            
            self.stock_card = ctk.CTkFrame(self.stats_frame)
            self.stock_card.grid(row=1, column=2, padx=10, pady=10, sticky="nsew")
            self.stock_label = ctk.CTkLabel(
                self.stock_card,
                text="Low Stock Items",
                font=ctk.CTkFont(size=14)
            )
            self.stock_label.pack(padx=20, pady=(20, 5))
            self.stock_value = ctk.CTkLabel(
                self.stock_card,
                text="0",
                font=ctk.CTkFont(size=24, weight="bold"),
                text_color="#F39C12"
            )
            self.stock_value.pack(padx=20, pady=(0, 20))
            
            self.expiry_card = ctk.CTkFrame(self.stats_frame)
            self.expiry_card.grid(row=1, column=3, padx=10, pady=10, sticky="nsew")
            self.expiry_label = ctk.CTkLabel(
                self.expiry_card,
                text="Expiring Soon",
                font=ctk.CTkFont(size=14)
            )
            self.expiry_label.pack(padx=20, pady=(20, 5))
            self.expiry_value = ctk.CTkLabel(
                self.expiry_card,
                text="0",
                font=ctk.CTkFont(size=24, weight="bold"),
                text_color="#E74C3C"
            )
            self.expiry_value.pack(padx=20, pady=(0, 20))
            
            self.purchases_card = ctk.CTkFrame(self.stats_frame)
            self.purchases_card.grid(row=2, column=0, padx=10, pady=10, sticky="nsew")
            self.purchases_label = ctk.CTkLabel(
                self.purchases_card,
                text="Recent Purchases",
                font=ctk.CTkFont(size=14)
            )
            self.purchases_label.pack(padx=20, pady=(20, 5))
            self.purchases_value = ctk.CTkLabel(
                self.purchases_card,
                text=f"0 {CURRENCY_SYMBOL}",
                font=ctk.CTkFont(size=24, weight="bold"),
                text_color="magenta3"
            )
            self.purchases_value.pack(padx=20, pady=(0, 20))
        else:
            self.stats_title = ctk.CTkLabel(
                self.stats_frame,
                text="Statistics Overview",
                font=ctk.CTkFont(size=18, weight="bold")
            )
            self.stats_title.grid(row=0, column=0, columnspan=4, pady=(0, 10))
            
            self.products_card = ctk.CTkFrame(self.stats_frame)
            self.products_card.grid(row=1, column=0, padx=10, pady=10, sticky="nsew")
            self.products_label = ctk.CTkLabel(
                self.products_card,
                text="Total Products",
                font=ctk.CTkFont(size=14)
            )
            self.products_label.pack(padx=20, pady=(20, 5))
            self.products_value = ctk.CTkLabel(
                self.products_card,
                text="0",
                font=ctk.CTkFont(size=24, weight="bold"),
                text_color="green"
            )
            self.products_value.pack(padx=20, pady=(0, 20))
            
            self.sales_card = ctk.CTkFrame(self.stats_frame)
            self.sales_card.grid(row=1, column=1, padx=10, pady=10, sticky="nsew")
            self.sales_label = ctk.CTkLabel(
                self.sales_card,
                text="Total Sales",
                font=ctk.CTkFont(size=14)
            )
            self.sales_label.pack(padx=20, pady=(20, 5))
            self.sales_value = ctk.CTkLabel(
                self.sales_card,
                text=f"0 {CURRENCY_SYMBOL}",
                font=ctk.CTkFont(size=24, weight="bold"),
                text_color="#7CFC00"
            )
            self.sales_value.pack(padx=20, pady=(0, 20))
            
            self.stock_card = ctk.CTkFrame(self.stats_frame)
            self.stock_card.grid(row=1, column=2, padx=10, pady=10, sticky="nsew")
            self.stock_label = ctk.CTkLabel(
                self.stock_card,
                text="Low Stock Items",
                font=ctk.CTkFont(size=14)
            )
            self.stock_label.pack(padx=20, pady=(20, 5))
            self.stock_value = ctk.CTkLabel(
                self.stock_card,
                text="0",
                font=ctk.CTkFont(size=24, weight="bold"),
                text_color="#F39C12"
            )
            self.stock_value.pack(padx=20, pady=(0, 20))
            
            self.expiry_card = ctk.CTkFrame(self.stats_frame)
            self.expiry_card.grid(row=1, column=3, padx=10, pady=10, sticky="nsew")
            self.expiry_label = ctk.CTkLabel(
                self.expiry_card,
                text="Expiring Soon",
                font=ctk.CTkFont(size=14)
            )
            self.expiry_label.pack(padx=20, pady=(20, 5))
            self.expiry_value = ctk.CTkLabel(
                self.expiry_card,
                text="0",
                font=ctk.CTkFont(size=24, weight="bold"),
                text_color="#E74C3C"
            )
            self.expiry_value.pack(padx=20, pady=(0, 20))

    def create_activities_table(self):
        self.activities_header = ctk.CTkLabel(
            self.activities_frame,
            text="Recent Activities",
            font=ctk.CTkFont(size=18, weight="bold")
        )
        self.activities_header.pack(pady=(10, 5), padx=20, anchor="w")
        
        self.activities_scroll = ctk.CTkScrollableFrame(self.activities_frame)
        self.activities_scroll.pack(fill="both", expand=True, padx=20, pady=10)
        
        header_frame = ctk.CTkFrame(self.activities_scroll)
        header_frame.pack(fill="x", padx=5, pady=2)
        
        date_header = ctk.CTkLabel(
            header_frame,
            text="Date",
            font=ctk.CTkFont(size=12, weight="bold")
        )
        date_header.grid(row=0, column=0, padx=10, pady=5, sticky="w")
        
        type_header = ctk.CTkLabel(
            header_frame,
            text="Type",
            font=ctk.CTkFont(size=12, weight="bold")
        )
        type_header.grid(row=0, column=1, padx=10, pady=5, sticky="w")
        
        details_header = ctk.CTkLabel(
            header_frame,
            text="Details",
            font=ctk.CTkFont(size=12, weight="bold")
        )
        details_header.grid(row=0, column=2, padx=10, pady=5, sticky="w")

    def load_dashboard_stats(self):
        try:
            products_count = self.db.execute_query("SELECT COUNT(*) as count FROM products")[0]['count']
            self.products_value.configure(text=str(products_count))
            
            total_sales = self.db.execute_query(
                "SELECT COALESCE(SUM(total_amount), 0) as total FROM sales"
            )[0]['total']
            self.sales_value.configure(
                text=format_currency(total_sales),
                text_color="#87CEEB" if self.user_data['role'] == 'admin' else "#00FF00"
            )
            
            low_stock = self.db.execute_query(
                "SELECT COUNT(*) as count FROM stock WHERE quantity > 0 AND quantity <= min_quantity"
            )[0]['count']
            self.stock_value.configure(text=str(low_stock))
            
            seven_days_from_now = datetime.now().date() + timedelta(days=7)
            expiring_count = self.db.execute_query(
                """
                SELECT COUNT(*) as count 
                FROM products p
                LEFT JOIN stock s ON p.id = s.product_id
                WHERE p.expiry_date IS NOT NULL 
                AND p.expiry_date <= %s
                AND p.expiry_date >= CURDATE()
                AND s.quantity > 0
                """,
                (seven_days_from_now,)
            )[0]['count']
            self.expiry_value.configure(text=str(expiring_count))
            
            if self.user_data['role'] == 'admin':
                recent_purchases = self.db.execute_query(
                    "SELECT COALESCE(SUM(total_amount), 0) as total FROM purchases "
                    "WHERE DATE(date) = CURDATE()"
                )[0]['total']
                self.purchases_value.configure(text=format_currency(recent_purchases))
            
            self.load_recent_activities()
        except Exception as e:
            print(f"Error loading dashboard stats: {e}")

    def load_recent_activities(self):
        for widget in self.activities_scroll.winfo_children():
            if isinstance(widget, ctk.CTkFrame) and widget != self.activities_scroll.winfo_children()[0]:
                widget.destroy()
        
        activities = self.db.execute_query(
            """
            SELECT 
                'Sale' as activity_type,
                created_at,
                CONCAT('Sale #', id) as details
            FROM sales
            UNION ALL
            SELECT 
                'Purchase' as activity_type,
                created_at,
                CONCAT('Purchase #', id) as details
            FROM purchases
            ORDER BY created_at DESC
            LIMIT 10
            """
        )
        
        for activity in activities:
            activity_frame = ctk.CTkFrame(self.activities_scroll)
            activity_frame.pack(fill="x", padx=5, pady=2)
            
            date_label = ctk.CTkLabel(
                activity_frame,
                text=format_datetime(activity['created_at']),
                font=ctk.CTkFont(size=11)
            )
            date_label.grid(row=0, column=0, padx=10, pady=5, sticky="w")
            
            type_label = ctk.CTkLabel(
                activity_frame,
                text=activity['activity_type'],
                font=ctk.CTkFont(size=11)
            )
            type_label.grid(row=0, column=1, padx=10, pady=5, sticky="w")
            
            details_label = ctk.CTkLabel(
                activity_frame,
                text=activity['details'],
                font=ctk.CTkFont(size=11)
            )
            details_label.grid(row=0, column=2, padx=10, pady=5, sticky="w")

    def clear_main_content(self):
        for widget in self.main_content.winfo_children():
            widget.destroy()

    def show_dashboard(self):
        self.clear_main_content()
        self.create_main_content()
        self.load_dashboard_stats()
        self.load_recent_activities()
        self.update_time()

    def show_products(self):
        try:
            from products import ProductsWindow
            ProductsWindow(self.main_content, self.user_data)
        except ImportError:
            self.show_error("Products module not found")
        except Exception as e:
            self.show_error(f"Error loading products: {str(e)}")

    def show_categories(self):
        try:
            from categories import CategoriesWindow
            CategoriesWindow(self.main_content, self.user_data)
        except ImportError:
            self.show_error("Categories module not found")
        except Exception as e:
            self.show_error(f"Error loading categories: {str(e)}")

    def show_suppliers(self):
        try:
            from suppliers import SuppliersWindow
            SuppliersWindow(self.main_content, self.user_data)
        except ImportError:
            self.show_error("Suppliers module not found")
        except Exception as e:
            self.show_error(f"Error loading suppliers: {str(e)}")

    def show_sales(self):
        try:
            from sales import SalesWindow
            self.clear_main_content()
            sales_window = SalesWindow(self.main_content, self.user_data, self)
        except ImportError:
            self.show_error("Sales module not found")
        except Exception as e:
            self.show_error(f"Error loading sales: {str(e)}")

    def show_purchases(self):
        try:
            from purchase import PurchaseWindow
            PurchaseWindow(self.main_content, self.user_data)
        except ImportError:
            self.show_error("Purchases module not found")
        except Exception as e:
            self.show_error(f"Error loading purchases: {str(e)}")

    def show_users(self):
        if self.user_data['role'] != 'admin':
            self.show_error("Access Denied: You do not have permission to manage users.")
            return

        try:
            self.clear_main_content()
            from users import UsersWindow
            UsersWindow(self.main_content, self.user_data)
        except ImportError:
            self.show_error("Users module not found. Please ensure 'users.py' exists in the project directory.")
        except Exception as e:
            self.show_error(f"An error occurred while loading the user management module: {str(e)}")

    def show_settings(self):
        try:
            from settings import SettingsWindow
            SettingsWindow(self.main_content, self.user_data)
        except ImportError:
            self.show_error("Settings module not found")
        except Exception as e:
            self.show_error(f"Error loading settings: {str(e)}")

    def show_reports(self):
        if self.user_data['role'] != 'admin':
            self.show_error("Access Denied: You do not have permission to view reports.")
            return

        try:
            from reports import ReportsWindow
            ReportsWindow(self.main_content, self.user_data)
        except ImportError:
            self.show_error("Reports module not found")
        except Exception as e:
            self.show_error(f"Error loading reports: {str(e)}")

    def show_credit(self):
        try:
            from credit import CreditWindow
            CreditWindow(self.main_content, self.user_data)
        except ImportError:
            self.show_error("Credit module not found")
        except Exception as e:
            self.show_error(f"Error loading credit management: {str(e)}")

    def show_recent_activities(self):
        self.clear_main_content()
        
        activities_frame = ctk.CTkFrame(self.main_content)
        activities_frame.pack(fill="both", expand=True, padx=20, pady=20)
        
        title_label = ctk.CTkLabel(
            activities_frame,
            text="Recent Activities",
            font=ctk.CTkFont(size=24, weight="bold")
        )
        title_label.pack(pady=(10, 20))
        
        tree_frame = ctk.CTkFrame(activities_frame)
        tree_frame.pack(fill="both", expand=True)
        
        tree = ttk.Treeview(
            tree_frame,
            columns=("Date", "Type", "Details"),
            show="headings"
        )
        tree.pack(side="left", fill="both", expand=True)
        
        tree.heading("Date", text="Date")
        tree.heading("Type", text="Type")
        tree.heading("Details", text="Details")
        
        tree.column("Date", width=150)
        tree.column("Type", width=100)
        tree.column("Details", width=300)
        
        scrollbar = ttk.Scrollbar(tree_frame, orient="vertical", command=tree.yview)
        scrollbar.pack(side="right", fill="y")
        tree.configure(yscrollcommand=scrollbar.set)
        
        activities = self.db.execute_query(
            """
            SELECT 
                'Sale' as activity_type,
                created_at,
                CONCAT('Sale #', id, ' - Total: ', total_amount) as details
            FROM sales
            UNION ALL
            SELECT 
                'Purchase' as activity_type,
                created_at,
                CONCAT('Purchase #', id, ' - Total: ', total_amount) as details
            FROM purchases
            ORDER BY created_at DESC
            LIMIT 50
            """
        )
        
        for activity in activities:
            tree.insert("", "end", values=(
                format_datetime(activity['created_at']),
                activity['activity_type'],
                activity['details']
            ))
        
        back_button = ctk.CTkButton(
            activities_frame,
            text="Back to Dashboard",
            command=self.show_dashboard,
            fg_color="#8E24AA",
            hover_color="#6A1B9A"
        )
        back_button.pack(pady=20)

    def show_error(self, message):
        self.clear_main_content()
        error_label = ctk.CTkLabel(
            self.main_content,
            text=message,
            font=ctk.CTkFont(size=16)
        )
        error_label.pack(padx=20, pady=20)

    def update_time(self):
        if self.time_update_id:
            self.root.after_cancel(self.time_update_id)
        
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        self.time_label.configure(text=current_time)
        self.time_update_id = self.root.after(1000, self.update_time)

    def on_closing(self):
        self.stop_notification_thread = True
        if self.notification_thread and self.notification_thread.is_alive():
            self.notification_thread.join(timeout=1)
        
        if self.footer_animation_id:
            self.root.after_cancel(self.footer_animation_id)
        
        if self.time_update_id:
            self.root.after_cancel(self.time_update_id)
        
        self.root.destroy()

    def quick_add_product(self):
        try:
            from products import ProductsWindow
            products_window = ProductsWindow(self.main_content, self.user_data)
            products_window.add_product()
        except ImportError:
            self.show_error("Products module not found")
        except Exception as e:
            self.show_error(f"Error adding product: {str(e)}")

    def quick_add_category(self):
        try:
            from categories import CategoriesWindow
            categories_window = CategoriesWindow(self.main_content, self.user_data)
            categories_window.add_category()
        except ImportError:
            self.show_error("Categories module not found")
        except Exception as e:
            self.show_error(f"Error adding category: {str(e)}")

    def quick_add_supplier(self):
        try:
            from suppliers import SuppliersWindow
            suppliers_window = SuppliersWindow(self.main_content, self.user_data)
            suppliers_window.add_supplier()
        except ImportError:
            self.show_error("Suppliers module not found")
        except Exception as e:
            self.show_error(f"Error adding supplier: {str(e)}")

    def quick_view_sales(self):
        try:
            from sales import SalesWindow
            SalesWindow(self.main_content, self.user_data)
        except ImportError:
            self.show_error("Sales module not found")
        except Exception as e:
            self.show_error(f"Error loading sales: {str(e)}")

    def quick_create_po(self):
        try:
            from purchase import PurchaseWindow
            purchase_window = PurchaseWindow(self.main_content, self.user_data)
            purchase_window.add_purchase()
        except ImportError:
            self.show_error("Purchase module not found")
        except Exception as e:
            self.show_error(f"Error creating purchase order: {str(e)}")

    def quick_view_low_stock(self):
        try:
            self.clear_main_content()
            
            low_stock_frame = ctk.CTkFrame(self.main_content)
            low_stock_frame.pack(fill="both", expand=True, padx=20, pady=20)
            
            title_label = ctk.CTkLabel(
                low_stock_frame,
                text="Low Stock Items",
                font=ctk.CTkFont(size=24, weight="bold")
            )
            title_label.pack(pady=(10, 20))
            
            tree_frame = ctk.CTkFrame(low_stock_frame)
            tree_frame.pack(fill="both", expand=True)
            
            tree = ttk.Treeview(
                tree_frame,
                columns=("ID", "Product Name", "Current Stock", "Min Stock", "Status"),
                show="headings"
            )
            tree.pack(side="left", fill="both", expand=True)
            
            tree.heading("ID", text="ID")
            tree.heading("Product Name", text="Product Name")
            tree.heading("Current Stock", text="Current Stock")
            tree.heading("Min Stock", text="Min Stock")
            tree.heading("Status", text="Status")
            
            tree.column("ID", width=50)
            tree.column("Product Name", width=200)
            tree.column("Current Stock", width=100)
            tree.column("Min Stock", width=100)
            tree.column("Status", width=100)
            
            scrollbar = ttk.Scrollbar(tree_frame, orient="vertical", command=tree.yview)
            scrollbar.pack(side="right", fill="y")
            tree.configure(yscrollcommand=scrollbar.set)
            
            low_stock_items = self.db.get_low_stock_items()
            
            for item in low_stock_items:
                status = "Low Stock"
                if item['quantity'] <= 0:
                    status = "Out of Stock"
                
                tree.insert("", "end", values=(
                    item['id'],
                    item['name'],
                    item['quantity'],
                    item['min_quantity'],
                    status
                ))
            
            back_button = ctk.CTkButton(
                low_stock_frame,
                text="Back to Dashboard",
                command=self.show_dashboard,
                fg_color="#8E24AA",
                hover_color="#6A1B9A"
            )
            back_button.pack(pady=20)
            
        except Exception as e:
            self.show_error(f"Error loading low stock items: {str(e)}")

    def quick_view_graph(self):
        try:
            from graphs import GraphWindow
            GraphWindow(self.main_content, self.user_data)
        except ImportError:
            self.show_error("Graphs module not found")
        except Exception as e:
            self.show_error(f"Error loading graphs: {str(e)}")

    def quick_refresh(self):
        self.load_dashboard_stats()
        self.load_recent_activities()

    def logout(self):
        if messagebox.askyesno("Logout", "Are you sure you want to logout?"):
            if self.footer_animation_id:
                self.root.after_cancel(self.footer_animation_id)
            
            if self.time_update_id:
                self.root.after_cancel(self.time_update_id)
            
            self.stop_notification_thread = True
            if self.notification_thread and self.notification_thread.is_alive():
                self.notification_thread.join(timeout=1)
            
            self.root.destroy()
            from login import get_login
            login_result = get_login()
            if login_result:
                user_data, first_login = login_result
                Dashboard(user_data).run()

    def flash_window(self, window=None):
        target_window = window if window else self.root
        original_bg = target_window.cget("bg")
        flash_count = 0
        
        def flash():
            nonlocal flash_count
            if flash_count < 6:
                if flash_count % 2 == 0:
                    target_window.configure(bg="#FFD700")
                else:
                    target_window.configure(bg=original_bg)
                flash_count += 1
                target_window.after(300, flash)
            else:
                target_window.configure(bg=original_bg)
        
        flash()

    def mark_notification_as_read(self, notification):
        notification['read'] = True
        self.update_notification_count()

    def update_notification_count(self):
        unread_count = sum(1 for n in self.notifications if not n['read'])
        if unread_count > 0:
            self.notification_count.configure(text=str(unread_count))
        else:
            self.notification_count.configure(text="")

    def show_notification_center(self):
        if self.notification_window is not None:
            self.notification_window.lift()
            return
            
        self.notification_window = ctk.CTkToplevel(self.root)
        self.notification_window.title("Notification Center")
        self.notification_window.geometry("600x400")
        self.notification_window.transient(self.root)
        
        self.notification_window.update_idletasks()
        x = (self.notification_window.winfo_screenwidth() // 2) - (self.notification_window.winfo_width() // 2)
        y = (self.notification_window.winfo_screenheight() // 2) - (self.notification_window.winfo_height() // 2)
        self.notification_window.geometry(f"+{x}+{y}")
        
        header_frame = ctk.CTkFrame(self.notification_window)
        header_frame.pack(fill="x", padx=10, pady=10)
        
        title_label = ctk.CTkLabel(
            header_frame,
            text="Notification Center",
            font=ctk.CTkFont(size=18, weight="bold")
        )
        title_label.pack(side="left", padx=10, pady=10)
        
        clear_button = ctk.CTkButton(
            header_frame,
            text="Clear All",
            command=self.clear_all_notifications
        )
        clear_button.pack(side="right", padx=10, pady=10)
        
        scroll_frame = ctk.CTkScrollableFrame(self.notification_window)
        scroll_frame.pack(fill="both", expand=True, padx=10, pady=10)
        
        self.display_notifications_in_center(scroll_frame)
        
        self.notification_window.protocol("WM_DELETE_WINDOW", self.close_notification_center)

    def display_notifications_in_center(self, parent_frame):
        for widget in parent_frame.winfo_children():
            widget.destroy()
        
        sorted_notifications = sorted(self.notifications, key=lambda x: x['timestamp'], reverse=True)
        
        for notification in sorted_notifications:
            notif_frame = ctk.CTkFrame(parent_frame)
            notif_frame.pack(fill="x", padx=5, pady=5)
            
            if not notification['read']:
                notif_frame.configure(fg_color=("#EFEFEF", "#2B2B2B"))
            
            priority_label = ctk.CTkLabel(
                notif_frame,
                text=f"Priority: {notification['priority'].upper()}",
                font=ctk.CTkFont(size=10),
                text_color={
                    'high': 'red',
                    'medium': 'orange',
                    'low': 'green'
                }.get(notification['priority'], 'black')
            )
            priority_label.pack(pady=(5, 0), anchor="e", padx=10)
            
            title_label = ctk.CTkLabel(
                notif_frame,
                text=notification['title'],
                font=ctk.CTkFont(size=14, weight="bold")
            )
            title_label.pack(pady=(5, 0), anchor="w", padx=10)
            
            message_label = ctk.CTkLabel(
                notif_frame,
                text=notification['message'],
                wraplength=500
            )
            message_label.pack(pady=(5, 0), anchor="w", padx=10)
            
            time_label = ctk.CTkLabel(
                notif_frame,
                text=format_datetime(notification['timestamp']),
                font=ctk.CTkFont(size=10)
            )
            time_label.pack(pady=(5, 10), anchor="w", padx=10)
            
            button_frame = ctk.CTkFrame(notif_frame)
            button_frame.pack(fill="x", pady=(0, 10))
            
            if notification['type'] in ['Low Stock', 'Out of Stock']:
                view_button = ctk.CTkButton(
                    button_frame,
                    text="View Details",
                    width=100,
                    command=lambda n=notification: [self.quick_view_low_stock(), self.mark_notification_as_read(n)]
                )
                view_button.pack(side="left", padx=10)
            elif notification['type'] == 'Activity':
                view_button = ctk.CTkButton(
                    button_frame,
                    text="View Details",
                    width=100,
                    command=lambda n=notification: [self.show_recent_activities(), self.mark_notification_as_read(n)]
                )
                view_button.pack(side="left", padx=10)
            elif notification['type'] == 'Sales Milestone':
                view_button = ctk.CTkButton(
                    button_frame,
                    text="View Sales",
                    width=100,
                    command=lambda n=notification: [self.show_sales(), self.mark_notification_as_read(n)]
                )
                view_button.pack(side="left", padx=10)
            elif notification['type'] == 'Purchase Approval':
                view_button = ctk.CTkButton(
                    button_frame,
                    text="View Purchases",
                    width=100,
                    command=lambda n=notification: [self.show_purchases(), self.mark_notification_as_read(n)]
                )
                view_button.pack(side="left", padx=10)
            elif notification['type'] in ['Expiry Alert', 'Expired Product']:
                view_button = ctk.CTkButton(
                    button_frame,
                    text="View Products",
                    width=100,
                    command=lambda n=notification: [self.show_expiring_products(), self.mark_notification_as_read(n)]
                )
                view_button.pack(side="left", padx=10)
            
            if notification['read']:
                delete_button = ctk.CTkButton(
                    button_frame,
                    text="Delete",
                    width=100,
                    fg_color="red",
                    command=lambda n=notification: self.delete_notification(n)
                )
                delete_button.pack(side="right", padx=10)
            else:
                mark_read_button = ctk.CTkButton(
                    button_frame,
                    text="Mark as Read",
                    width=100,
                    command=lambda n=notification: self.mark_notification_as_read(n)
                )
                mark_read_button.pack(side="right", padx=10)

    def delete_notification(self, notification):
        if notification in self.notifications:
            self.notifications.remove(notification)
            self.update_notification_count()
            if self.notification_window is not None:
                self.display_notifications_in_center(self.notification_window.winfo_children()[0])

    def clear_all_notifications(self):
        self.notifications = []
        self.update_notification_count()
        if self.notification_window is not None:
            self.display_notifications_in_center(self.notification_window.winfo_children()[0])

    def close_notification_center(self):
        self.notification_window.destroy()
        self.notification_window = None

    def run(self):
        self.root.mainloop()
