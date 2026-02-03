import customtkinter as ctk
import tkinter as tk
from tkinter import ttk, messagebox
import pymysql
from datetime import datetime, timedelta
from utils import format_currency  # This will need to be updated to format Leones

class SalesWindow(ctk.CTkFrame):
    def __init__(self, parent_frame, user_data, dashboard=None):
        super().__init__(parent_frame)
        self.user_data = user_data
        self.dashboard = dashboard  # Store reference to dashboard
        
        # Create a container frame inside parent_frame
        self.container = ctk.CTkFrame(parent_frame)
        self.container.grid(row=0, column=0, sticky="nsew")
        # Configure grid weights for parent frame
        parent_frame.grid_rowconfigure(0, weight=1)
        parent_frame.grid_columnconfigure(0, weight=1)
        # Title Label
        self.title_label = ctk.CTkLabel(self.container, text="Sales Management", 
                                      font=ctk.CTkFont(size=20, weight="bold"))
        self.title_label.pack(pady=(10, 10))

        # ... rest of the __init__ method remains the same ...


        # Search and Filter Frame
        self.search_frame = ctk.CTkFrame(self.container)
        self.search_frame.pack(fill="x", padx=10, pady=(0, 10))

        # Search Entry
        self.search_entry = ctk.CTkEntry(self.search_frame, placeholder_text="Search sales...")
        self.search_entry.pack(side="left", fill="x", expand=True, padx=(0, 5))
        
        # Search Button
        self.search_button = ctk.CTkButton(self.search_frame, text="Search", command=self.search_sales,
                                        fg_color="#1E88E5", hover_color="#1565C0")  # Blue
        self.search_button.pack(side="left", padx=5)
        
        # Date Filter Dropdown
        self.date_filter_var = ctk.StringVar(value="All Time")
        self.date_filter_dropdown = ctk.CTkOptionMenu(
            self.search_frame,
            variable=self.date_filter_var,
            values=["All Time", "Today", "Yesterday", "This Week", "Last Week", "This Month", "Last Month", "This Year", "Custom Range"],
            command=lambda _: self.refresh_sales()
        )
        self.date_filter_dropdown.pack(side="left", padx=5)
        
        # Buttons Frame
        self.buttons_frame = ctk.CTkFrame(self.container)
        self.buttons_frame.pack(fill="x", padx=10, pady=(0, 10))

        # Add Credit Management Button
        self.credit_button = ctk.CTkButton(
            self.buttons_frame, 
            text="Credit Management", 
            command=self.open_credit_window,
            fg_color="#7B1FA2",  # Purple
            hover_color="#6A1B9A"
        )
        self.credit_button.pack(side="left", padx=5)
        
        # Add Complete Sale on Credit Button
        self.complete_credit_button = ctk.CTkButton(
            self.buttons_frame, 
            text="Complete Sale on Credit", 
            command=self.complete_sale_on_credit,
            fg_color="#7B1FA2",  # Purple
            hover_color="#6A1B9A"
        )
        self.complete_credit_button.pack(side="left", padx=5)

        self.add_button = ctk.CTkButton(self.buttons_frame, text="Add", command=self.add_sale,
                                    fg_color="#43A047", hover_color="#2E7D32")  # Green
        self.add_button.pack(side="left", padx=5)
        self.update_button = ctk.CTkButton(self.buttons_frame, text="Update", command=self.update_sale,
                                        fg_color="#FB8C00", hover_color="#EF6C00")  # Orange
        self.update_button.pack(side="left", padx=5)
        self.delete_button = ctk.CTkButton(self.buttons_frame, text="Delete", command=self.delete_sale,
                                        fg_color="#E53935", hover_color="#C62828")  # Red
        self.delete_button.pack(side="left", padx=5)
        
        # Add Process Return Button
        self.return_button = ctk.CTkButton(self.buttons_frame, text="Process Return", command=self.process_return,
                                        fg_color="#5C6BC0", hover_color="#3949AB")  # Indigo
        self.return_button.pack(side="left", padx=5)
        self.refresh_button = ctk.CTkButton(self.buttons_frame, text="Refresh", command=self.refresh_sales,
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
        self.tree.heading("Total Amount", text="Total Amount (Le)")
        self.tree.heading("Date", text="Date")
        # Configure column widths
        self.tree.column("ID", width=50)
        self.tree.column("Product Name", width=150)
        self.tree.column("Quantity", width=100)
        self.tree.column("Total Amount", width=150)  # Increased width for Leones
        self.tree.column("Date", width=150)
        # Scrollbar
        scrollbar = ttk.Scrollbar(self.tree_frame, orient="vertical", command=self.tree.yview)
        scrollbar.pack(side="right", fill="y")
        self.tree.configure(yscrollcommand=scrollbar.set)
        # Load initial data
        self.refresh_sales()



    def open_credit_window(self):
        """Open the credit management window in the dashboard frame"""
        try:
            # Import CreditWindow if not already imported
            from credit import CreditWindow
            
            print(f"Debug: Dashboard reference available: {self.dashboard is not None}")
            
            # Use the dashboard reference if available
            if self.dashboard:
                dashboard = self.dashboard
                print("Debug: Using dashboard reference")
            else:
                print("Debug: Dashboard reference not available, trying to find dashboard")
                # Try to find the dashboard frame
                dashboard = None
                
                # First, try to find it by navigating up the widget hierarchy
                widget = self.master
                while widget:
                    if hasattr(widget, 'main_content') and hasattr(widget, 'user_data'):
                        dashboard = widget
                        print("Debug: Found dashboard through widget hierarchy")
                        break
                    widget = widget.master
                
                # If not found, try to find it through the root window
                if not dashboard:
                    root = self.winfo_toplevel()
                    for child in root.winfo_children():
                        if hasattr(child, 'main_content') and hasattr(child, 'user_data'):
                            dashboard = child
                            print("Debug: Found dashboard through root window")
                            break
                
                if not dashboard:
                    print("Debug: Dashboard not found")
                    raise Exception("Dashboard frame not found")
            
            print("Debug: Clearing main content")
            # Clear the main content area of the dashboard
            dashboard.clear_main_content()
            
            print("Debug: Creating CreditWindow")
            # Create credit window in the dashboard's main content area
            credit_window = CreditWindow(dashboard.main_content, dashboard.user_data)
            
            print("Debug: Packing CreditWindow")
            # Show the window in the dashboard's main content area
            credit_window.pack(fill="both", expand=True)
            
            print("Debug: Credit window opened in dashboard")
        except Exception as e:
            print(f"Debug: Error opening credit window in dashboard: {e}")
            messagebox.showerror("Error", f"Error opening credit management: {e}")



    def complete_sale_on_credit(self):
        """Process a sale on credit"""
        # Get selected sale
        selected_item = self.tree.selection()
        if not selected_item:
            messagebox.showwarning("Selection Error", "Please select a sale to process on credit!")
            return

        # Get sale data
        sale_data = self.tree.item(selected_item[0])["values"]
        sale_id = sale_data[0]
        product_name = sale_data[1]
        quantity = sale_data[2]
        total_amount_str = sale_data[3]

        # Parse total amount
        try:
            total_amount = float(total_amount_str.replace("Le ", "").replace(",", ""))
        except ValueError:
            messagebox.showerror("Error", "Invalid total amount format")
            return

        # Create credit details dialog
        customer_window = ctk.CTkToplevel(self.container)
        customer_window.title("Credit Sale Details")
        customer_window.geometry("400x250")
        customer_window.transient(self.container)
        customer_window.grab_set()

        # Center the dialog
        customer_window.update_idletasks()
        x = (customer_window.winfo_screenwidth() // 2) - (customer_window.winfo_width() // 2)
        y = (customer_window.winfo_screenheight() // 2) - (customer_window.winfo_height() // 2)
        customer_window.geometry(f"+{x}+{y}")

        # Main container frame
        main_frame = ctk.CTkFrame(customer_window)
        main_frame.pack(fill="both", expand=True, padx=20, pady=20)

        # Product info (read-only)
        product_frame = ctk.CTkFrame(main_frame)
        product_frame.pack(fill="x", pady=(0, 10))
        
        product_label = ctk.CTkLabel(product_frame, text="Product:")
        product_label.pack(side="left", padx=5)
        product_entry = ctk.CTkEntry(product_frame, state="disabled")
        product_entry.insert(0, product_name)
        product_entry.pack(side="left", fill="x", expand=True, padx=5)

        # Amount info (read-only)
        amount_frame = ctk.CTkFrame(main_frame)
        amount_frame.pack(fill="x", pady=(0, 10))
        
        amount_label = ctk.CTkLabel(amount_frame, text="Amount:")
        amount_label.pack(side="left", padx=5)
        amount_entry = ctk.CTkEntry(amount_frame, state="disabled")
        amount_entry.insert(0, total_amount_str)
        amount_entry.pack(side="left", fill="x", expand=True, padx=5)

        # Customer Name
        customer_frame = ctk.CTkFrame(main_frame)
        customer_frame.pack(fill="x", pady=(0, 10))
        
        customer_label = ctk.CTkLabel(customer_frame, text="Customer Name:")
        customer_label.pack(side="left", padx=5)
        customer_entry = ctk.CTkEntry(customer_frame)
        customer_entry.pack(side="left", fill="x", expand=True, padx=5)

        # Due Date
        date_frame = ctk.CTkFrame(main_frame)
        date_frame.pack(fill="x", pady=(0, 10))
        
        date_label = ctk.CTkLabel(date_frame, text="Due Date (YYYY-MM-DD):")
        date_label.pack(side="left", padx=5)
        date_entry = ctk.CTkEntry(date_frame)
        date_entry.insert(0, (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"))  # Default 30 days
        date_entry.pack(side="left", fill="x", expand=True, padx=5)

        # Buttons frame
        button_frame = ctk.CTkFrame(main_frame)
        button_frame.pack(fill="x", pady=(10, 0))

        def process_credit_sale():
            try:
                customer_name = customer_entry.get().strip()
                due_date = date_entry.get().strip()

                if not customer_name:
                    messagebox.showwarning("Warning", "Please enter customer name")
                    return

                if not due_date:
                    messagebox.showwarning("Warning", "Please enter due date")
                    return

                try:
                    datetime.strptime(due_date, "%Y-%m-%d")
                except ValueError:
                    messagebox.showwarning("Warning", "Invalid date format. Use YYYY-MM-DD")
                    return

                # Get database connection
                connection = self.get_db_connection()
                if not connection:
                    return

                try:
                    with connection.cursor() as cursor:
                        # Update the sale to mark it as credit
                        cursor.execute("""
                            UPDATE sales 
                            SET payment_method = 'Credit' 
                            WHERE id = %s
                        """, (sale_id,))

                        # Insert credit record using correct column names
                        cursor.execute("""
                            INSERT INTO credits (sale_id, customer_name, amount, due_date, status)
                            VALUES (%s, %s, %s, %s, 'Unpaid')
                        """, (sale_id, customer_name, total_amount, due_date))

                        connection.commit()
                        messagebox.showinfo("Success", f"Credit sale processed successfully!\nSale ID: {sale_id}")
                        customer_window.destroy()
                        self.refresh_sales()

                except pymysql.Error as e:
                    connection.rollback()
                    messagebox.showerror("Database Error", f"Error processing credit sale: {e}")
                finally:
                    connection.close()

            except Exception as e:
                messagebox.showerror("Error", f"Failed to process credit sale: {str(e)}")

        process_button = ctk.CTkButton(
            button_frame,
            text="Process Credit Sale",
            command=process_credit_sale,
            fg_color="#7B1FA2",  # Purple
            hover_color="#6A1B9A"
        )
        process_button.pack(side="right", padx=5)

        cancel_button = ctk.CTkButton(
            button_frame,
            text="Cancel",
            command=customer_window.destroy,
            fg_color="#E53935",  # Red
            hover_color="#C62828"
        )
        cancel_button.pack(side="right", padx=5)

    
        

        

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

    def refresh_sales(self):
        """Load sales from database into treeview with date filtering"""
        # Clear existing items
        for item in self.tree.get_children():
            self.tree.delete(item)
        
        connection = self.get_db_connection()
        if not connection:
            return
        
        try:
            with connection.cursor() as cursor:
                # Get date filter
                date_filter = self.date_filter_var.get()
                date_condition = ""
                params = []
                
                # Build date condition based on selected filter
                if date_filter == "Today":
                    date_condition = "WHERE DATE(s.date) = CURDATE()"
                elif date_filter == "Yesterday":
                    date_condition = "WHERE DATE(s.date) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)"
                elif date_filter == "This Week":
                    date_condition = "WHERE YEARWEEK(s.date, 1) = YEARWEEK(CURDATE(), 1)"
                elif date_filter == "Last Week":
                    date_condition = "WHERE YEARWEEK(s.date, 1) = YEARWEEK(DATE_SUB(CURDATE(), INTERVAL 7 DAY), 1)"
                elif date_filter == "This Month":
                    date_condition = "WHERE MONTH(s.date) = MONTH(CURDATE()) AND YEAR(s.date) = YEAR(CURDATE())"
                elif date_filter == "Last Month":
                    date_condition = "WHERE MONTH(s.date) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) AND YEAR(s.date) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))"
                elif date_filter == "This Year":
                    date_condition = "WHERE YEAR(s.date) = YEAR(CURDATE())"
                elif date_filter == "Custom Range":
                    # For custom range, we'll need to implement a date picker dialog
                    # For now, we'll just use the current month as an example
                    date_condition = "WHERE MONTH(s.date) = MONTH(CURDATE()) AND YEAR(s.date) = YEAR(CURDATE())"
                
                # Query to get sales with product names and date filtering
                query = f"""
                    SELECT s.id, p.name, s.quantity, s.total_amount, s.date 
                    FROM sales s
                    JOIN products p ON s.product_id = p.id
                    {date_condition}
                    ORDER BY s.date DESC
                """
                
                cursor.execute(query, params)
                sales = cursor.fetchall()
                
                for sale in sales:
                    # Format date for display
                    formatted_date = sale[4].strftime("%Y-%m-%d %H:%M") if sale[4] else ""
                    # Format currency as Leones
                    formatted_amount = f"Le {sale[3]:,.2f}"
                    self.tree.insert("", "end", values=(sale[0], sale[1], sale[2], formatted_amount, formatted_date))
                    
        except pymysql.Error as e:
            messagebox.showerror("Database Error", f"Error fetching sales: {e}")
        finally:
            connection.close()

    def search_sales(self):
        """Filter sales by product name and date range"""
        search_term = self.search_entry.get().strip()
        
        # Clear existing items
        for item in self.tree.get_children():
            self.tree.delete(item)
        
        connection = self.get_db_connection()
        if not connection:
            return
        
        try:
            with connection.cursor() as cursor:
                # Get date filter
                date_filter = self.date_filter_var.get()
                date_condition = ""
                params = []
                
                # Build date condition based on selected filter
                if date_filter == "Today":
                    date_condition = "AND DATE(s.date) = CURDATE()"
                elif date_filter == "Yesterday":
                    date_condition = "AND DATE(s.date) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)"
                elif date_filter == "This Week":
                    date_condition = "AND YEARWEEK(s.date, 1) = YEARWEEK(CURDATE(), 1)"
                elif date_filter == "Last Week":
                    date_condition = "AND YEARWEEK(s.date, 1) = YEARWEEK(DATE_SUB(CURDATE(), INTERVAL 7 DAY), 1)"
                elif date_filter == "This Month":
                    date_condition = "AND MONTH(s.date) = MONTH(CURDATE()) AND YEAR(s.date) = YEAR(CURDATE())"
                elif date_filter == "Last Month":
                    date_condition = "AND MONTH(s.date) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) AND YEAR(s.date) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))"
                elif date_filter == "This Year":
                    date_condition = "AND YEAR(s.date) = YEAR(CURDATE())"
                elif date_filter == "Custom Range":
                    # For custom range, we'll need to implement a date picker dialog
                    # For now, we'll just use the current month as an example
                    date_condition = "AND MONTH(s.date) = MONTH(CURDATE()) AND YEAR(s.date) = YEAR(CURDATE())"
                
                # Build search condition
                search_condition = ""
                if search_term:
                    search_condition = "AND p.name LIKE %s"
                    params.append(f"%{search_term}%")
                
                # Query to get sales with product names, search term, and date filtering
                query = f"""
                    SELECT s.id, p.name, s.quantity, s.total_amount, s.date 
                    FROM sales s
                    JOIN products p ON s.product_id = p.id
                    WHERE 1=1 {search_condition} {date_condition}
                    ORDER BY s.date DESC
                """
                
                cursor.execute(query, params)
                sales = cursor.fetchall()
                
                for sale in sales:
                    # Format date for display
                    formatted_date = sale[4].strftime("%Y-%m-%d %H:%M") if sale[4] else ""
                    # Format currency as Leones
                    formatted_amount = f"Le {sale[3]:,.2f}"
                    self.tree.insert("", "end", values=(sale[0], sale[1], sale[2], formatted_amount, formatted_date))
                    
        except pymysql.Error as e:
            messagebox.showerror("Database Error", f"Error searching sales: {e}")
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

    def get_sales(self):
        """Get all sales from database for dropdown"""
        connection = self.get_db_connection()
        if not connection:
            return []
        try:
            with connection.cursor() as cursor:
                # Query to get sales with product names
                cursor.execute("""
                    SELECT s.id, p.name, s.quantity, s.total_amount, s.date 
                    FROM sales s
                    JOIN products p ON s.product_id = p.id
                    ORDER BY s.date DESC
                """)
                return cursor.fetchall()
        except pymysql.Error as e:
            messagebox.showerror("Database Error", f"Error fetching sales: {e}")
            return []
        finally:
            connection.close()

    def add_sale(self):
        """Open dialog to add a new sale"""
        dialog = ctk.CTkToplevel(self.container)
        dialog.title("Add New Sale")
        dialog.geometry("500x400")
        dialog.transient(self.container)
        dialog.grab_set()
        
        # Center the dialog
        dialog.update_idletasks()
        x = (dialog.winfo_screenwidth() // 2) - (dialog.winfo_width() // 2)
        y = (dialog.winfo_screenheight() // 2) - (dialog.winfo_height() // 2)
        dialog.geometry(f"+{x}+{y}")
        
        # Product selection
        product_frame = ctk.CTkFrame(dialog)
        product_frame.pack(fill="x", padx=20, pady=10)
        
        product_label = ctk.CTkLabel(product_frame, text="Product:")
        product_label.pack(side="left", padx=5)
        
        products = self.get_products()
        product_names = [f"{p[1]} (Stock: {p[3]})" for p in products]
        product_var = ctk.StringVar()
        product_dropdown = ctk.CTkOptionMenu(product_frame, variable=product_var, values=product_names)
        product_dropdown.pack(side="left", fill="x", expand=True, padx=5)
        
        # Quantity
        quantity_frame = ctk.CTkFrame(dialog)
        quantity_frame.pack(fill="x", padx=20, pady=10)
        
        quantity_label = ctk.CTkLabel(quantity_frame, text="Quantity:")
        quantity_label.pack(side="left", padx=5)
        
        quantity_var = ctk.StringVar(value="1")
        quantity_entry = ctk.CTkEntry(quantity_frame, textvariable=quantity_var)
        quantity_entry.pack(side="left", fill="x", expand=True, padx=5)
        
        # Total amount (calculated automatically)
        total_frame = ctk.CTkFrame(dialog)
        total_frame.pack(fill="x", padx=20, pady=10)
        
        total_label = ctk.CTkLabel(total_frame, text="Total Amount (Le):")
        total_label.pack(side="left", padx=5)
        
        total_var = ctk.StringVar(value="Le 0.00")
        total_entry = ctk.CTkEntry(total_frame, textvariable=total_var, state="disabled")
        total_entry.pack(side="left", fill="x", expand=True, padx=5)
        
        # Date
        date_frame = ctk.CTkFrame(dialog)
        date_frame.pack(fill="x", padx=20, pady=10)
        
        date_label = ctk.CTkLabel(date_frame, text="Date:")
        date_label.pack(side="left", padx=5)
        
        date_var = ctk.StringVar(value=datetime.now().strftime("%Y-%m-%d %H:%M"))
        date_entry = ctk.CTkEntry(date_frame, textvariable=date_var)
        date_entry.pack(side="left", fill="x", expand=True, padx=5)
        
        # Update total when product or quantity changes
        def update_total(*args):
            try:
                selected_product = product_var.get()
                if selected_product:
                    # Get product index
                    product_index = product_names.index(selected_product)
                    # Get product price
                    product_price = products[product_index][2]
                    # Get quantity
                    quantity = int(quantity_var.get())
                    # Calculate total
                    total = product_price * quantity
                    # Update total display as Leones
                    total_var.set(f"Le {total:,.2f}")
            except (ValueError, IndexError):
                total_var.set("Le 0.00")
        
        product_var.trace_add("write", update_total)
        quantity_var.trace_add("write", update_total)
        
        # Buttons
        button_frame = ctk.CTkFrame(dialog)
        button_frame.pack(fill="x", padx=20, pady=10)
        
        def save_sale():
            try:
                # Get selected product
                selected_product = product_var.get()
                if not selected_product:
                    messagebox.showerror("Error", "Please select a product")
                    return
                
                # Get product index
                product_index = product_names.index(selected_product)
                # Get product details
                product_id = products[product_index][0]
                product_name = products[product_index][1]
                product_price = products[product_index][2]
                stock_quantity = products[product_index][3]
                
                # Get quantity
                quantity = int(quantity_var.get())
                if quantity <= 0:
                    messagebox.showerror("Error", "Quantity must be greater than 0")
                    return
                
                # Check if enough stock
                if quantity > stock_quantity:
                    messagebox.showerror("Error", f"Not enough stock. Available: {stock_quantity}")
                    return
                
                # Get total amount
                total_amount = float(total_var.get().replace("Le ", "").replace(",", ""))
                
                # Get date
                sale_date = date_var.get()
                
                # Confirm sale
                if not messagebox.askyesno("Confirm Sale", f"Are you sure you want to sell {quantity} units of {product_name}?"):
                    return
                
                # Save to database
                connection = self.get_db_connection()
                if not connection:
                    return
                
                try:
                    with connection.cursor() as cursor:
                        # Insert sale record
                        cursor.execute(
                            "INSERT INTO sales (product_id, quantity, total_amount, date) VALUES (%s, %s, %s, %s)",
                            (product_id, quantity, total_amount, sale_date)
                        )
                        
                        # Update stock
                        cursor.execute(
                            "UPDATE stock SET quantity = quantity - %s WHERE product_id = %s",
                            (quantity, product_id)
                        )
                        
                        connection.commit()
                        messagebox.showinfo("Success", "Sale added successfully!")
                        dialog.destroy()
                        self.refresh_sales()
                        
                except pymysql.Error as e:
                    messagebox.showerror("Database Error", f"Error adding sale: {e}")
                finally:
                    connection.close()
                    
            except ValueError:
                messagebox.showerror("Error", "Invalid input values")
        
        save_button = ctk.CTkButton(button_frame, text="Save", command=save_sale,
                                   fg_color="#43A047", hover_color="#2E7D32")  # Green
        save_button.pack(side="right", padx=5)
        
        cancel_button = ctk.CTkButton(button_frame, text="Cancel", command=dialog.destroy,
                                    fg_color="#E53935", hover_color="#C62828")  # Red
        cancel_button.pack(side="right", padx=5)

    def update_sale(self):
        """Update selected sale"""
        selected_item = self.tree.selection()
        if not selected_item:
            messagebox.showwarning("Selection Error", "Please select a sale to update!")
            return
        
        # Get selected sale data
        sale_data = self.tree.item(selected_item[0])["values"]
        sale_id = sale_data[0]
        product_name = sale_data[1]
        quantity = sale_data[2]
        total_amount_str = sale_data[3]
        date_str = sale_data[4]
        
        # Parse total amount
        try:
            total_amount = float(total_amount_str.replace("Le ", "").replace(",", ""))
        except ValueError:
            total_amount = 0.0
        
        # Parse date
        try:
            sale_date = datetime.strptime(date_str, "%Y-%m-%d %H:%M")
        except ValueError:
            sale_date = datetime.now()
        
        # Get product ID
        connection = self.get_db_connection()
        if not connection:
            return
        
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT id FROM products WHERE name = %s", (product_name,))
                product_data = cursor.fetchone()
                
                if not product_data:
                    messagebox.showerror("Data Error", "Product not found!")
                    return
                
                product_id = product_data[0]
                
                # Get current stock
                cursor.execute("SELECT quantity FROM stock WHERE product_id = %s", (product_id,))
                stock_data = cursor.fetchone()
                
                if not stock_data:
                    messagebox.showerror("Data Error", "Stock information not found!")
                    return
                
                current_stock = stock_data[0]
                
                # Get original sale quantity for stock adjustment
                cursor.execute("SELECT quantity FROM sales WHERE id = %s", (sale_id,))
                original_quantity = cursor.fetchone()[0]
                
        except pymysql.Error as e:
            messagebox.showerror("Database Error", f"Error fetching sale data: {e}")
            connection.close()
            return
        
        connection.close()
        
        # Create update dialog
        dialog = ctk.CTkToplevel(self.container)
        dialog.title("Update Sale")
        dialog.geometry("500x400")
        dialog.transient(self.container)
        dialog.grab_set()
        
        # Center the dialog
        dialog.update_idletasks()
        x = (dialog.winfo_screenwidth() // 2) - (dialog.winfo_width() // 2)
        y = (dialog.winfo_screenheight() // 2) - (dialog.winfo_height() // 2)
        dialog.geometry(f"+{x}+{y}")
        
        # Product (read-only)
        product_frame = ctk.CTkFrame(dialog)
        product_frame.pack(fill="x", padx=20, pady=10)
        
        product_label = ctk.CTkLabel(product_frame, text="Product:")
        product_label.pack(side="left", padx=5)
        
        product_var = ctk.StringVar(value=product_name)
        product_entry = ctk.CTkEntry(product_frame, textvariable=product_var, state="disabled")
        product_entry.pack(side="left", fill="x", expand=True, padx=5)
        
        # Quantity
        quantity_frame = ctk.CTkFrame(dialog)
        quantity_frame.pack(fill="x", padx=20, pady=10)
        
        quantity_label = ctk.CTkLabel(quantity_frame, text="Quantity:")
        quantity_label.pack(side="left", padx=5)
        
        quantity_var = ctk.StringVar(value=str(quantity))
        quantity_entry = ctk.CTkEntry(quantity_frame, textvariable=quantity_var)
        quantity_entry.pack(side="left", fill="x", expand=True, padx=5)
        
        # Total amount (calculated automatically)
        total_frame = ctk.CTkFrame(dialog)
        total_frame.pack(fill="x", padx=20, pady=10)
        
        total_label = ctk.CTkLabel(total_frame, text="Total Amount (Le):")
        total_label.pack(side="left", padx=5)
        
        total_var = ctk.StringVar(value=f"Le {total_amount:,.2f}")
        total_entry = ctk.CTkEntry(total_frame, textvariable=total_var, state="disabled")
        total_entry.pack(side="left", fill="x", expand=True, padx=5)
        
        # Date
        date_frame = ctk.CTkFrame(dialog)
        date_frame.pack(fill="x", padx=20, pady=10)
        
        date_label = ctk.CTkLabel(date_frame, text="Date:")
        date_label.pack(side="left", padx=5)
        
        date_var = ctk.StringVar(value=sale_date.strftime("%Y-%m-%d %H:%M"))
        date_entry = ctk.CTkEntry(date_frame, textvariable=date_var)
        date_entry.pack(side="left", fill="x", expand=True, padx=5)
        
        # Get product price for calculation
        connection = self.get_db_connection()
        if not connection:
            return
        
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT unit_price FROM products WHERE id = %s", (product_id,))
                product_price = cursor.fetchone()[0]
        except pymysql.Error as e:
            messagebox.showerror("Database Error", f"Error fetching product price: {e}")
            connection.close()
            return
        
        connection.close()
        
        # Update total when quantity changes
        def update_total(*args):
            try:
                # Get quantity
                new_quantity = int(quantity_var.get())
                if new_quantity <= 0:
                    total_var.set("Le 0.00")
                    return
                
                # Calculate total
                total = product_price * new_quantity
                # Update total display as Leones
                total_var.set(f"Le {total:,.2f}")
            except ValueError:
                total_var.set("Le 0.00")
        
        quantity_var.trace_add("write", update_total)
        
        # Buttons
        button_frame = ctk.CTkFrame(dialog)
        button_frame.pack(fill="x", padx=20, pady=10)
        
        def save_update():
            try:
                # Get new quantity
                new_quantity = int(quantity_var.get())
                if new_quantity <= 0:
                    messagebox.showerror("Error", "Quantity must be greater than 0")
                    return
                
                # Check if enough stock (considering the original quantity)
                stock_adjustment = new_quantity - original_quantity
                if stock_adjustment > current_stock:
                    messagebox.showerror("Error", f"Not enough stock. Available: {current_stock}")
                    return
                
                # Get total amount
                new_total_amount = float(total_var.get().replace("Le ", "").replace(",", ""))
                
                # Get date
                new_sale_date = date_var.get()
                
                # Confirm update
                if not messagebox.askyesno("Confirm Update", f"Are you sure you want to update this sale?"):
                    return
                
                # Update database
                connection = self.get_db_connection()
                if not connection:
                    return
                
                try:
                    with connection.cursor() as cursor:
                        # Update sale record
                        cursor.execute(
                            "UPDATE sales SET quantity = %s, total_amount = %s, date = %s WHERE id = %s",
                            (new_quantity, new_total_amount, new_sale_date, sale_id)
                        )
                        
                        # Update stock
                        cursor.execute(
                            "UPDATE stock SET quantity = quantity - %s WHERE product_id = %s",
                            (stock_adjustment, product_id)
                        )
                        
                        connection.commit()
                        messagebox.showinfo("Success", "Sale updated successfully!")
                        dialog.destroy()
                        self.refresh_sales()
                        
                except pymysql.Error as e:
                    messagebox.showerror("Database Error", f"Error updating sale: {e}")
                finally:
                    connection.close()
                    
            except ValueError:
                messagebox.showerror("Error", "Invalid input values")
        
        update_button = ctk.CTkButton(button_frame, text="Update", command=save_update,
                                    fg_color="#FB8C00", hover_color="#EF6C00")  # Orange
        update_button.pack(side="right", padx=5)
        
        cancel_button = ctk.CTkButton(button_frame, text="Cancel", command=dialog.destroy,
                                    fg_color="#E53935", hover_color="#C62828")  # Red
        cancel_button.pack(side="right", padx=5)

    def delete_sale(self):
        """Delete selected sale"""
        selected_item = self.tree.selection()
        if not selected_item:
            messagebox.showwarning("Selection Error", "Please select a sale to delete!")
            return
        
        # Get selected sale ID
        sale_id = self.tree.item(selected_item[0])["values"][0]
        
        # Get sale details for inventory adjustment
        connection = self.get_db_connection()
        if not connection:
            return
        
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT product_id, quantity FROM sales WHERE id=%s", (sale_id,))
                sale_data = cursor.fetchone()
                
                if not sale_data:
                    messagebox.showerror("Data Error", "Sale not found!")
                    return
                
                product_id = sale_data[0]
                quantity = sale_data[1]
                
                # Confirm deletion
                if not messagebox.askyesno("Confirm Deletion", "Are you sure you want to delete this sale?"):
                    return
                
                # Delete sale and adjust inventory
                cursor.execute("DELETE FROM sales WHERE id=%s", (sale_id,))
                cursor.execute("UPDATE stock SET quantity = quantity + %s WHERE product_id = %s", (quantity, product_id))
                
                connection.commit()
                messagebox.showinfo("Success", "Sale deleted successfully!")
                self.refresh_sales()
                
        except pymysql.Error as e:
            messagebox.showerror("Database Error", f"Error deleting sale: {e}")
        finally:
            connection.close()

    def process_return(self):
        """Open dialog to process a return"""
        # Create return dialog
        dialog = ctk.CTkToplevel(self.container)
        dialog.title("Process Return")
        dialog.geometry("500x450")
        dialog.transient(self.container)
        dialog.grab_set()
        
        # Center the dialog
        dialog.update_idletasks()
        x = (dialog.winfo_screenwidth() // 2) - (dialog.winfo_width() // 2)
        y = (dialog.winfo_screenheight() // 2) - (dialog.winfo_height() // 2)
        dialog.geometry(f"+{x}+{y}")
        
        # Sale selection
        sale_frame = ctk.CTkFrame(dialog)
        sale_frame.pack(fill="x", padx=20, pady=10)
        
        sale_label = ctk.CTkLabel(sale_frame, text="Select Sale:")
        sale_label.pack(side="left", padx=5)
        
        sales = self.get_sales()
        sale_names = [f"ID: {s[0]}, Product: {s[1]}, Qty: {s[2]}, Date: {s[4].strftime('%Y-%m-%d') if s[4] else 'N/A'}" for s in sales]
        sale_var = ctk.StringVar()
        sale_dropdown = ctk.CTkOptionMenu(sale_frame, variable=sale_var, values=sale_names)
        sale_dropdown.pack(side="left", fill="x", expand=True, padx=5)
        
        # Product info (read-only)
        product_frame = ctk.CTkFrame(dialog)
        product_frame.pack(fill="x", padx=20, pady=10)
        
        product_label = ctk.CTkLabel(product_frame, text="Product:")
        product_label.pack(side="left", padx=5)
        
        product_var = ctk.StringVar(value="Select a sale first")
        product_entry = ctk.CTkEntry(product_frame, textvariable=product_var, state="disabled")
        product_entry.pack(side="left", fill="x", expand=True, padx=5)
        
        # Price info (read-only)
        price_frame = ctk.CTkFrame(dialog)
        price_frame.pack(fill="x", padx=20, pady=10)
        
        price_label = ctk.CTkLabel(price_frame, text="Unit Price (Le):")
        price_label.pack(side="left", padx=5)
        
        price_var = ctk.StringVar(value="Le 0.00")
        price_entry = ctk.CTkEntry(price_frame, textvariable=price_var, state="disabled")
        price_entry.pack(side="left", fill="x", expand=True, padx=5)
        
        # Return quantity
        return_qty_frame = ctk.CTkFrame(dialog)
        return_qty_frame.pack(fill="x", padx=20, pady=10)
        
        return_qty_label = ctk.CTkLabel(return_qty_frame, text="Return Quantity:")
        return_qty_label.pack(side="left", padx=5)
        
        return_qty_var = ctk.StringVar(value="1")
        return_qty_entry = ctk.CTkEntry(return_qty_frame, textvariable=return_qty_var)
        return_qty_entry.pack(side="left", fill="x", expand=True, padx=5)
        
        # Reason for return
        reason_frame = ctk.CTkFrame(dialog)
        reason_frame.pack(fill="x", padx=20, pady=10)
        
        reason_label = ctk.CTkLabel(reason_frame, text="Return Reason:")
        reason_label.pack(side="left", padx=5)
        
        reason_textbox = ctk.CTkTextbox(reason_frame, height=80)
        reason_textbox.pack(side="left", fill="both", expand=True, padx=5)
        
        # Refund amount (calculated automatically)
        refund_frame = ctk.CTkFrame(dialog)
        refund_frame.pack(fill="x", padx=20, pady=10)
        
        refund_label = ctk.CTkLabel(refund_frame, text="Refund Amount (Le):")
        refund_label.pack(side="left", padx=5)
        
        refund_var = ctk.StringVar(value="Le 0.00")
        refund_entry = ctk.CTkEntry(refund_frame, textvariable=refund_var, state="disabled")
        refund_entry.pack(side="left", fill="x", expand=True, padx=5)
        
        # Variables to store selected data
        selected_sale_id = None
        selected_product_id = None
        product_price = 0
        max_return_quantity = 0
        
        # Update product info when sale is selected
        def on_sale_selected(*args):
            nonlocal selected_sale_id, selected_product_id, product_price, max_return_quantity
            
            selected_sale = sale_var.get()
            if not selected_sale:
                return
            
            try:
                # Get sale ID from selection
                sale_id = int(selected_sale.split(",")[0].split(":")[1].strip())
                selected_sale_id = sale_id
                
                # Find the sale in our list
                for sale in sales:
                    if sale[0] == sale_id:
                        # Update product info
                        product_var.set(sale[1])
                        
                        # Get product ID and price
                        connection = self.get_db_connection()
                        if not connection:
                            return
                        
                        try:
                            with connection.cursor() as cursor:
                                cursor.execute("SELECT id, unit_price FROM products WHERE name = %s", (sale[1],))
                                product_data = cursor.fetchone()
                                
                                if product_data:
                                    selected_product_id = product_data[0]
                                    product_price = float(product_data[1])
                                    price_var.set(f"Le {product_price:,.2f}")
                                    
                                    # Get max return quantity (original sale quantity)
                                    max_return_quantity = sale[2]
                                    
                                    # Update refund amount
                                    update_refund_amount()
                        except pymysql.Error as e:
                            messagebox.showerror("Database Error", f"Error fetching product data: {e}")
                        finally:
                            connection.close()
                        
                        break
            except (ValueError, IndexError) as e:
                messagebox.showerror("Selection Error", f"Error parsing sale selection: {e}")
        
        # Update refund amount when quantity changes
        def update_refund_amount(*args):
            try:
                quantity = int(return_qty_var.get())
                if quantity > max_return_quantity:
                    messagebox.showwarning("Invalid Quantity", f"Return quantity cannot exceed original sale quantity ({max_return_quantity})")
                    return_qty_var.set(str(max_return_quantity))
                    quantity = max_return_quantity
                
                refund = product_price * quantity
                refund_var.set(f"Le {refund:,.2f}")
            except ValueError:
                refund_var.set("Le 0.00")
        
        # Bind events
        sale_var.trace_add("write", on_sale_selected)
        return_qty_var.trace_add("write", update_refund_amount)
        
        # Buttons
        button_frame = ctk.CTkFrame(dialog)
        button_frame.pack(fill="x", padx=20, pady=10)
        
        def process_return():
            if not selected_sale_id or not selected_product_id:
                messagebox.showerror("Selection Error", "Please select a valid sale")
                return
            
            try:
                quantity = int(return_qty_var.get())
                if quantity <= 0:
                    messagebox.showerror("Invalid Quantity", "Return quantity must be greater than 0")
                    return
                
                if quantity > max_return_quantity:
                    messagebox.showerror("Invalid Quantity", f"Return quantity cannot exceed original sale quantity ({max_return_quantity})")
                    return
                
                reason = reason_textbox.get("1.0", "end-1c").strip()
                if not reason:
                    messagebox.showerror("Missing Reason", "Please provide a reason for the return")
                    return
                
                refund_amount = product_price * quantity
                
                # Confirm return
                if not messagebox.askyesno(
                    "Confirm Return", 
                    f"Process return for {quantity} units?\nRefund amount: Le {refund_amount:,.2f}"
                ):
                    return
                
                # Process return in database
                connection = self.get_db_connection()
                if not connection:
                    return
                
                try:
                    with connection.cursor() as cursor:
                        # Start transaction
                        connection.begin()
                        
                        # Update stock
                        cursor.execute(
                            "UPDATE stock SET quantity = quantity + %s WHERE product_id = %s",
                            (quantity, selected_product_id)
                        )
                        
                        # Insert return record
                        cursor.execute(
                            """
                            INSERT INTO returns 
                            (sale_id, product_id, quantity, reason, refund_amount) 
                            VALUES (%s, %s, %s, %s, %s)
                            """,
                            (selected_sale_id, selected_product_id, quantity, reason, refund_amount)
                        )
                        
                        # Commit transaction
                        connection.commit()
                        
                        messagebox.showinfo("Success", "Return processed successfully")
                        dialog.destroy()
                        self.refresh_sales()
                        
                except pymysql.Error as e:
                    # Rollback in case of error
                    connection.rollback()
                    messagebox.showerror("Database Error", f"Error processing return: {e}")
                finally:
                    connection.close()
                    
            except ValueError:
                messagebox.showerror("Input Error", "Invalid quantity value")
        
        process_button = ctk.CTkButton(button_frame, text="Process Return", command=process_return,
                                      fg_color="#5C6BC0", hover_color="#3949AB")  # Indigo
        process_button.pack(side="right", padx=5)
        
        cancel_button = ctk.CTkButton(button_frame, text="Cancel", command=dialog.destroy,
                                    fg_color="#E53935", hover_color="#C62828")  # Red
        cancel_button.pack(side="right", padx=5)
