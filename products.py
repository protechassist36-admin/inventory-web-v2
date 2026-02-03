import customtkinter as ctk
import tkinter as tk
from tkinter import messagebox, ttk
import pymysql
from utils import validate_stock_level
from datetime import datetime

class ProductsWindow(ctk.CTkFrame):
    def __init__(self, parent_frame, user_data):
        super().__init__(parent_frame)
        self.user_data = user_data
        # Configure grid weights for parent frame
        self.grid(row=0, column=0, sticky="nsew")
        parent_frame.grid_rowconfigure(0, weight=1)
        parent_frame.grid_columnconfigure(0, weight=1)
        # Create a container frame inside this frame that will use pack
        self.container_frame = ctk.CTkFrame(self)
        self.container_frame.pack(fill="both", expand=True, padx=10, pady=10)
        # Title Label
        self.title_label = ctk.CTkLabel(self.container_frame, text="Products Management", 
                                      font=ctk.CTkFont(size=20, weight="bold"))
        self.title_label.pack(pady=(0, 10))
        # Search Frame
        self.search_frame = ctk.CTkFrame(self.container_frame)
        self.search_frame.pack(fill="x", pady=(0, 10))
        self.search_entry = ctk.CTkEntry(self.search_frame, placeholder_text="Search products...")
        self.search_entry.pack(side="left", fill="x", expand=True, padx=(0, 5))
        self.search_button = ctk.CTkButton(self.search_frame, text="Search", command=self.search_products,
                                         fg_color="#1E88E5", hover_color="#1565C0")  # Blue
        self.search_button.pack(side="left", padx=5)
        # Buttons Frame
        self.buttons_frame = ctk.CTkFrame(self.container_frame)
        self.buttons_frame.pack(fill="x", pady=(0, 10))
        self.add_button = ctk.CTkButton(self.buttons_frame, text="Add", command=self.add_product,
                                      fg_color="#43A047", hover_color="#2E7D32")  # Green
        self.add_button.pack(side="left", padx=5)
        self.update_button = ctk.CTkButton(self.buttons_frame, text="Update", command=self.update_product,
                                        fg_color="#FB8C00", hover_color="#EF6C00")  # Orange
        self.update_button.pack(side="left", padx=5)
        self.delete_button = ctk.CTkButton(self.buttons_frame, text="Delete", command=self.delete_product,
                                        fg_color="#E53935", hover_color="#C62828")  # Red
        self.delete_button.pack(side="left", padx=5)
        self.refresh_button = ctk.CTkButton(self.buttons_frame, text="Refresh", command=self.refresh_products,
                                          fg_color="#8E24AA", hover_color="#6A1B9A")  # Purple
        self.refresh_button.pack(side="left", padx=5)
        # Treeview Frame
        self.tree_frame = ctk.CTkFrame(self.container_frame)
        self.tree_frame.pack(fill="both", expand=True)
        # Create Treeview with updated columns including expiry date
        self.tree = ttk.Treeview(self.tree_frame, columns=("ID", "Name", "Product Number", "Unit Price", "Stock", "Record Level", "Status", "Category", "Expiry Date"), show="headings")
        self.tree.pack(fill="both", expand=True)
        # Define headings
        self.tree.heading("ID", text="ID")
        self.tree.heading("Name", text="Name")
        self.tree.heading("Product Number", text="Product Number")
        self.tree.heading("Unit Price", text="Unit Price")
        self.tree.heading("Stock", text="Stock")
        self.tree.heading("Record Level", text="Record Level")
        self.tree.heading("Status", text="Status")
        self.tree.heading("Category", text="Category")
        self.tree.heading("Expiry Date", text="Expiry Date")
        # Configure column widths
        self.tree.column("ID", width=40)
        self.tree.column("Name", width=150)
        self.tree.column("Product Number", width=120)
        self.tree.column("Unit Price", width=80)
        self.tree.column("Stock", width=60)
        self.tree.column("Record Level", width=80)
        self.tree.column("Status", width=80)
        self.tree.column("Category", width=100)
        self.tree.column("Expiry Date", width=100)
        # Scrollbar
        scrollbar = ttk.Scrollbar(self.tree_frame, orient="vertical", command=self.tree.yview)
        scrollbar.pack(side="right", fill="y")
        self.tree.configure(yscrollcommand=scrollbar.set)
        # Load initial data
        self.refresh_products()

    def get_db_connection(self):
        """Create and return a database connection"""
        try:
            connection = pymysql.connect(
                host='localhost',
                user='root',
                password='Trovegs35',
                database='inventory_db',
                charset='utf8mb4',
                cursorclass=pymysql.cursors.DictCursor
            )
            return connection
        except pymysql.Error as e:
            messagebox.showerror("Database Error", f"Error connecting to database: {e}")
            return None

    def refresh_products(self):
        """Load all products from database into treeview"""
        # Clear existing items
        for item in self.tree.get_children():
            self.tree.delete(item)
        connection = self.get_db_connection()
        if not connection:
            return
        try:
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT p.*, c.name as category_name, s.quantity, s.min_quantity 
                    FROM products p
                    LEFT JOIN categories c ON p.category_id = c.id
                    LEFT JOIN stock s ON p.id = s.product_id
                """)
                products = cursor.fetchall()
                
                for product in products:
                    # Determine stock status
                    current_stock = product['quantity'] if product['quantity'] else 0
                    min_stock = product['min_quantity'] if product['min_quantity'] else 10
                    status = validate_stock_level(current_stock, min_stock)
                    
                    # Format expiry date
                    expiry_date = product.get('expiry_date')
                    expiry_str = expiry_date.strftime('%Y-%m-%d') if expiry_date else "N/A"
                    
                    self.tree.insert("", "end", values=(
                        product['id'],
                        product['name'],
                        f"PROD-{product['id']:05d}",
                        product['unit_price'],
                        current_stock,
                        min_stock,
                        status.replace('_', ' ').title(),
                        product['category_name'],
                        expiry_str
                    ))
        except pymysql.Error as e:
            messagebox.showerror("Database Error", f"Error fetching products: {e}")
        finally:
            connection.close()

    def add_product(self):
        """Open dialog to add a new product"""
        dialog = ctk.CTkToplevel(self)
        dialog.title("Add Product")
        dialog.geometry("400x450")  # Increased height to accommodate expiry date
        dialog.transient(self.container_frame)
        
        # Main container with padding
        main_frame = ctk.CTkFrame(dialog)
        main_frame.pack(fill="both", expand=True, padx=20, pady=20)
        
        # Title
        title_label = ctk.CTkLabel(main_frame, text="Add New Product", 
                                  font=ctk.CTkFont(size=16, weight="bold"))
        title_label.pack(pady=(0, 15))
        
        # Form fields
        fields = {}
        
        # Product Name field
        name_frame = ctk.CTkFrame(main_frame)
        name_frame.pack(fill="x", pady=5)
        ctk.CTkLabel(name_frame, text="Product Name:", width=120).pack(side="left", padx=(0, 10))
        name_entry = ctk.CTkEntry(name_frame)
        name_entry.pack(side="left", fill="x", expand=True)
        fields["name"] = name_entry
        
        # Product Number field (auto-generated)
        number_frame = ctk.CTkFrame(main_frame)
        number_frame.pack(fill="x", pady=5)
        ctk.CTkLabel(number_frame, text="Product Number:", width=120).pack(side="left", padx=(0, 10))
        number_label = ctk.CTkLabel(number_frame, text="PROD-00001", text_color="gray")
        number_label.pack(side="left", fill="x", expand=True)
        fields["product_number"] = number_label
        
        # Unit Price field
        price_frame = ctk.CTkFrame(main_frame)
        price_frame.pack(fill="x", pady=5)
        ctk.CTkLabel(price_frame, text="Unit Price:", width=120).pack(side="left", padx=(0, 10))
        price_entry = ctk.CTkEntry(price_frame)
        price_entry.pack(side="left", fill="x", expand=True)
        fields["price"] = price_entry
        
        # Quantity field
        quantity_frame = ctk.CTkFrame(main_frame)
        quantity_frame.pack(fill="x", pady=5)
        ctk.CTkLabel(quantity_frame, text="Quantity:", width=120).pack(side="left", padx=(0, 10))
        quantity_entry = ctk.CTkEntry(quantity_frame)
        quantity_entry.pack(side="left", fill="x", expand=True)
        fields["quantity"] = quantity_entry
        
        # Record Level field
        min_stock_frame = ctk.CTkFrame(main_frame)
        min_stock_frame.pack(fill="x", pady=5)
        ctk.CTkLabel(min_stock_frame, text="Record Level:", width=120).pack(side="left", padx=(0, 10))
        min_stock_entry = ctk.CTkEntry(min_stock_frame)
        min_stock_entry.insert(0, "10")
        min_stock_entry.pack(side="left", fill="x", expand=True)
        fields["min_quantity"] = min_stock_entry
        
        # Expiry Date field
        expiry_frame = ctk.CTkFrame(main_frame)
        expiry_frame.pack(fill="x", pady=5)
        ctk.CTkLabel(expiry_frame, text="Expiry Date:", width=120).pack(side="left", padx=(0, 10))
        expiry_entry = ctk.CTkEntry(expiry_frame, placeholder_text="YYYY-MM-DD")
        expiry_entry.pack(side="left", fill="x", expand=True)
        fields["expiry_date"] = expiry_entry
        
        # Status field (calculated)
        status_frame = ctk.CTkFrame(main_frame)
        status_frame.pack(fill="x", pady=5)
        ctk.CTkLabel(status_frame, text="Status:", width=120).pack(side="left", padx=(0, 10))
        status_label = ctk.CTkLabel(status_frame, text="In Stock", text_color="green")
        status_label.pack(side="left", fill="x", expand=True)
        fields["status"] = status_label
        
        # Category field
        category_frame = ctk.CTkFrame(main_frame)
        category_frame.pack(fill="x", pady=5)
        ctk.CTkLabel(category_frame, text="Category:", width=120).pack(side="left", padx=(0, 10))
        
        # Get categories for dropdown
        categories = self.get_categories()
        category_options = {cat['name']: cat['id'] for cat in categories}
        
        category_var = tk.StringVar()
        category_dropdown = ctk.CTkOptionMenu(category_frame, variable=category_var, values=list(category_options.keys()))
        category_dropdown.pack(side="left", fill="x", expand=True)
        fields["category"] = category_var
        
        # Update status when quantity or min_stock changes
        def update_status(*args):
            try:
                quantity = int(quantity_entry.get() or 0)
                min_stock = int(min_stock_entry.get() or 10)
                
                if quantity <= 0:
                    status_label.configure(text="Out of Stock", text_color="red")
                elif quantity <= min_stock:
                    status_label.configure(text="Low Stock", text_color="orange")
                else:
                    status_label.configure(text="In Stock", text_color="green")
            except ValueError:
                status_label.configure(text="In Stock", text_color="green")
        
        quantity_entry.bind("<KeyRelease>", update_status)
        min_stock_entry.bind("<KeyRelease>", update_status)
        
        # Buttons frame
        buttons_frame = ctk.CTkFrame(main_frame)
        buttons_frame.pack(fill="x", pady=(15, 0))
        
        def save_product():
            try:
                # Get values from form
                name = fields["name"].get().strip()
                price = float(fields["price"].get().strip())
                quantity = int(fields["quantity"].get().strip())
                min_quantity = int(fields["min_quantity"].get().strip())
                expiry_date = fields["expiry_date"].get().strip()
                category = fields["category"].get().strip()
                
                if not name or not category:
                    messagebox.showerror("Input Error", "Name and category are required!")
                    return
                
                if price <= 0:
                    messagebox.showerror("Input Error", "Price must be greater than 0!")
                    return
                
                if quantity < 0:
                    messagebox.showerror("Input Error", "Quantity cannot be negative!")
                    return
                
                if min_quantity < 0:
                    messagebox.showerror("Input Error", "Record level cannot be negative!")
                    return
                
                # Validate expiry date format if provided
                if expiry_date:
                    try:
                        datetime.strptime(expiry_date, '%Y-%m-%d')
                    except ValueError:
                        messagebox.showerror("Input Error", "Invalid expiry date format! Use YYYY-MM-DD")
                        return
                
                connection = self.get_db_connection()
                if not connection:
                    return
                
                try:
                    with connection.cursor() as cursor:
                        # Get category ID
                        category_id = category_options[category]
                        
                        # Insert product with expiry date
                        cursor.execute(
                            "INSERT INTO products (name, unit_price, category_id, expiry_date) VALUES (%s, %s, %s, %s)",
                            (name, price, category_id, expiry_date if expiry_date else None)
                        )
                        product_id = cursor.lastrowid
                        
                        # Insert stock with min_quantity
                        cursor.execute(
                            "INSERT INTO stock (product_id, quantity, min_quantity) VALUES (%s, %s, %s)",
                            (product_id, quantity, min_quantity)
                        )
                        
                        connection.commit()
                        messagebox.showinfo("Success", "Product added successfully!")
                        dialog.destroy()
                        self.refresh_products()
                except pymysql.Error as e:
                    messagebox.showerror("Database Error", f"Error adding product: {e}")
                finally:
                    connection.close()
            except ValueError:
                messagebox.showerror("Input Error", "Please enter valid numeric values for price, quantity, and record level!")
        
        def cancel():
            dialog.destroy()
        
        # Buttons with colors
        save_button = ctk.CTkButton(buttons_frame, text="Save", command=save_product,
                                   fg_color="#43A047", hover_color="#2E7D32")  # Green
        save_button.pack(side="right", padx=5)
        
        cancel_button = ctk.CTkButton(buttons_frame, text="Cancel", command=cancel,
                                    fg_color="#E53935", hover_color="#C62828")  # Red
        cancel_button.pack(side="right", padx=5)

    def update_product(self):
        selected_item = self.tree.selection()
        if not selected_item:
            messagebox.showwarning("Selection Error", "Please select a product to update!")
            return
        
        product_data = self.tree.item(selected_item[0])["values"]
        product_id = product_data[0]
        
        dialog = ctk.CTkToplevel(self)
        dialog.title("Update Product")
        dialog.geometry("400x450")  # Increased height to accommodate expiry date
        dialog.transient(self.container_frame)
        
        # Get current product details from database
        connection = self.get_db_connection()
        if not connection:
            return
        
        try:
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT p.*, c.name as category_name, s.quantity, s.min_quantity 
                    FROM products p
                    LEFT JOIN categories c ON p.category_id = c.id
                    LEFT JOIN stock s ON p.id = s.product_id
                    WHERE p.id = %s
                """, (product_id,))
                product = cursor.fetchone()
                
                if not product:
                    messagebox.showerror("Error", "Product not found!")
                    return
                
                # Main container with padding
                main_frame = ctk.CTkFrame(dialog)
                main_frame.pack(fill="both", expand=True, padx=20, pady=20)
                
                # Title
                title_label = ctk.CTkLabel(main_frame, text="Update Product", 
                                          font=ctk.CTkFont(size=16, weight="bold"))
                title_label.pack(pady=(0, 15))
                
                # Form fields
                fields = {}
                
                # Product Name field
                name_frame = ctk.CTkFrame(main_frame)
                name_frame.pack(fill="x", pady=5)
                ctk.CTkLabel(name_frame, text="Product Name:", width=120).pack(side="left", padx=(0, 10))
                name_entry = ctk.CTkEntry(name_frame)
                name_entry.insert(0, product['name'])
                name_entry.pack(side="left", fill="x", expand=True)
                fields["name"] = name_entry
                
                # Product Number field (auto-generated)
                number_frame = ctk.CTkFrame(main_frame)
                number_frame.pack(fill="x", pady=5)
                ctk.CTkLabel(number_frame, text="Product Number:", width=120).pack(side="left", padx=(0, 10))
                number_label = ctk.CTkLabel(number_frame, text=f"PROD-{product['id']:05d}", text_color="gray")
                number_label.pack(side="left", fill="x", expand=True)
                fields["product_number"] = number_label
                
                # Unit Price field
                price_frame = ctk.CTkFrame(main_frame)
                price_frame.pack(fill="x", pady=5)
                ctk.CTkLabel(price_frame, text="Unit Price:", width=120).pack(side="left", padx=(0, 10))
                price_entry = ctk.CTkEntry(price_frame)
                price_entry.insert(0, str(product['unit_price']))
                price_entry.pack(side="left", fill="x", expand=True)
                fields["price"] = price_entry
                
                # Quantity field
                quantity_frame = ctk.CTkFrame(main_frame)
                quantity_frame.pack(fill="x", pady=5)
                ctk.CTkLabel(quantity_frame, text="Quantity:", width=120).pack(side="left", padx=(0, 10))
                quantity_entry = ctk.CTkEntry(quantity_frame)
                quantity_entry.insert(0, str(product['quantity']))
                quantity_entry.pack(side="left", fill="x", expand=True)
                fields["quantity"] = quantity_entry
                
                # Record Level field
                min_stock_frame = ctk.CTkFrame(main_frame)
                min_stock_frame.pack(fill="x", pady=5)
                ctk.CTkLabel(min_stock_frame, text="Record Level:", width=120).pack(side="left", padx=(0, 10))
                min_stock_entry = ctk.CTkEntry(min_stock_frame)
                min_stock_entry.insert(0, str(product['min_quantity']))
                min_stock_entry.pack(side="left", fill="x", expand=True)
                fields["min_quantity"] = min_stock_entry
                
                # Expiry Date field
                expiry_frame = ctk.CTkFrame(main_frame)
                expiry_frame.pack(fill="x", pady=5)
                ctk.CTkLabel(expiry_frame, text="Expiry Date:", width=120).pack(side="left", padx=(0, 10))
                expiry_entry = ctk.CTkEntry(expiry_frame, placeholder_text="YYYY-MM-DD")
                if product['expiry_date']:
                    expiry_entry.insert(0, product['expiry_date'].strftime('%Y-%m-%d'))
                expiry_entry.pack(side="left", fill="x", expand=True)
                fields["expiry_date"] = expiry_entry
                
                # Status field (calculated)
                status_frame = ctk.CTkFrame(main_frame)
                status_frame.pack(fill="x", pady=5)
                ctk.CTkLabel(status_frame, text="Status:", width=120).pack(side="left", padx=(0, 10))
                
                # Determine current status
                current_stock = product['quantity'] if product['quantity'] else 0
                min_stock = product['min_quantity'] if product['min_quantity'] else 10
                status_text = "Out of Stock"
                status_color = "red"
                if current_stock > 0:
                    if current_stock <= min_stock:
                        status_text = "Low Stock"
                        status_color = "orange"
                    else:
                        status_text = "In Stock"
                        status_color = "green"
                
                status_label = ctk.CTkLabel(status_frame, text=status_text, text_color=status_color)
                status_label.pack(side="left", fill="x", expand=True)
                fields["status"] = status_label
                
                # Category field
                category_frame = ctk.CTkFrame(main_frame)
                category_frame.pack(fill="x", pady=5)
                ctk.CTkLabel(category_frame, text="Category:", width=120).pack(side="left", padx=(0, 10))
                
                # Get categories for dropdown
                categories = self.get_categories()
                category_options = {cat['name']: cat['id'] for cat in categories}
                
                category_var = tk.StringVar(value=product['category_name'])
                category_dropdown = ctk.CTkOptionMenu(category_frame, variable=category_var, values=list(category_options.keys()))
                category_dropdown.pack(side="left", fill="x", expand=True)
                fields["category"] = category_var
                
                # Update status when quantity or min_stock changes
                def update_status(*args):
                    try:
                        quantity = int(quantity_entry.get() or 0)
                        min_stock = int(min_stock_entry.get() or 10)
                        
                        if quantity <= 0:
                            status_label.configure(text="Out of Stock", text_color="red")
                        elif quantity <= min_stock:
                            status_label.configure(text="Low Stock", text_color="orange")
                        else:
                            status_label.configure(text="In Stock", text_color="green")
                    except ValueError:
                        status_label.configure(text="In Stock", text_color="green")
                
                quantity_entry.bind("<KeyRelease>", update_status)
                min_stock_entry.bind("<KeyRelease>", update_status)
                
                # Buttons frame
                buttons_frame = ctk.CTkFrame(main_frame)
                buttons_frame.pack(fill="x", pady=(15, 0))
                
                def save_update():
                    try:
                        name = fields["name"].get().strip()
                        price = float(fields["price"].get().strip())
                        quantity = int(fields["quantity"].get().strip())
                        min_quantity = int(fields["min_quantity"].get().strip())
                        expiry_date = fields["expiry_date"].get().strip()
                        category = fields["category"].get().strip()
                        
                        if not name or not category:
                            messagebox.showerror("Input Error", "Name and category are required!")
                            return
                        
                        if price <= 0:
                            messagebox.showerror("Input Error", "Price must be greater than 0!")
                            return
                        
                        if quantity < 0:
                            messagebox.showerror("Input Error", "Quantity cannot be negative!")
                            return
                        
                        if min_quantity < 0:
                            messagebox.showerror("Input Error", "Record level cannot be negative!")
                            return
                        
                        # Validate expiry date format if provided
                        if expiry_date:
                            try:
                                datetime.strptime(expiry_date, '%Y-%m-%d')
                            except ValueError:
                                messagebox.showerror("Input Error", "Invalid expiry date format! Use YYYY-MM-DD")
                                return
                        
                        connection = self.get_db_connection()
                        if not connection:
                            return
                        
                        try:
                            with connection.cursor() as cursor:
                                # Get category ID
                                category_id = category_options[category]
                                
                                # Update product with expiry date
                                cursor.execute(
                                    "UPDATE products SET name=%s, unit_price=%s, category_id=%s, expiry_date=%s WHERE id=%s",
                                    (name, price, category_id, expiry_date if expiry_date else None, product_id)
                                )
                                
                                # Update stock with min_quantity
                                cursor.execute(
                                    "UPDATE stock SET quantity=%s, min_quantity=%s WHERE product_id=%s",
                                    (quantity, min_quantity, product_id)
                                )
                                
                                connection.commit()
                                messagebox.showinfo("Success", "Product updated successfully!")
                                dialog.destroy()
                                self.refresh_products()
                        except pymysql.Error as e:
                            messagebox.showerror("Database Error", f"Error updating product: {e}")
                        finally:
                            connection.close()
                    except ValueError:
                        messagebox.showerror("Input Error", "Please enter valid numeric values for price, quantity, and record level!")
                
                def cancel():
                    dialog.destroy()
                
                # Buttons with colors
                save_button = ctk.CTkButton(buttons_frame, text="Save", command=save_update,
                                           fg_color="#FB8C00", hover_color="#EF6C00")  # Orange
                save_button.pack(side="right", padx=5)
                
                cancel_button = ctk.CTkButton(buttons_frame, text="Cancel", command=cancel,
                                            fg_color="#E53935", hover_color="#C62828")  # Red
                cancel_button.pack(side="right", padx=5)
                
        except pymysql.Error as e:
            messagebox.showerror("Database Error", f"Error fetching product details: {e}")
        finally:
            connection.close()

    def delete_product(self):
        """Delete selected product"""
        selected_item = self.tree.selection()
        if not selected_item:
            messagebox.showwarning("Selection Error", "Please select a product to delete!")
            return
        
        product_id = self.tree.item(selected_item[0])["values"][0]
        
        if not messagebox.askyesno("Confirm Deletion", "Are you sure you want to delete this product?"):
            return
        
        connection = self.get_db_connection()
        if not connection:
            return
        
        try:
            with connection.cursor() as cursor:
                # Delete from stock first (due to foreign key constraint)
                cursor.execute("DELETE FROM stock WHERE product_id=%s", (product_id,))
                # Then delete product
                cursor.execute("DELETE FROM products WHERE id=%s", (product_id,))
                connection.commit()
                messagebox.showinfo("Success", "Product deleted successfully!")
                self.refresh_products()
        except pymysql.Error as e:
            messagebox.showerror("Database Error", f"Error deleting product: {e}")
        finally:
            connection.close()

    def get_categories(self):
        """Get all categories from database for dropdown"""
        connection = self.get_db_connection()
        if not connection:
            return []
        
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT id, name FROM categories ORDER BY name")
                return cursor.fetchall()
        except pymysql.Error as e:
            messagebox.showerror("Database Error", f"Error fetching categories: {e}")
            return []
        finally:
            connection.close()

    def search_products(self):
        """Filter products by name"""
        search_term = self.search_entry.get().strip()
        if not search_term:
            self.refresh_products()
            return
        
        # Clear existing items
        for item in self.tree.get_children():
            self.tree.delete(item)
        
        connection = self.get_db_connection()
        if not connection:
            return
        
        try:
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT p.*, c.name as category_name, s.quantity, s.min_quantity 
                    FROM products p
                    LEFT JOIN categories c ON p.category_id = c.id
                    LEFT JOIN stock s ON p.id = s.product_id
                    WHERE p.name LIKE %s
                """, (f"%{search_term}%",))
                products = cursor.fetchall()
                
                for product in products:
                    # Determine stock status
                    current_stock = product['quantity'] if product['quantity'] else 0
                    min_stock = product['min_quantity'] if product['min_quantity'] else 10
                    status = validate_stock_level(current_stock, min_stock)
                    
                    # Format expiry date
                    expiry_date = product.get('expiry_date')
                    expiry_str = expiry_date.strftime('%Y-%m-%d') if expiry_date else "N/A"
                    
                    self.tree.insert("", "end", values=(
                        product['id'],
                        product['name'],
                        f"PROD-{product['id']:05d}",
                        product['unit_price'],
                        current_stock,
                        min_stock,
                        status.replace('_', ' ').title(),
                        product['category_name'],
                        expiry_str
                    ))
        except pymysql.Error as e:
            messagebox.showerror("Database Error", f"Error searching products: {e}")
        finally:
            connection.close()
