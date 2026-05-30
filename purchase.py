# --- purchase.py ---
import customtkinter as ctk
import tkinter as tk
from tkinter import ttk, messagebox
import pymysql
from datetime import datetime
from utils import format_currency


class PurchaseWindow(ctk.CTkFrame):
    def __init__(self, parent_frame, user_data):
        super().__init__(parent_frame)
        self.user_data = user_data
        
        # Create a container frame inside parent_frame
        self.container = ctk.CTkFrame(parent_frame)
        self.container.grid(row=0, column=0, sticky="nsew")
        
        # Configure grid weights for parent frame
        parent_frame.grid_rowconfigure(0, weight=1)
        parent_frame.grid_columnconfigure(0, weight=1)
        
        # Title Label
        self.title_label = ctk.CTkLabel(self.container, text="Purchase Management", 
                                      font=ctk.CTkFont(size=20, weight="bold"))
        self.title_label.pack(pady=(10, 10))
        
        # Search Frame
        self.search_frame = ctk.CTkFrame(self.container)
        self.search_frame.pack(fill="x", padx=10, pady=(0, 10))
        
        self.search_entry = ctk.CTkEntry(self.search_frame, placeholder_text="Search purchases...")
        self.search_entry.pack(side="left", fill="x", expand=True, padx=(0, 5))
        
        self.search_button = ctk.CTkButton(self.search_frame, text="Search", command=self.search_purchases,
                                        fg_color="#1E88E5", hover_color="#1565C0")  # Blue
        self.search_button.pack(side="left", padx=5)
        
        # Buttons Frame
        self.buttons_frame = ctk.CTkFrame(self.container)
        self.buttons_frame.pack(fill="x", padx=10, pady=(0, 10))
        
        self.add_button = ctk.CTkButton(self.buttons_frame, text="Add", command=self.add_purchase,
                                      fg_color="#43A047", hover_color="#2E7D32")  # Green
        self.add_button.pack(side="left", padx=5)
        
        self.update_button = ctk.CTkButton(self.buttons_frame, text="Update", command=self.update_purchase,
                                        fg_color="#FB8C00", hover_color="#EF6C00")  # Orange
        self.update_button.pack(side="left", padx=5)
        
        self.delete_button = ctk.CTkButton(self.buttons_frame, text="Delete", command=self.delete_purchase,
                                        fg_color="#E53935", hover_color="#C62828")  # Red
        self.delete_button.pack(side="left", padx=5)
        
        self.refresh_button = ctk.CTkButton(self.buttons_frame, text="Refresh", command=self.refresh_purchases,
                                          fg_color="#8E24AA", hover_color="#6A1B9A")  # Purple
        self.refresh_button.pack(side="left", padx=5)
        
        # Treeview Frame
        self.tree_frame = ctk.CTkFrame(self.container)
        self.tree_frame.pack(fill="both", expand=True, padx=10, pady=(0, 10))
        
        # Create Treeview
        self.tree = ttk.Treeview(self.tree_frame, columns=("ID", "Product Name", "Quantity", "Total Amount", "Date"), show="headings")
        self.tree.pack(fill="both", expand=True)
        
        # Define headings
        self.tree.heading("ID", text="ID")
        self.tree.heading("Product Name", text="Product Name")
        self.tree.heading("Quantity", text="Quantity")
        self.tree.heading("Total Amount", text="Total Amount")
        self.tree.heading("Date", text="Date")
        
        # Configure column widths
        self.tree.column("ID", width=50)
        self.tree.column("Product Name", width=150)
        self.tree.column("Quantity", width=100)
        self.tree.column("Total Amount", width=100)
        self.tree.column("Date", width=150)
        
        # Scrollbar
        scrollbar = ttk.Scrollbar(self.tree_frame, orient="vertical", command=self.tree.yview)
        scrollbar.pack(side="right", fill="y")
        self.tree.configure(yscrollcommand=scrollbar.set)
        
        # Bind events
        self.tree.bind("<Double-1>", lambda e: self.view_purchase_details())
        self.tree.bind("<Button-3>", self.show_context_menu)
        
        # Load initial data
        self.refresh_purchases()

    def show_context_menu(self, event):
        """Display right-click context menu"""
        # Select item on right click
        item = self.tree.identify_row(event.y)
        if item:
            self.tree.selection_set(item)
            
            # Create menu
            menu = tk.Menu(self, tearoff=0)
            menu.add_command(label="View Purchase Details", command=self.view_purchase_details)
            menu.add_command(label="Edit Purchase", command=self.update_purchase)
            menu.add_command(label="Delete Purchase", command=self.delete_purchase)
            menu.add_separator()
            menu.add_command(label="Refresh List", command=self.refresh_purchases)
            
            # Show menu
            menu.post(event.x_root, event.y_root)

    def view_purchase_details(self):
        """View purchase details in a read-only window"""
        selected = self.tree.selection()
        if not selected:
            return
            
        pur_id = self.tree.item(selected[0])["values"][0]
        
        connection = self.get_db_connection()
        if not connection:
            return
            
        try:
            with connection.cursor(pymysql.cursors.DictCursor) as cursor:
                cursor.execute("""
                    SELECT pu.*, p.name as product_name, s.name as supplier_name 
                    FROM purchases pu
                    LEFT JOIN products p ON pu.product_id = p.id
                    LEFT JOIN suppliers s ON pu.supplier_id = s.id
                    WHERE pu.id = %s
                """, (pur_id,))
                p = cursor.fetchone()
                
            if not p:
                messagebox.showerror("Error", "Purchase record not found")
                return
                
            dialog = ctk.CTkToplevel(self)
            dialog.title("Purchase Details")
            dialog.geometry("450x500")
            dialog.transient(self)
            dialog.grab_set()
            
            main_frame = ctk.CTkFrame(dialog)
            main_frame.pack(fill="both", expand=True, padx=20, pady=20)
            
            ctk.CTkLabel(main_frame, text="🛒 Purchase Information", font=ctk.CTkFont(size=20, weight="bold")).pack(pady=(0, 20))
            
            def add_detail(label, value):
                f = ctk.CTkFrame(main_frame, fg_color="transparent")
                f.pack(fill="x", pady=5)
                ctk.CTkLabel(f, text=label, width=150, anchor="w", font=ctk.CTkFont(weight="bold")).pack(side="left")
                ctk.CTkLabel(f, text=str(value), anchor="w").pack(side="left", fill="x", expand=True)

            from utils import format_currency
            add_detail("Purchase ID:", f"PUR-{p['id']:05d}")
            add_detail("Product:", p['product_name'] or "N/A")
            add_detail("Supplier:", p['supplier_name'] or "N/A")
            add_detail("Quantity:", p['quantity'])
            add_detail("Unit Price:", format_currency(p['unit_cost']))
            add_detail("Total Cost:", format_currency(p['total_cost']))
            add_detail("Date:", p['purchase_date'])
            
            # Action Buttons
            btn_frame = ctk.CTkFrame(main_frame, fg_color="transparent")
            btn_frame.pack(fill="x", pady=(30, 0))
            
            ctk.CTkButton(btn_frame, text="Edit Purchase", command=lambda: [dialog.destroy(), self.update_purchase()], fg_color="orange").pack(side="left", padx=10, fill="x", expand=True)
            ctk.CTkButton(btn_frame, text="Close", command=dialog.destroy).pack(side="left", padx=10, fill="x", expand=True)

        except Exception as e:
            messagebox.showerror("Error", str(e))
        finally:
            connection.close()

    def get_db_connection(self):
        """Create and return a database connection"""
        try:
            connection = pymysql.connect(
                host='localhost',
                user='root',
                password='Trovegs35',
                database='inventory_db'
            )
            return connection
        except pymysql.Error as e:
            messagebox.showerror("Database Error", f"Error connecting to database: {e}")
            return None
    
    def refresh_purchases(self):
        """Load all purchases from database into treeview"""
        # Clear existing items
        for item in self.tree.get_children():
            self.tree.delete(item)
        
        connection = self.get_db_connection()
        if not connection:
            return
            
        try:
            with connection.cursor() as cursor:
                # Query to get purchases with product names
                cursor.execute("""
                    SELECT p.id, pr.name, p.quantity, p.total_amount, p.date 
                    FROM purchases p
                    JOIN products pr ON p.product_id = pr.id
                    ORDER BY p.date DESC
                """)
                purchases = cursor.fetchall()
                
                for purchase in purchases:
                    # Format date for display
                    formatted_date = purchase[4].strftime("%Y-%m-%d %H:%M") if purchase[4] else ""
                    self.tree.insert("", "end", values=(purchase[0], purchase[1], purchase[2], format_currency(purchase[3]), formatted_date))
        except pymysql.Error as e:
            messagebox.showerror("Database Error", f"Error fetching purchases: {e}")
        finally:
            connection.close()
    
    def search_purchases(self):
        """Filter purchases by product name"""
        search_term = self.search_entry.get().strip()
        if not search_term:
            self.refresh_purchases()
            return
            
        # Clear existing items
        for item in self.tree.get_children():
            self.tree.delete(item)
        
        connection = self.get_db_connection()
        if not connection:
            return
            
        try:
            with connection.cursor() as cursor:
                # Use parameterized query to prevent SQL injection
                cursor.execute("""
                    SELECT p.id, pr.name, p.quantity, p.total_amount, p.date 
                    FROM purchases p
                    JOIN products pr ON p.product_id = pr.id
                    WHERE pr.name LIKE %s
                    ORDER BY p.date DESC
                """, (f"%{search_term}%",))
                purchases = cursor.fetchall()
                
                for purchase in purchases:
                    # Format date for display
                    formatted_date = purchase[4].strftime("%Y-%m-%d %H:%M") if purchase[4] else ""
                    self.tree.insert("", "end", values=(purchase[0], purchase[1], purchase[2], format_currency(purchase[3]), formatted_date))
        except pymysql.Error as e:
            messagebox.showerror("Database Error", f"Error searching purchases: {e}")
        finally:
            connection.close()
    
    def get_products(self):
        """Get all products from database for dropdown"""
        connection = self.get_db_connection()
        if not connection:
            return []
            
        try:
            with connection.cursor() as cursor:
                # Query to get products with their stock quantities
                cursor.execute("""
                    SELECT p.id, p.name, p.unit_price, COALESCE(s.quantity, 0) as quantity 
                    FROM products p
                    LEFT JOIN stock s ON p.id = s.product_id
                """)
                return cursor.fetchall()
        except pymysql.Error as e:
            messagebox.showerror("Database Error", f"Error fetching products: {e}")
            return []
        finally:
            connection.close()
    
    def get_suppliers(self):
        """Get all suppliers from database for dropdown"""
        connection = self.get_db_connection()
        if not connection:
            return []
            
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT id, name FROM suppliers WHERE status = 'active'")
                return cursor.fetchall()
        except pymysql.Error as e:
            messagebox.showerror("Database Error", f"Error fetching suppliers: {e}")
            return []
        finally:
            connection.close()
    
    def add_purchase(self):
        """Open dialog to add a new purchase"""
        dialog = ctk.CTkToplevel(self.container)
        dialog.title("Add Purchase")
        dialog.geometry("450x350")
        dialog.transient(self.container)  # Set to be on top of the main window
        dialog.grab_set()  # Make modal
        
        # Center the dialog
        dialog.update()
        width = dialog.winfo_width()
        height = dialog.winfo_height()
        x = (dialog.winfo_screenwidth() // 2) - (width // 2)
        y = (dialog.winfo_screenheight() // 2) - (height // 2)
        dialog.geometry(f"{width}x{height}+{x}+{y}")
        
        # Main container with padding
        main_frame = ctk.CTkFrame(dialog)
        main_frame.pack(fill="both", expand=True, padx=20, pady=20)
        
        # Title
        title_label = ctk.CTkLabel(main_frame, text="Add New Purchase", 
                                  font=ctk.CTkFont(size=16, weight="bold"))
        title_label.pack(pady=(0, 15))
        
        # Get products for dropdown
        products = self.get_products()
        product_options = {f"{p[1]} (Stock: {p[3]}, Price: {format_currency(p[2])})": p[0] for p in products}

        # Get suppliers for dropdown
        suppliers = self.get_suppliers()
        supplier_options = {s[1]: s[0] for s in suppliers}
        
        # Form fields
        fields = {}
        
        # Product selection
        product_frame = ctk.CTkFrame(main_frame)
        product_frame.pack(fill="x", pady=5)
        ctk.CTkLabel(product_frame, text="Product:", width=100).pack(side="left", padx=(0, 10))
        product_var = tk.StringVar()
        product_dropdown = ctk.CTkOptionMenu(product_frame, variable=product_var, values=list(product_options.keys()))
        product_dropdown.pack(side="left", fill="x", expand=True)
        fields["product"] = (product_var, product_options)

        # Supplier selection
        supplier_frame = ctk.CTkFrame(main_frame)
        supplier_frame.pack(fill="x", pady=5)
        ctk.CTkLabel(supplier_frame, text="Supplier:", width=100).pack(side="left", padx=(0, 10))
        supplier_var = tk.StringVar()
        supplier_dropdown = ctk.CTkOptionMenu(supplier_frame, variable=supplier_var, values=list(supplier_options.keys()))
        supplier_dropdown.pack(side="left", fill="x", expand=True)
        fields["supplier"] = (supplier_var, supplier_options)
        
        # Quantity field
        quantity_frame = ctk.CTkFrame(main_frame)
        quantity_frame.pack(fill="x", pady=5)
        ctk.CTkLabel(quantity_frame, text="Quantity:", width=100).pack(side="left", padx=(0, 10))
        quantity_entry = ctk.CTkEntry(quantity_frame)
        quantity_entry.pack(side="left", fill="x", expand=True)
        fields["quantity"] = quantity_entry
        
        # Unit price field
        price_frame = ctk.CTkFrame(main_frame)
        price_frame.pack(fill="x", pady=5)
        ctk.CTkLabel(price_frame, text="Unit Price:", width=100).pack(side="left", padx=(0, 10))
        price_entry = ctk.CTkEntry(price_frame)
        price_entry.pack(side="left", fill="x", expand=True)
        fields["price"] = price_entry
        
        # Total amount (calculated)
        total_frame = ctk.CTkFrame(main_frame)
        total_frame.pack(fill="x", pady=5)
        ctk.CTkLabel(total_frame, text="Total Amount:", width=100).pack(side="left", padx=(0, 10))
        total_label = ctk.CTkLabel(total_frame, text=format_currency(0))
        total_label.pack(side="left", fill="x", expand=True)
        fields["total"] = total_label
        
        # Update total when quantity or price changes
        def update_total(*args):
            try:
                quantity = int(quantity_entry.get() or 0)
                price = float(price_entry.get() or 0)
                total = quantity * price
                total_label.configure(text=format_currency(total))
            except ValueError:
                total_label.configure(text=format_currency(0))
        
        quantity_entry.bind("<KeyRelease>", lambda e: update_total())
        price_entry.bind("<KeyRelease>", lambda e: update_total())
        
        # Update price when product changes
        def update_price(*args):
            product_key = product_var.get()
            if product_key in product_options:
                product_id = product_options[product_key]
                product = next((p for p in products if p[0] == product_id), None)
                if product:
                    price_entry.delete(0, tk.END)
                    price_entry.insert(0, str(product[2]))
                    update_total()
        
        product_var.trace_add("write", update_price)
        
        # Buttons frame
        buttons_frame = ctk.CTkFrame(main_frame)
        buttons_frame.pack(fill="x", pady=(15, 0))
        
        def save_purchase():
            try:
                # Get values from form
                product_key = product_var.get()
                supplier_key = supplier_var.get()
                if not product_key or not supplier_key:
                    messagebox.showerror("Input Error", "Please select a product and supplier!")
                    return
                    
                product_id = product_options[product_key]
                supplier_id = supplier_options[supplier_key]
                quantity = int(quantity_entry.get().strip())
                price = float(price_entry.get().strip())
                
                if quantity <= 0:
                    messagebox.showerror("Input Error", "Quantity must be greater than 0!")
                    return
                
                if price <= 0:
                    messagebox.showerror("Input Error", "Price must be greater than 0!")
                    return
                
                # Calculate total amount
                total_amount = quantity * price
                purchase_number = f"PUR-{datetime.now().strftime('%Y%m%d%H%M%S')}"
                
                connection = self.get_db_connection()
                if not connection:
                    return
                
                try:
                    with connection.cursor() as cursor:
                        # Insert purchase record - include product_id, supplier_id, purchase_number
                        cursor.execute(
                            "INSERT INTO purchases (purchase_number, supplier_id, product_id, quantity, unit_cost, total_amount, date) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                            (purchase_number, supplier_id, product_id, quantity, price, total_amount, datetime.now())
                        )
                        
                        # Update product quantity in stock
                        cursor.execute(
                            "UPDATE stock SET quantity = quantity + %s WHERE product_id = %s",
                            (quantity, product_id)
                        )
                        
                        connection.commit()
                        messagebox.showinfo("Success", "Purchase added successfully!")
                        dialog.destroy()
                        self.refresh_purchases()
                except pymysql.Error as e:
                    messagebox.showerror("Database Error", f"Error adding purchase: {e}")
                finally:
                    connection.close()
            except ValueError:
                messagebox.showerror("Input Error", "Please enter valid quantity and price!")
        
        def cancel():
            dialog.destroy()
        
        # Buttons with colors
        save_button = ctk.CTkButton(buttons_frame, text="Save", command=save_purchase,
                                   fg_color="#43A047", hover_color="#2E7D32")  # Green
        save_button.pack(side="right", padx=5)
        
        cancel_button = ctk.CTkButton(buttons_frame, text="Cancel", command=cancel,
                                    fg_color="#E53935", hover_color="#C62828")  # Red
        cancel_button.pack(side="right", padx=5)
    
    def update_purchase(self):
        """Update selected purchase"""
        selected_item = self.tree.selection()
        if not selected_item:
            messagebox.showwarning("Selection Error", "Please select a purchase to update!")
            return
        
        # Get selected purchase data
        purchase_id = self.tree.item(selected_item[0])["values"][0]
        
        # Get purchase details from database
        connection = self.get_db_connection()
        if not connection:
            return
            
        try:
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT p.id, p.product_id, pr.name, p.quantity, p.total_amount, p.date, pr.unit_price
                    FROM purchases p
                    JOIN products pr ON p.product_id = pr.id
                    WHERE p.id = %s
                """, (purchase_id,))
                purchase_data = cursor.fetchone()
                
                if not purchase_data:
                    messagebox.showerror("Data Error", "Purchase not found!")
                    return
        except pymysql.Error as e:
            messagebox.showerror("Database Error", f"Error fetching purchase details: {e}")
            connection.close()
            return
        finally:
            connection.close()
        
        dialog = ctk.CTkToplevel(self.container)
        dialog.title("Update Purchase")
        dialog.geometry("450x350")
        dialog.transient(self.container)  # Set to be on top of the main window
        dialog.grab_set()  # Make modal
        
        # Center the dialog
        dialog.update()
        width = dialog.winfo_width()
        height = dialog.winfo_height()
        x = (dialog.winfo_screenwidth() // 2) - (width // 2)
        y = (dialog.winfo_screenheight() // 2) - (height // 2)
        dialog.geometry(f"{width}x{height}+{x}+{y}")
        
        # Main container with padding
        main_frame = ctk.CTkFrame(dialog)
        main_frame.pack(fill="both", expand=True, padx=20, pady=20)
        
        # Title
        title_label = ctk.CTkLabel(main_frame, text="Update Purchase", 
                                  font=ctk.CTkFont(size=16, weight="bold"))
        title_label.pack(pady=(0, 15))
        
        # Get products for dropdown
        products = self.get_products()
        product_options = {f"{p[1]} (Stock: {p[3]}, Price: {format_currency(p[2])})": p[0] for p in products}
        
        # Form fields
        fields = {}
        
        # Product selection
        product_frame = ctk.CTkFrame(main_frame)
        product_frame.pack(fill="x", pady=5)
        ctk.CTkLabel(product_frame, text="Product:", width=100).pack(side="left", padx=(0, 10))
        
        # Find current product key
        current_product_key = next((k for k, v in product_options.items() if v == purchase_data[1]), "")
        product_var = tk.StringVar(value=current_product_key)
        product_dropdown = ctk.CTkOptionMenu(product_frame, variable=product_var, values=list(product_options.keys()))
        product_dropdown.pack(side="left", fill="x", expand=True)
        fields["product"] = (product_var, product_options)
        
        # Quantity field
        quantity_frame = ctk.CTkFrame(main_frame)
        quantity_frame.pack(fill="x", pady=5)
        ctk.CTkLabel(quantity_frame, text="Quantity:", width=100).pack(side="left", padx=(0, 10))
        quantity_entry = ctk.CTkEntry(quantity_frame)
        quantity_entry.insert(0, str(purchase_data[3]))
        quantity_entry.pack(side="left", fill="x", expand=True)
        fields["quantity"] = quantity_entry
        
        # Unit price field
        price_frame = ctk.CTkFrame(main_frame)
        price_frame.pack(fill="x", pady=5)
        ctk.CTkLabel(price_frame, text="Unit Price:", width=100).pack(side="left", padx=(0, 10))
        price_entry = ctk.CTkEntry(price_frame)
        price_entry.insert(0, str(purchase_data[6]))  # Use original product price
        price_entry.pack(side="left", fill="x", expand=True)
        fields["price"] = price_entry
        
        # Total amount (calculated)
        total_frame = ctk.CTkFrame(main_frame)
        total_frame.pack(fill="x", pady=5)
        ctk.CTkLabel(total_frame, text="Total Amount:", width=100).pack(side="left", padx=(0, 10))
        total_label = ctk.CTkLabel(total_frame, text=format_currency(purchase_data[4]))
        total_label.pack(side="left", fill="x", expand=True)
        fields["total"] = total_label
        
        # Store original values for inventory adjustment
        original_quantity = purchase_data[3]
        original_product_id = purchase_data[1]
        original_price = purchase_data[6]
        
        # Update total when quantity or price changes
        def update_total(*args):
            try:
                quantity = int(quantity_entry.get() or 0)
                price = float(price_entry.get() or 0)
                total = quantity * price
                total_label.configure(text=format_currency(total))
            except ValueError:
                total_label.configure(text=format_currency(0))
        
        quantity_entry.bind("<KeyRelease>", lambda e: update_total())
        price_entry.bind("<KeyRelease>", lambda e: update_total())
        
        # Buttons frame
        buttons_frame = ctk.CTkFrame(main_frame)
        buttons_frame.pack(fill="x", pady=(15, 0))
        
        def save_update():
            try:
                # Get values from form
                product_key = product_var.get()
                if not product_key:
                    messagebox.showerror("Input Error", "Please select a product!")
                    return
                    
                product_id = product_options[product_key]
                quantity = int(quantity_entry.get().strip())
                price = float(price_entry.get().strip())
                
                if quantity <= 0:
                    messagebox.showerror("Input Error", "Quantity must be greater than 0!")
                    return
                
                if price <= 0:
                    messagebox.showerror("Input Error", "Price must be greater than 0!")
                    return
                
                # Calculate total amount
                total_amount = quantity * price
                
                connection = self.get_db_connection()
                if not connection:
                    return
                
                try:
                    with connection.cursor() as cursor:
                        # Update purchase record - include product_id column
                        cursor.execute(
                            "UPDATE purchases SET product_id=%s, quantity=%s, total_amount=%s WHERE id=%s",
                            (product_id, quantity, total_amount, purchase_id)
                        )
                        
                        # Adjust inventory based on product change and quantity change
                        if product_id != original_product_id:
                            # Subtract original quantity from old product
                            cursor.execute(
                                "UPDATE stock SET quantity = quantity - %s WHERE product_id = %s",
                                (original_quantity, original_product_id)
                            )
                            # Add new quantity to new product
                            cursor.execute(
                                "UPDATE stock SET quantity = quantity + %s WHERE product_id = %s",
                                (quantity, product_id)
                            )
                        else:
                            # Same product, just adjust quantity difference
                            quantity_diff = quantity - original_quantity
                            cursor.execute(
                                "UPDATE stock SET quantity = quantity + %s WHERE product_id = %s",
                                (quantity_diff, product_id)
                            )
                        
                        connection.commit()
                        messagebox.showinfo("Success", "Purchase updated successfully!")
                        dialog.destroy()
                        self.refresh_purchases()
                except pymysql.Error as e:
                    messagebox.showerror("Database Error", f"Error updating purchase: {e}")
                finally:
                    connection.close()
            except ValueError:
                messagebox.showerror("Input Error", "Please enter valid quantity and price!")
        
        def cancel():
            dialog.destroy()
        
        # Buttons with colors
        save_button = ctk.CTkButton(buttons_frame, text="Save", command=save_update,
                                   fg_color="#FB8C00", hover_color="#EF6C00")  # Orange
        save_button.pack(side="right", padx=5)
        
        cancel_button = ctk.CTkButton(buttons_frame, text="Cancel", command=cancel,
                                    fg_color="#E53935", hover_color="#C62828")  # Red
        cancel_button.pack(side="right", padx=5)
    
    def delete_purchase(self):
        """Delete selected purchase"""
        selected_item = self.tree.selection()
        if not selected_item:
            messagebox.showwarning("Selection Error", "Please select a purchase to delete!")
            return
        
        # Get selected purchase ID
        purchase_id = self.tree.item(selected_item[0])["values"][0]
        
        # Get purchase details for inventory adjustment
        connection = self.get_db_connection()
        if not connection:
            return
        
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT product_id, quantity FROM purchases WHERE id=%s", (purchase_id,))
                purchase_data = cursor.fetchone()
                
                if not purchase_data:
                    messagebox.showerror("Data Error", "Purchase not found!")
                    return
                
                product_id = purchase_data[0]
                quantity = purchase_data[1]
                
                # Confirm deletion
                if not messagebox.askyesno("Confirm Deletion", "Are you sure you want to delete this purchase?"):
                    return
                
                # Delete purchase and adjust inventory
                cursor.execute("DELETE FROM purchases WHERE id=%s", (purchase_id,))
                cursor.execute("UPDATE stock SET quantity = quantity - %s WHERE product_id = %s", (quantity, product_id))
                
                connection.commit()
                messagebox.showinfo("Success", "Purchase deleted successfully!")
                self.refresh_purchases()
        except pymysql.Error as e:
            messagebox.showerror("Database Error", f"Error deleting purchase: {e}")
        finally:
            connection.close()
