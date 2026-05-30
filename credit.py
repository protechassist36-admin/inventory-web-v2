import customtkinter as ctk
from tkinter import ttk, messagebox
from datetime import datetime, timedelta
import pymysql
from database import Database
from config import CURRENCY_SYMBOL
from utils import format_datetime, format_currency

class CreditWindow(ctk.CTkFrame):
    def __init__(self, parent_frame, user_data):
        super().__init__(parent_frame)
        self.user_data = user_data
        self.db = Database()
        
        # Configure grid weights for parent frame
        self.grid(row=0, column=0, sticky="nsew")
        parent_frame.grid_rowconfigure(0, weight=1)
        parent_frame.grid_columnconfigure(0, weight=1)
        
        # Check and update database schema if needed
        self.check_credits_table()
        
        # Create UI components
        self.create_widgets()
        
        # Load credits after a short delay to ensure UI is ready
        self.after(100, self.load_credits)
    
    def destroy(self):
        """Clean up resources when window is destroyed"""
        # Call parent destroy method
        super().destroy()

    def create_widgets(self):
        """Create all UI widgets for the credit window"""
        # Title
        self.title_label = ctk.CTkLabel(
            self,
            text="Credit Management",
            font=ctk.CTkFont(size=24, weight="bold")
        )
        self.title_label.pack(pady=10)

        # Create treeview frame
        self.tree_frame = ctk.CTkFrame(self)
        self.tree_frame.pack(fill="both", expand=True, padx=20, pady=10)

        # Create treeview with scrollbar
        self.tree = ttk.Treeview(
            self.tree_frame,
            columns=("ID", "Sale ID", "Customer Name", "Product", "Sale Amount", "Credit Amount", "Created At", "Status"),
            show="headings"
        )
        self.tree.pack(side="left", fill="both", expand=True)

        # Define headings
        self.tree.heading("ID", text="ID")
        self.tree.heading("Sale ID", text="Sale ID")
        self.tree.heading("Customer Name", text="Customer Name")
        self.tree.heading("Product", text="Product")
        self.tree.heading("Sale Amount", text=f"Sale Amount ({CURRENCY_SYMBOL})")
        self.tree.heading("Credit Amount", text=f"Credit Amount ({CURRENCY_SYMBOL})")
        self.tree.heading("Created At", text="Created At")
        self.tree.heading("Status", text="Status")

        # Configure column widths
        self.tree.column("ID", width=50)
        self.tree.column("Sale ID", width=80)
        self.tree.column("Customer Name", width=150)
        self.tree.column("Product", width=150)
        self.tree.column("Sale Amount", width=120)
        self.tree.column("Credit Amount", width=120)
        self.tree.column("Created At", width=150)
        self.tree.column("Status", width=80)

        # Add scrollbar
        scrollbar = ttk.Scrollbar(self.tree_frame, orient="vertical", command=self.tree.yview)
        scrollbar.pack(side="right", fill="y")
        self.tree.configure(yscrollcommand=scrollbar.set)
        
        # Bind events
        self.tree.bind("<Double-1>", lambda e: self.view_credit_details())
        self.tree.bind("<Button-3>", self.show_context_menu)

        # Buttons frame
        self.button_frame = ctk.CTkFrame(self)
        self.button_frame.pack(fill="x", padx=20, pady=10)

        # Buttons
        self.update_button = ctk.CTkButton(
            self.button_frame,
            text="Update Credit",
            command=self.update_credit
        )
        self.update_button.pack(side="left", padx=5)

        self.delete_button = ctk.CTkButton(
            self.button_frame,
            text="Delete Credit",
            command=self.delete_credit
        )
        self.delete_button.pack(side="left", padx=5)

        self.paid_button = ctk.CTkButton(
            self.button_frame,
            text="Mark as Paid",
            command=self.mark_as_paid
        )
        self.paid_button.pack(side="left", padx=5)

        self.view_sale_button = ctk.CTkButton(
            self.button_frame,
            text="View Sale Details",
            command=self.view_sale_details
        )
        self.view_sale_button.pack(side="left", padx=5)

        self.refresh_button = ctk.CTkButton(
            self.button_frame,
            text="Refresh",
            command=self.load_credits
        )
        self.refresh_button.pack(side="left", padx=5)

    def show_context_menu(self, event):
        """Display right-click context menu"""
        # Select item on right click
        item = self.tree.identify_row(event.y)
        if item:
            self.tree.selection_set(item)
            
            # Create menu
            menu = tk.Menu(self, tearoff=0)
            menu.add_command(label="View Credit Details", command=self.view_credit_details)
            menu.add_command(label="Update Credit", command=self.update_credit)
            menu.add_command(label="Mark as Paid", command=self.mark_as_paid)
            menu.add_separator()
            menu.add_command(label="View Sale Details", command=self.view_sale_details)
            menu.add_separator()
            menu.add_command(label="Delete Credit", command=self.delete_credit)
            menu.add_command(label="Refresh List", command=self.load_credits)
            
            # Show menu
            menu.post(event.x_root, event.y_root)

    def view_credit_details(self):
        """View credit details in a read-only window"""
        selected = self.tree.selection()
        if not selected:
            return
            
        credit_data = self.tree.item(selected[0])["values"]
        credit_id = credit_data[0]
        
        try:
            # Create a new window to display credit details
            details_window = ctk.CTkToplevel(self)
            details_window.title("Credit Record Details")
            details_window.geometry("500x500")
            details_window.transient(self)
            details_window.grab_set()

            main_frame = ctk.CTkFrame(details_window)
            main_frame.pack(fill="both", expand=True, padx=20, pady=20)

            ctk.CTkLabel(main_frame, text="💰 Credit Information", font=ctk.CTkFont(size=20, weight="bold")).pack(pady=(0, 20))
            
            def add_detail(label, value):
                f = ctk.CTkFrame(main_frame, fg_color="transparent")
                f.pack(fill="x", pady=5)
                ctk.CTkLabel(f, text=label, width=150, anchor="w", font=ctk.CTkFont(weight="bold")).pack(side="left")
                ctk.CTkLabel(f, text=str(value), anchor="w").pack(side="left", fill="x", expand=True)

            add_detail("Credit ID:", credit_id)
            add_detail("Sale ID:", credit_data[1])
            add_detail("Customer:", credit_data[2])
            add_detail("Product:", credit_data[3])
            add_detail("Sale Amount:", credit_data[4])
            add_detail("Credit Balance:", credit_data[5])
            add_detail("Created On:", credit_data[6])
            add_detail("Current Status:", credit_data[7])
            
            # Action Buttons
            btn_frame = ctk.CTkFrame(main_frame, fg_color="transparent")
            btn_frame.pack(fill="x", pady=(30, 0))
            
            ctk.CTkButton(btn_frame, text="Edit This Credit", command=lambda: [details_window.destroy(), self.update_credit()], fg_color="orange").pack(side="left", padx=10, fill="x", expand=True)
            ctk.CTkButton(btn_frame, text="Close", command=details_window.destroy).pack(side="left", padx=10, fill="x", expand=True)

        except Exception as e:
            messagebox.showerror("Error", f"Failed to load details: {e}")

    def view_sale_details(self):
        """Show details of the selected sale"""
        selected = self.tree.selection()
        if not selected:
            messagebox.showwarning("Warning", "Please select a credit to view its sale details")
            return

        try:
            # Get the sale ID from the selected credit
            credit_data = self.tree.item(selected[0])['values']
            sale_id = credit_data[1]  # Sale ID is at index 1
            
            # Create a new window to display sale details
            details_window = ctk.CTkToplevel(self)
            details_window.title("Sale Details")
            details_window.geometry("600x400")

            # Create a frame for the details
            details_frame = ctk.CTkFrame(details_window)
            details_frame.pack(fill="both", expand=True, padx=20, pady=10)

            # Fetch sale details from database
            connection = self.db.connection
            if not connection:
                messagebox.showerror("Database Error", "Failed to connect to database")
                return

            with connection.cursor() as cursor:
                # Get sale information
                cursor.execute("""
                    SELECT s.*, c.name as customer_name
                    FROM sales s
                    LEFT JOIN customers c ON s.customer_id = c.id
                    WHERE s.id = %s
                """, (sale_id,))
                sale = cursor.fetchone()

                if not sale:
                    messagebox.showerror("Error", "Sale not found")
                    details_window.destroy()
                    return

                # Display sale information
                info_frame = ctk.CTkFrame(details_frame)
                info_frame.pack(fill="x", padx=10, pady=10)

                # Sale ID
                ctk.CTkLabel(info_frame, text="Sale ID:", font=ctk.CTkFont(weight="bold")).grid(row=0, column=0, sticky="w", padx=5, pady=2)
                ctk.CTkLabel(info_frame, text=str(sale['id'])).grid(row=0, column=1, sticky="w", padx=5, pady=2)

                # Customer Name
                ctk.CTkLabel(info_frame, text="Customer:", font=ctk.CTkFont(weight="bold")).grid(row=1, column=0, sticky="w", padx=5, pady=2)
                ctk.CTkLabel(info_frame, text=sale['customer_name'] or "Walk-in Customer").grid(row=1, column=1, sticky="w", padx=5, pady=2)

                # Sale Date
                ctk.CTkLabel(info_frame, text="Date:", font=ctk.CTkFont(weight="bold")).grid(row=2, column=0, sticky="w", padx=5, pady=2)
                ctk.CTkLabel(info_frame, text=format_datetime(sale['created_at'])).grid(row=2, column=1, sticky="w", padx=5, pady=2)

                # Total Amount
                ctk.CTkLabel(info_frame, text="Total Amount:", font=ctk.CTkFont(weight="bold")).grid(row=3, column=0, sticky="w", padx=5, pady=2)
                ctk.CTkLabel(info_frame, text=format_currency(sale['total_amount'])).grid(row=3, column=1, sticky="w", padx=5, pady=2)

                # Status
                ctk.CTkLabel(info_frame, text="Status:", font=ctk.CTkFont(weight="bold")).grid(row=4, column=0, sticky="w", padx=5, pady=2)
                ctk.CTkLabel(info_frame, text=sale['status']).grid(row=4, column=1, sticky="w", padx=5, pady=2)

                # Create a frame for credit information
                credit_frame = ctk.CTkFrame(details_frame)
                credit_frame.pack(fill="x", padx=10, pady=10)

                # Get credit information
                cursor.execute("""
                    SELECT * FROM credits WHERE sale_id = %s
                """, (sale_id,))
                credit = cursor.fetchone()

                if credit:
                    # Credit ID
                    ctk.CTkLabel(credit_frame, text="Credit ID:", font=ctk.CTkFont(weight="bold")).grid(row=0, column=0, sticky="w", padx=5, pady=2)
                    ctk.CTkLabel(credit_frame, text=str(credit['id'])).grid(row=0, column=1, sticky="w", padx=5, pady=2)

                    # Credit Amount
                    ctk.CTkLabel(credit_frame, text="Credit Amount:", font=ctk.CTkFont(weight="bold")).grid(row=1, column=0, sticky="w", padx=5, pady=2)
                    ctk.CTkLabel(credit_frame, text=format_currency(credit['amount'])).grid(row=1, column=1, sticky="w", padx=5, pady=2)

                    # Credit Status
                    ctk.CTkLabel(credit_frame, text="Credit Status:", font=ctk.CTkFont(weight="bold")).grid(row=2, column=0, sticky="w", padx=5, pady=2)
                    ctk.CTkLabel(credit_frame, text=credit['status']).grid(row=2, column=1, sticky="w", padx=5, pady=2)

                    # Due Date (if exists)
                    if 'due_date' in credit and credit['due_date']:
                        ctk.CTkLabel(credit_frame, text="Due Date:", font=ctk.CTkFont(weight="bold")).grid(row=3, column=0, sticky="w", padx=5, pady=2)
                        ctk.CTkLabel(credit_frame, text=format_datetime(credit['due_date'])).grid(row=3, column=1, sticky="w", padx=5, pady=2)

        except Exception as e:
            messagebox.showerror("Error", f"Failed to load sale details: {str(e)}")

    def check_credits_table(self):
        """Check if credits table exists and has the required columns"""
        try:
            connection = self.db.connection
            if not connection:
                return

            with connection.cursor() as cursor:
                # Check if table exists
                cursor.execute("""
                    SELECT COUNT(*) as count 
                    FROM information_schema.tables 
                    WHERE table_schema = 'inventory_db' 
                    AND table_name = 'credits'
                """)
                table_exists = cursor.fetchone()['count'] > 0
                print(f"Debug: Credits table exists: {table_exists}")

                if table_exists:
                    # Check if status column exists
                    cursor.execute("""
                        SHOW COLUMNS FROM credits LIKE 'status'
                    """)
                    status_column_exists = cursor.fetchone()
                    print(f"Debug: Status column exists: {status_column_exists is not None}")
                    
                    # Add status column if it doesn't exist
                    if not status_column_exists:
                        print("Debug: Adding status column to credits table")
                        cursor.execute("""
                            ALTER TABLE credits 
                            ADD COLUMN status ENUM('Unpaid','Paid') DEFAULT 'Unpaid'
                        """)
                        connection.commit()
                        print("Debug: Status column added successfully")
                    
                    # Check if due_date column exists
                    cursor.execute("""
                        SHOW COLUMNS FROM credits LIKE 'due_date'
                    """)
                    due_date_column_exists = cursor.fetchone()
                    print(f"Debug: Due date column exists: {due_date_column_exists is not None}")
                    
                    # Add due_date column if it doesn't exist
                    if not due_date_column_exists:
                        print("Debug: Adding due_date column to credits table")
                        cursor.execute("""
                            ALTER TABLE credits 
                            ADD COLUMN due_date DATE
                        """)
                        connection.commit()
                        print("Debug: Due date column added successfully")

        except pymysql.Error as e:
            print(f"Debug: Error checking credits table: {e}")

    def open_credit_window(self):
        """Open the credit management window in the dashboard frame"""
        try:
            # Import CreditWindow if not already imported
            from credit import CreditWindow
            
            # Use the dashboard reference if available
            if self.dashboard:
                dashboard = self.dashboard
            else:
                # Try to find the dashboard frame
                dashboard = None
                
                # First, try to find it by navigating up the widget hierarchy
                widget = self.master
                while widget:
                    if hasattr(widget, 'main_content') and hasattr(widget, 'user_data'):
                        dashboard = widget
                        break
                    widget = widget.master
                
                # If not found, try to find it through the root window
                if not dashboard:
                    root = self.winfo_toplevel()
                    for child in root.winfo_children():
                        if hasattr(child, 'main_content') and hasattr(child, 'user_data'):
                            dashboard = child
                            break
                
                if not dashboard:
                    raise Exception("Dashboard frame not found")
            
            # Clear the main content area of the dashboard
            dashboard.clear_main_content()
            
            # Create credit window in the dashboard's main content area
            credit_window = CreditWindow(dashboard.main_content, dashboard.user_data)
            
            # Show the window in the dashboard's main content area
            credit_window.pack(fill="both", expand=True)
            
            print("Debug: Credit window opened in dashboard")
        except Exception as e:
            print(f"Debug: Error opening credit window in dashboard: {e}")
            messagebox.showerror("Error", f"Error opening credit management: {e}")
                
    def load_credits(self):
        """Load credits from database into treeview"""
        # Clear existing items
        for item in self.tree.get_children():
            self.tree.delete(item)

        try:
            # Get database connection using the db object
            connection = self.db.connection
            if not connection:
                messagebox.showerror("Database Error", "Failed to connect to database")
                return

            with connection.cursor() as cursor:
                # Check if status column exists
                cursor.execute("""
                    SHOW COLUMNS FROM credits LIKE 'status'
                """)
                status_column_exists = cursor.fetchone()
                
                # Build query based on available columns
                if status_column_exists:
                    query = """
                        SELECT c.id, c.sale_id, c.customer_name, c.amount, c.created_at, c.status,
                            p.name as product_name, s.total_amount as sale_amount
                        FROM credits c
                        JOIN sales s ON c.sale_id = s.id
                        JOIN products p ON s.product_id = p.id
                        ORDER BY c.created_at DESC
                    """
                else:
                    query = """
                        SELECT c.id, c.sale_id, c.customer_name, c.amount, c.created_at, 'Unpaid' as status,
                            p.name as product_name, s.total_amount as sale_amount
                        FROM credits c
                        JOIN sales s ON c.sale_id = s.id
                        JOIN products p ON s.product_id = p.id
                        ORDER BY c.created_at DESC
                    """
                
                # Execute query
                cursor.execute(query)
                credits = cursor.fetchall()

                # Debug: Print the number of credits found and their raw data
                print(f"Debug: Found {len(credits)} credits")
                for i, credit in enumerate(credits):
                    print(f"Debug: Credit {i}: {credit}")

                for credit in credits:
                    # Format date for display
                    formatted_date = credit['created_at'].strftime("%Y-%m-%d %H:%M") if credit['created_at'] else ""
                    # Format currency as Leones
                    formatted_amount = f"Le {credit['amount']:,.2f}"
                    formatted_sale_amount = f"Le {credit['sale_amount']:,.2f}"
                    
                    # Debug: Print the formatted values
                    print(f"Debug: Formatted amount: {formatted_amount}, date: {formatted_date}")
                    print(f"Debug: Product name: {credit['product_name']}, Sale amount: {formatted_sale_amount}")
                    
                    # Create values tuple for treeview
                    tree_values = (
                        credit['id'],  # id
                        credit['sale_id'],  # sale_id
                        credit['customer_name'],  # customer_name
                        credit['product_name'],  # product_name
                        formatted_sale_amount,  # sale_amount formatted
                        formatted_amount,  # credit_amount formatted
                        formatted_date,  # created_at formatted
                        credit['status']  # status
                    )
                    
                    # Debug: Print the values being inserted
                    print(f"Debug: Inserting into treeview: {tree_values}")
                    
                    # Insert credit into treeview
                    item = self.tree.insert("", "end", values=tree_values)
                    
                    # Debug: Verify the item was inserted correctly
                    item_values = self.tree.item(item)['values']
                    print(f"Debug: Treeview item values: {item_values}")

        except pymysql.Error as e:
            print(f"Debug: Database error: {e}")  # Debug print
            messagebox.showerror("Database Error", f"Error loading credits: {e}")
        except Exception as e:
            print(f"Debug: Unexpected error: {e}")  # Debug print
            messagebox.showerror("Error", f"Unexpected error loading credits: {e}")

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
            print(f"Debug: Connection error: {e}")  # Debug print
            messagebox.showerror("Database Error", f"Error connecting to database: {e}")
            return None

    def show_credit_sale_window(self):
        """Show window to complete a sale on credit"""
        credit_sale_window = ctk.CTkToplevel(self)
        credit_sale_window.title("Complete Sale on Credit")
        credit_sale_window.geometry("700x600")

        # Create form frame
        form_frame = ctk.CTkFrame(credit_sale_window)
        form_frame.pack(fill="both", expand=True, padx=20, pady=10)

        # Product selection
        ctk.CTkLabel(form_frame, text="Product:").grid(row=0, column=0, padx=10, pady=5, sticky="w")
        self.product_entry = ctk.CTkComboBox(form_frame)
        self.product_entry.grid(row=0, column=1, padx=10, pady=5, sticky="ew")
        
        # Product info labels
        self.product_info_frame = ctk.CTkFrame(form_frame)
        self.product_info_frame.grid(row=1, column=0, columnspan=2, padx=10, pady=5, sticky="ew")
        
        self.stock_label = ctk.CTkLabel(self.product_info_frame, text="Stock: N/A")
        self.stock_label.pack(side="left", padx=10)
        
        self.price_label = ctk.CTkLabel(self.product_info_frame, text="Price: N/A")
        self.price_label.pack(side="left", padx=10)
        
        # Amount entry
        amount_frame = ctk.CTkFrame(form_frame)
        amount_frame.grid(row=2, column=0, columnspan=2, padx=10, pady=5, sticky="ew")
        
        ctk.CTkLabel(amount_frame, text="Amount:").pack(side="left", padx=10)
        self.amount_entry = ctk.CTkEntry(amount_frame)
        self.amount_entry.pack(side="left", padx=10, fill="x", expand=True)
        
        # Quantity entry
        quantity_frame = ctk.CTkFrame(form_frame)
        quantity_frame.grid(row=3, column=0, columnspan=2, padx=10, pady=5, sticky="ew")
        
        ctk.CTkLabel(quantity_frame, text="Quantity:").pack(side="left", padx=10)
        self.quantity_entry = ctk.CTkEntry(quantity_frame)
        self.quantity_entry.pack(side="left", padx=10)
        self.quantity_entry.insert(0, "1")
        
        # Customer name entry
        customer_frame = ctk.CTkFrame(form_frame)
        customer_frame.grid(row=4, column=0, columnspan=2, padx=10, pady=5, sticky="ew")
        
        ctk.CTkLabel(customer_frame, text="Customer Name:").pack(side="left", padx=10)
        self.customer_entry = ctk.CTkEntry(customer_frame)
        self.customer_entry.pack(side="left", padx=10, fill="x", expand=True)

        # Due date entry
        due_date_frame = ctk.CTkFrame(form_frame)
        due_date_frame.grid(row=5, column=0, columnspan=2, padx=10, pady=5, sticky="ew")
        
        ctk.CTkLabel(due_date_frame, text="Due Date:").pack(side="left", padx=10)
        self.due_date_entry = ctk.CTkEntry(due_date_frame)
        self.due_date_entry.pack(side="left", padx=10, fill="x", expand=True)
        # Set default due date to 30 days from now
        default_due_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
        self.due_date_entry.insert(0, default_due_date)

        # Configure column weights
        form_frame.columnconfigure(1, weight=1)

        # Create treeview frame
        tree_frame = ctk.CTkFrame(credit_sale_window)
        tree_frame.pack(fill="both", expand=True, padx=20, pady=10)

        # Create treeview with scrollbar
        self.sales_tree = ttk.Treeview(
            tree_frame,
            columns=("Product", "Quantity", "Price", "Total"),
            show="headings"
        )
        self.sales_tree.pack(side="left", fill="both", expand=True)

        # Define headings
        self.sales_tree.heading("Product", text="Product")
        self.sales_tree.heading("Quantity", text="Quantity")
        self.sales_tree.heading("Price", text=f"Price ({CURRENCY_SYMBOL})")
        self.sales_tree.heading("Total", text=f"Total ({CURRENCY_SYMBOL})")

        # Configure column widths
        self.sales_tree.column("Product", width=200)
        self.sales_tree.column("Quantity", width=80)
        self.sales_tree.column("Price", width=100)
        self.sales_tree.column("Total", width=100)

        # Add scrollbar
        scrollbar = ttk.Scrollbar(tree_frame, orient="vertical", command=self.sales_tree.yview)
        scrollbar.pack(side="right", fill="y")
        self.sales_tree.configure(yscrollcommand=scrollbar.set)

        # Total amount frame
        total_frame = ctk.CTkFrame(credit_sale_window)
        total_frame.pack(fill="x", padx=20, pady=10)
        
        self.total_label = ctk.CTkLabel(
            total_frame, 
            text=f"Total Amount: {CURRENCY_SYMBOL}0.00", 
            font=ctk.CTkFont(size=16, weight="bold")
        )
        self.total_label.pack(side="right", padx=10)

        # Buttons frame
        button_frame = ctk.CTkFrame(credit_sale_window)
        button_frame.pack(fill="x", padx=20, pady=10)

        # Add item button
        add_button = ctk.CTkButton(
            button_frame,
            text="Add Item",
            command=self.add_item_to_credit
        )
        add_button.pack(side="left", padx=5)

        # Remove item button
        remove_button = ctk.CTkButton(
            button_frame,
            text="Remove Item",
            command=self.remove_item_from_credit
        )
        remove_button.pack(side="left", padx=5)

        # Complete sale button
        complete_button = ctk.CTkButton(
            button_frame,
            text="Complete Credit Sale",
            command=self.complete_credit_sale
        )
        complete_button.pack(side="right", padx=5)

        # Cancel button
        cancel_button = ctk.CTkButton(
            button_frame,
            text="Cancel",
            command=credit_sale_window.destroy
        )
        cancel_button.pack(side="right", padx=5)

        # Load products into the combobox
        try:
            # Get products from database
            products = self.db.execute_query("SELECT id, name, selling_price, stock_quantity FROM products WHERE stock_quantity > 0 ORDER BY name")
            
            if products:
                # Create a list of product names for the combobox
                product_names = [product[1] for product in products]
                self.product_entry.configure(values=product_names)
                
                # Store product data for later use
                self.products_data = {product[1]: {'id': product[0], 'price': product[2], 'stock': product[3]} for product in products}
                
                # Set up callback to update product info when product is selected
                def product_selected(event=None):
                    selected_product = self.product_entry.get()
                    if selected_product in self.products_data:
                        # Update product info labels
                        product_data = self.products_data[selected_product]
                        self.stock_label.configure(text=f"Stock: {product_data['stock']}")
                        self.price_label.configure(text=f"Price: {format_currency(product_data['price'])}")
                        
                        # Auto-fill the price and calculate amount
                        try:
                            quantity = float(self.quantity_entry.get() or "1")
                            price = product_data['price']
                            amount = price * quantity
                            self.amount_entry.delete(0, "end")
                            self.amount_entry.insert(0, str(amount))
                        except ValueError:
                            pass
                
                self.product_entry.configure(command=product_selected)
                
                # Set up callback to update amount when quantity changes
                def quantity_changed(event=None):
                    selected_product = self.product_entry.get()
                    if selected_product in self.products_data:
                        try:
                            quantity = float(self.quantity_entry.get() or "1")
                            price = self.products_data[selected_product]['price']
                            amount = price * quantity
                            self.amount_entry.delete(0, "end")
                            self.amount_entry.insert(0, str(amount))
                        except ValueError:
                            pass
                
                self.quantity_entry.bind("<KeyRelease>", quantity_changed)
            else:
                messagebox.showinfo("Info", "No products available in stock")
                credit_sale_window.destroy()
                return
            
        except Exception as e:
            messagebox.showerror("Database Error", f"Error loading products: {str(e)}")
            credit_sale_window.destroy()
            return

        # Store reference to window
        self.credit_sale_window = credit_sale_window

    def add_item_to_credit(self):
        """Add an item to the credit sale"""
        product = self.product_entry.get()
        amount_text = self.amount_entry.get()
        quantity_text = self.quantity_entry.get()
        
        if not product:
            messagebox.showwarning("Warning", "Please select a product")
            return
        
        if not amount_text:
            messagebox.showwarning("Warning", "Please enter an amount")
            return
        
        if not quantity_text:
            messagebox.showwarning("Warning", "Please enter a quantity")
            return
        
        try:
            amount = float(amount_text)
            quantity = float(quantity_text)
            
            if amount <= 0:
                raise ValueError("Amount must be positive")
            
            if quantity <= 0:
                raise ValueError("Quantity must be positive")
            
            # Get product price
            if product in self.products_data:
                price = self.products_data[product]['price']
                
                # Add to treeview
                self.sales_tree.insert("", "end", values=(
                    product, 
                    quantity, 
                    format_currency(price), 
                    format_currency(amount)
                ))
                
                # Update total amount
                self.update_total_amount()
                
                # Clear entries
                self.product_entry.set("")
                self.amount_entry.delete(0, "end")
                self.quantity_entry.delete(0, "end")
                self.quantity_entry.insert(0, "1")
                self.stock_label.configure(text="Stock: N/A")
                self.price_label.configure(text="Price: N/A")
            else:
                messagebox.showwarning("Warning", f"Product not found: {product}")
            
        except ValueError as e:
            messagebox.showwarning("Warning", str(e))

    def remove_item_from_credit(self):
        """Remove selected item from credit sale"""
        selected = self.sales_tree.selection()
        if not selected:
            messagebox.showwarning("Warning", "Please select an item to remove")
            return
        
        self.sales_tree.delete(selected)
        
        # Update total amount
        self.update_total_amount()

    def update_total_amount(self):
        """Update the total amount label based on items in the treeview"""
        total = 0.0
        
        for item_id in self.sales_tree.get_children():
            item = self.sales_tree.item(item_id)['values']
            amount_text = item[3].replace(CURRENCY_SYMBOL, "").strip()
            try:
                amount = float(amount_text)
                total += amount
            except ValueError:
                pass
        
        self.total_label.configure(text=f"Total Amount: {format_currency(total)}")

    def complete_credit_sale(self):
        """Complete the credit sale"""
        # Get customer name
        customer_name = self.customer_entry.get()
        if not customer_name:
            messagebox.showwarning("Warning", "Please enter customer name")
            return
        
        # Get due date
        due_date = self.due_date_entry.get()
        if not due_date:
            messagebox.showwarning("Warning", "Please enter due date")
            return
        
        # Get items from treeview
        items = []
        for item_id in self.sales_tree.get_children():
            item = self.sales_tree.item(item_id)['values']
            product_name = item[0]
            quantity = item[1]
            price_text = item[2].replace(CURRENCY_SYMBOL, "").strip()
            amount_text = item[3].replace(CURRENCY_SYMBOL, "").strip()
            
            try:
                price = float(price_text)
                amount = float(amount_text)
                
                # Get product ID
                if product_name in self.products_data:
                    product_id = self.products_data[product_name]['id']
                    items.append((product_id, product_name, quantity, price, amount))
                else:
                    messagebox.showwarning("Warning", f"Product not found: {product_name}")
                    return
            except ValueError:
                messagebox.showwarning("Warning", f"Invalid amount for product: {product_name}")
                return
        
        if not items:
            messagebox.showwarning("Warning", "Please add at least one item")
            return
        
        # Calculate total amount
        total_amount = sum(amount for _, _, _, _, amount in items)
        
        try:
            # Create invoice number
            import time
            invoice_no = f"CR-{datetime.now().strftime('%Y%m%d')}-{int(time.time()) % 1000:03d}"

            # Since the sales table requires product_id, quantity, and unit_price for each row,
            # and complete_credit_sale allows multiple items, we'll insert each item as a separate sale record
            # sharing the same customer name and marked as 'Credit'.
            # Alternatively, we could update the schema, but inserting per item is safer for now.
            
            total_sale_id = None
            for product_id, product_name, quantity, price, amount in items:
                current_sale_id = self.db.execute_query(
                    """INSERT INTO sales (invoice_number, product_id, quantity, unit_price, total_amount, 
                       payment_method, payment_status, customer_name, status, created_at) 
                       VALUES (%s, %s, %s, %s, %s, 'Credit', 'Unpaid', %s, 'completed', NOW())""",
                    (invoice_no, product_id, quantity, price, amount, customer_name)
                )
                if total_sale_id is None:
                    total_sale_id = current_sale_id

            # Create ONE credit record for the entire transaction (using the first sale_id as reference)
            self.db.execute_query(
                "INSERT INTO credits (sale_id, customer_name, amount, status, due_date) VALUES (%s, %s, %s, 'Unpaid', %s)",
                (total_sale_id, customer_name, total_amount, due_date)
            )
            
            # Update product stock quantities in the stock table
            for product_id, _, quantity, _, _ in items:
                self.db.execute_query(
                    "UPDATE stock SET quantity = quantity - %s WHERE product_id = %s",
                    (quantity, product_id)
                )
            
            messagebox.showinfo("Success", f"Credit sale completed successfully\nInvoice: {invoice_no}")
            self.credit_sale_window.destroy()
            self.load_credits()
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to complete credit sale: {str(e)}")

    def update_credit(self):
        selected = self.tree.selection()
        if not selected:
            messagebox.showwarning("Warning", "Please select a credit to update")
            return

        credit_data = self.tree.item(selected[0])['values']
        credit_id = credit_data[0]

        update_window = ctk.CTkToplevel(self)
        update_window.title("Update Credit")
        update_window.geometry("400x300")

        # Customer Name
        ctk.CTkLabel(update_window, text="Customer Name:").grid(row=0, column=0, padx=10, pady=5)
        customer_entry = ctk.CTkEntry(update_window)
        customer_entry.insert(0, credit_data[2])
        customer_entry.grid(row=0, column=1, padx=10, pady=5)

        # Amount
        ctk.CTkLabel(update_window, text=f"Amount ({CURRENCY_SYMBOL}):").grid(row=1, column=0, padx=10, pady=5)
        amount_entry = ctk.CTkEntry(update_window)
        amount_entry.insert(0, str(credit_data[3]).replace(CURRENCY_SYMBOL, "").strip())
        amount_entry.grid(row=1, column=1, padx=10, pady=5)

        def save_update():
            try:
                customer = customer_entry.get()
                amount = float(amount_entry.get().replace(CURRENCY_SYMBOL, "").strip())

                if not customer:
                    messagebox.showwarning("Warning", "Please fill in customer name")
                    return

                self.db.execute_query("""
                    UPDATE credits 
                    SET customer_name = %s, amount = %s 
                    WHERE id = %s
                """, (customer, amount, credit_id))
                
                messagebox.showinfo("Success", "Credit updated successfully")
                update_window.destroy()
                self.load_credits()
                
            except ValueError:
                messagebox.showwarning("Warning", "Invalid amount")
            except Exception as e:
                messagebox.showerror("Error", f"Failed to update credit: {str(e)}")

        ctk.CTkButton(update_window, text="Save", command=save_update).grid(row=2, column=0, columnspan=2, pady=20)

    def delete_credit(self):
        selected = self.tree.selection()
        if not selected:
            messagebox.showwarning("Warning", "Please select a credit to delete")
            return

        if messagebox.askyesno("Confirm", "Are you sure you want to delete this credit?"):
            try:
                credit_id = self.tree.item(selected[0])['values'][0]
                
                self.db.execute_query("DELETE FROM credits WHERE id = %s", (credit_id,))
                
                messagebox.showinfo("Success", "Credit deleted successfully")
                self.load_credits()
                
            except Exception as e:
                messagebox.showerror("Error", f"Failed to delete credit: {str(e)}")

    def mark_as_paid(self):
        selected = self.tree.selection()
        if not selected:
            messagebox.showwarning("Warning", "Please select a credit to mark as paid")
            return

        try:
            # Get credit_id and sale_id (Sale ID is at index 1 in treeview)
            values = self.tree.item(selected[0])['values']
            credit_id = values[0]
            sale_id = values[1]
            
            # 1. Update credit status
            self.db.execute_query("UPDATE credits SET status = 'Paid' WHERE id = %s", (credit_id,))
            
            # 2. Update corresponding sales status
            self.db.execute_query("UPDATE sales SET payment_status = 'Paid' WHERE id = %s", (sale_id,))
            
            messagebox.showinfo("Success", "Payment completed! Credit and Sale records updated.")
            self.load_credits()
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to complete payment: {str(e)}")
         values = self.tree.item(selected[0])['values']
            credit_id = values[0]
            sale_id = values[1]
            
            # 1. Update credit status
            self.db.execute_query("UPDATE credits SET status = 'Paid' WHERE id = %s", (credit_id,))
            
            # 2. Update corresponding sales status
            self.db.execute_query("UPDATE sales SET payment_status = 'Paid' WHERE id = %s", (sale_id,))
            
            messagebox.showinfo("Success", "Payment completed! Credit and Sale records updated.")
            self.load_credits()
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to complete payment: {str(e)}")
