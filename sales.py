import customtkinter as ctk
import tkinter as tk
from tkinter import ttk, messagebox
import pymysql
import os
import time
from datetime import datetime, timedelta
from utils import format_currency, parse_currency
from database import Database

class SalesWindow(ctk.CTkFrame):
    def __init__(self, parent_frame, user_data, dashboard=None):
        super().__init__(parent_frame)
        self.user_data = user_data
        self.dashboard = dashboard
        self.db = Database()
        
        # Configure grid weights for parent frame
        self.grid(row=0, column=0, sticky="nsew")
        parent_frame.grid_rowconfigure(0, weight=1)
        parent_frame.grid_columnconfigure(0, weight=1)
        
        # Create a container frame inside parent_frame
        self.container = ctk.CTkFrame(self)
        self.container.pack(fill="both", expand=True, padx=10, pady=10)
        
        # Title Label
        self.title_label = ctk.CTkLabel(self.container, text="Sales Management", 
                                      font=ctk.CTkFont(size=20, weight="bold"))
        self.title_label.pack(pady=(10, 10))

        # Search and Filter Frame
        self.search_frame = ctk.CTkFrame(self.container)
        self.search_frame.pack(fill="x", padx=10, pady=(0, 10))

        # Search Entry
        self.search_entry = ctk.CTkEntry(self.search_frame, placeholder_text="Search sales...")
        self.search_entry.pack(side="left", fill="x", expand=True, padx=(0, 5))
        
        # Search Button
        self.search_button = ctk.CTkButton(self.search_frame, text="Search", command=self.search_sales,
                                        fg_color="#1E88E5", hover_color="#1565C0")
        self.search_button.pack(side="left", padx=5)
        
        # Date Filter
        self.date_filter_var = ctk.StringVar(value="All Time")
        self.date_filter_dropdown = ctk.CTkOptionMenu(
            self.search_frame,
            variable=self.date_filter_var,
            values=["All Time", "Today", "Yesterday", "This Week", "Last Week", "This Month", "Last Month", "This Year"],
            command=lambda _: self.refresh_sales()
        )
        self.date_filter_dropdown.pack(side="left", padx=5)
        
        # Buttons Frame
        self.buttons_frame = ctk.CTkFrame(self.container)
        self.buttons_frame.pack(fill="x", padx=10, pady=(0, 10))

        self.add_button = ctk.CTkButton(self.buttons_frame, text="Add Sale", command=self.add_sale,
                                    fg_color="#43A047", hover_color="#2E7D32")
        self.add_button.pack(side="left", padx=5)
        
        self.refresh_button = ctk.CTkButton(self.buttons_frame, text="Refresh", command=self.refresh_sales,
                                        fg_color="#8E24AA", hover_color="#6A1B9A")
        self.refresh_button.pack(side="left", padx=5)

        self.export_button = ctk.CTkButton(self.buttons_frame, text="Export CSV", command=self.export_sales_data,
                                         fg_color="#607D8B", hover_color="#455A64")
        self.export_button.pack(side="left", padx=5)
        
        # Treeview
        self.tree_frame = ctk.CTkFrame(self.container)
        self.tree_frame.pack(fill="both", expand=True, padx=10, pady=(0, 10))
        
        self.tree = ttk.Treeview(self.tree_frame, columns=("ID", "Invoice", "Product", "Qty", "Total", "Date", "Payment", "Customer"), show="headings")
        self.tree.pack(side="left", fill="both", expand=True)
        
        # Define headings
        self.tree.heading("ID", text="ID")
        self.tree.heading("Invoice", text="Invoice #")
        self.tree.heading("Product", text="Product")
        self.tree.heading("Qty", text="Qty")
        self.tree.heading("Total", text="Total")
        self.tree.heading("Date", text="Date")
        self.tree.heading("Payment", text="Payment")
        self.tree.heading("Customer", text="Customer")
        
        # Configure columns
        self.tree.column("ID", width=40)
        self.tree.column("Invoice", width=120)
        self.tree.column("Product", width=150)
        self.tree.column("Qty", width=50)
        self.tree.column("Total", width=100)
        self.tree.column("Date", width=150)
        self.tree.column("Payment", width=100)
        self.tree.column("Customer", width=150)
            
        scrollbar = ttk.Scrollbar(self.tree_frame, orient="vertical", command=self.tree.yview)
        scrollbar.pack(side="right", fill="y")
        self.tree.configure(yscrollcommand=scrollbar.set)
        
        # Bind events
        self.tree.bind("<Double-1>", self.on_double_click)
        self.tree.bind("<Button-3>", self.show_context_menu)
        
        self.refresh_sales()

    def on_double_click(self, event):
        """Show receipt on double click"""
        selected = self.tree.selection()
        if selected:
            self.view_receipt()

    def show_context_menu(self, event):
        """Display right-click context menu"""
        item = self.tree.identify_row(event.y)
        if item:
            self.tree.selection_set(item)
            menu = tk.Menu(self, tearoff=0)
            menu.add_command(label="View Receipt", command=self.view_receipt)
            menu.add_separator()
            menu.add_command(label="Refresh List", command=self.refresh_sales)
            menu.post(event.x_root, event.y_root)

    def view_receipt(self):
        """View receipt for selected sale"""
        selected = self.tree.selection()
        if not selected:
            return
            
        sale_data = self.tree.item(selected[0])["values"]
        # Map values back to data dictionary for show_receipt
        total_val = parse_currency(str(sale_data[4]))
        qty_val = int(sale_data[3])
        
        data = {
            'invoice': sale_data[1],
            'product': sale_data[2],
            'qty': qty_val,
            'total': total_val,
            'date': sale_data[5],
            'payment': sale_data[6],
            'customer': sale_data[7],
            # We need price per unit
            'price': total_val / qty_val if qty_val > 0 else 0
        }
        self.show_receipt(data)

    def refresh_sales(self):
        for item in self.tree.get_children():
            self.tree.delete(item)
            
        try:
            filter_val = self.date_filter_var.get()
            condition = ""
            if filter_val == "Today": condition = "WHERE DATE(s.date) = CURDATE()"
            elif filter_val == "Yesterday": condition = "WHERE DATE(s.date) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)"
            elif filter_val == "This Week": condition = "WHERE YEARWEEK(s.date, 1) = YEARWEEK(CURDATE(), 1)"
            elif filter_val == "Last Week": condition = "WHERE YEARWEEK(s.date, 1) = YEARWEEK(DATE_SUB(CURDATE(), INTERVAL 1 WEEK), 1)"
            elif filter_val == "This Month": condition = "WHERE MONTH(s.date) = MONTH(CURDATE()) AND YEAR(s.date) = YEAR(CURDATE())"
            
            query = f"""
                SELECT s.id, s.invoice_number, p.name as product_name, s.quantity, s.total_amount, s.date, s.payment_method, s.customer_name
                FROM sales s
                JOIN products p ON s.product_id = p.id
                {condition}
                ORDER BY s.date DESC
            """
            sales = self.db.execute_query(query)
            
            for s in sales:
                self.tree.insert("", "end", values=(
                    s['id'], 
                    s['invoice_number'] or "N/A",
                    s['product_name'], 
                    s['quantity'], 
                    format_currency(s['total_amount']), 
                    s['date'], 
                    s['payment_method'],
                    s['customer_name']
                ))
        except Exception as e:
            print(f"Error refreshing sales: {e}")

    def add_sale(self):
        """Professional Add Sale Dialog"""
        dialog = ctk.CTkToplevel(self)
        dialog.title("Process New Sale")
        dialog.geometry("500x600")
        dialog.transient(self)
        dialog.grab_set()

        main_frame = ctk.CTkFrame(dialog)
        main_frame.pack(fill="both", expand=True, padx=20, pady=20)

        ctk.CTkLabel(main_frame, text="Create New Transaction", font=ctk.CTkFont(size=20, weight="bold")).pack(pady=(0, 20))

        # Product Selection
        prod_frame = ctk.CTkFrame(main_frame)
        prod_frame.pack(fill="x", pady=5)
        ctk.CTkLabel(prod_frame, text="Select Product:", width=120, anchor="w").pack(side="left", padx=10)
        
        # Fetch active products
        products = self.db.execute_query("SELECT p.id, p.name, p.unit_price, s.quantity as stock FROM products p JOIN stock s ON p.id = s.product_id WHERE p.status = 'active' AND s.quantity > 0")
        product_options = {p['name']: p for p in products}
        
        product_var = ctk.StringVar()
        product_dropdown = ctk.CTkOptionMenu(prod_frame, variable=product_var, values=list(product_options.keys()))
        product_dropdown.pack(side="left", fill="x", expand=True, padx=10)

        # Info Labels
        info_frame = ctk.CTkFrame(main_frame, fg_color="transparent")
        info_frame.pack(fill="x", pady=10)
        stock_label = ctk.CTkLabel(info_frame, text="Stock: --", font=ctk.CTkFont(size=12))
        stock_label.pack(side="left", padx=20)
        price_label = ctk.CTkLabel(info_frame, text="Price: --", font=ctk.CTkFont(size=12))
        price_label.pack(side="right", padx=20)

        def update_info(*args):
            name = product_var.get()
            if name in product_options:
                p = product_options[name]
                stock_label.configure(text=f"Stock: {p['stock']}")
                price_label.configure(text=f"Price: {format_currency(p['unit_price'])}")
                calculate_total()

        product_var.trace_add("write", update_info)

        # Quantity
        qty_frame = ctk.CTkFrame(main_frame)
        qty_frame.pack(fill="x", pady=5)
        ctk.CTkLabel(qty_frame, text="Quantity:", width=120, anchor="w").pack(side="left", padx=10)
        qty_entry = ctk.CTkEntry(qty_frame)
        qty_entry.insert(0, "1")
        qty_entry.pack(side="left", fill="x", expand=True, padx=10)

        # Customer
        cust_frame = ctk.CTkFrame(main_frame)
        cust_frame.pack(fill="x", pady=5)
        ctk.CTkLabel(cust_frame, text="Customer Name:", width=120, anchor="w").pack(side="left", padx=10)
        cust_entry = ctk.CTkEntry(cust_frame, placeholder_text="Walk-in Customer")
        cust_entry.pack(side="left", fill="x", expand=True, padx=10)

        # Payment Method
        pay_frame = ctk.CTkFrame(main_frame)
        pay_frame.pack(fill="x", pady=5)
        ctk.CTkLabel(pay_frame, text="Payment Method:", width=120, anchor="w").pack(side="left", padx=10)
        pay_var = ctk.StringVar(value="Cash")
        pay_dropdown = ctk.CTkOptionMenu(pay_frame, variable=pay_var, values=["Cash", "Credit", "Mobile Money", "Bank Transfer", "Cheque"])
        pay_dropdown.pack(side="left", fill="x", expand=True, padx=10)

        # Total
        total_frame = ctk.CTkFrame(main_frame, fg_color="#E0E0E0")
        total_frame.pack(fill="x", pady=20)
        total_val_label = ctk.CTkLabel(total_frame, text=f"Total: {format_currency(0)}", font=ctk.CTkFont(size=24, weight="bold"), text_color="black")
        total_val_label.pack(pady=20)

        def calculate_total(*args):
            try:
                name = product_var.get()
                qty = int(qty_entry.get() or 0)
                if name in product_options:
                    total = product_options[name]['unit_price'] * qty
                    total_val_label.configure(text=f"Total: {format_currency(total)}")
            except:
                total_val_label.configure(text=f"Total: {format_currency(0)}")

        qty_entry.bind("<KeyRelease>", calculate_total)

        def save_sale():
            name = product_var.get()
            if not name:
                messagebox.showerror("Error", "Please select a product")
                return
            
            try:
                qty = int(qty_entry.get())
                if qty <= 0: raise ValueError()
            except:
                messagebox.showerror("Error", "Invalid quantity")
                return

            p = product_options[name]
            if qty > p['stock']:
                messagebox.showerror("Error", f"Insufficient stock! Available: {p['stock']}")
                return

            customer = cust_entry.get().strip() or "Walk-in Customer"
            payment = pay_var.get()
            total = p['unit_price'] * qty
            invoice_no = f"INV-{datetime.now().strftime('%Y%m%d')}-{int(time.time()) % 1000:03d}"

            try:
                # Begin Transaction
                # 1. Insert into Sales
                pay_status = 'Unpaid' if payment == 'Credit' else 'Paid'
                sale_result = self.db.execute_query(
                    """INSERT INTO sales (invoice_number, product_id, quantity, unit_price, total_amount, 
                       payment_method, payment_status, customer_name, status) 
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'completed')""",
                    (invoice_no, p['id'], qty, p['unit_price'], total, payment, pay_status, customer)
                )

                if not sale_result:
                    raise Exception("Database failed to record the sale. Please check logs.")
                
                sale_id = sale_result # Last insert ID

                # 2. Update Stock
                stock_result = self.db.execute_query(
                    "UPDATE stock SET quantity = quantity - %s WHERE product_id = %s",
                    (qty, p['id'])
                )
                
                if not stock_result:
                    print(f"Warning: Stock update might have failed for product {p['id']}")

                # 3. Handle Credit
                if payment == "Credit":
                    due_date = (datetime.now() + timedelta(days=30)).date()
                    self.db.execute_query(
                        """INSERT INTO credits (sale_id, customer_name, amount, due_date, status) 
                           VALUES (%s, %s, %s, %s, 'Unpaid')""",
                        (sale_id, customer, total, due_date)
                    )

                messagebox.showinfo("Success", f"Sale processed successfully!\nInvoice: {invoice_no}")
                dialog.destroy()
                self.refresh_sales()
                if self.dashboard:
                    self.dashboard.load_dashboard_stats()
                
                # Show Receipt
                self.show_receipt({
                    'invoice': invoice_no,
                    'customer': customer,
                    'product': p['name'],
                    'qty': qty,
                    'price': p['unit_price'],
                    'total': total,
                    'payment': payment,
                    'date': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                })
            except Exception as e:
                messagebox.showerror("Transaction Error", f"Failed to process sale: {e}")

        # Action Buttons
        btn_frame = ctk.CTkFrame(main_frame, fg_color="transparent")
        btn_frame.pack(fill="x", pady=(20, 0))
        ctk.CTkButton(btn_frame, text="Complete Sale", command=save_sale, fg_color="#43A047", hover_color="#2E7D32", height=45, font=ctk.CTkFont(weight="bold")).pack(side="right", padx=10, fill="x", expand=True)
        ctk.CTkButton(btn_frame, text="Cancel", command=dialog.destroy, fg_color="#757575", hover_color="#616161", height=45).pack(side="right", padx=10)

    def show_receipt(self, data):
        """Show a professional receipt dialog with print and copy options"""
        receipt_window = ctk.CTkToplevel(self)
        receipt_window.title("Sales Receipt")
        receipt_window.geometry("450x650")
        receipt_window.transient(self)
        receipt_window.grab_set()

        main_frame = ctk.CTkFrame(receipt_window, fg_color="white")
        main_frame.pack(fill="both", expand=True, padx=20, pady=20)

        # Header
        ctk.CTkLabel(main_frame, text="SALES RECEIPT", font=ctk.CTkFont(size=22, weight="bold"), text_color="black").pack(pady=(20, 5))
        ctk.CTkLabel(main_frame, text="Protech Assist (SL) Limited", font=ctk.CTkFont(size=14), text_color="gray").pack()
        ctk.CTkLabel(main_frame, text="-----------------------------------------", text_color="black").pack(pady=10)

        # Details Frame
        details_frame = ctk.CTkFrame(main_frame, fg_color="transparent")
        details_frame.pack(fill="x", padx=30)

        def add_line(label, value, bold=False):
            f = ctk.CTkFrame(details_frame, fg_color="transparent")
            f.pack(fill="x", pady=2)
            ctk.CTkLabel(f, text=label, font=ctk.CTkFont(size=12, weight="bold" if bold else "normal"), text_color="black").pack(side="left")
            ctk.CTkLabel(f, text=str(value), font=ctk.CTkFont(size=12, weight="bold" if bold else "normal"), text_color="black").pack(side="right")

        add_line("Invoice No:", data['invoice'])
        add_line("Date:", data['date'])
        add_line("Customer:", data['customer'])
        add_line("Payment Method:", data['payment'])
        
        ctk.CTkLabel(main_frame, text="-----------------------------------------", text_color="black").pack(pady=10)
        
        # Product Table Header
        header_f = ctk.CTkFrame(main_frame, fg_color="#F0F0F0")
        header_f.pack(fill="x", padx=20)
        ctk.CTkLabel(header_f, text="Item Description", text_color="black", font=ctk.CTkFont(size=11, weight="bold")).pack(side="left", padx=10)
        ctk.CTkLabel(header_f, text="Total", text_color="black", font=ctk.CTkFont(size=11, weight="bold")).pack(side="right", padx=10)

        # Product Line
        prod_f = ctk.CTkFrame(main_frame, fg_color="transparent")
        prod_f.pack(fill="x", padx=20, pady=10)
        ctk.CTkLabel(prod_f, text=f"{data['product']} (x{data['qty']})", text_color="black").pack(side="left", padx=10)
        ctk.CTkLabel(prod_f, text=format_currency(data['total']), text_color="black", font=ctk.CTkFont(weight="bold")).pack(side="right", padx=10)

        ctk.CTkLabel(main_frame, text="-----------------------------------------", text_color="black").pack(pady=10)

        # Grand Total
        total_f = ctk.CTkFrame(main_frame, fg_color="transparent")
        total_f.pack(fill="x", padx=30, pady=10)
        ctk.CTkLabel(total_f, text="GRAND TOTAL:", font=ctk.CTkFont(size=18, weight="bold"), text_color="black").pack(side="left")
        ctk.CTkLabel(total_f, text=format_currency(data['total']), font=ctk.CTkFont(size=18, weight="bold"), text_color="#2E7D32").pack(side="right")

        ctk.CTkLabel(main_frame, text="Thank you for your business!", font=ctk.CTkFont(slant="italic"), text_color="gray").pack(pady=(30, 10))

        # Receipt Text for Copying/Printing
        receipt_text = f"""
=========================================
          SALES RECEIPT
     Protech Assist (SL) Limited
=========================================
Invoice No: {data['invoice']}
Date:       {data['date']}
Customer:   {data['customer']}
Payment:    {data['payment']}
-----------------------------------------
Item:       {data['product']}
Quantity:   {data['qty']}
Price:      {format_currency(data['price'])}
-----------------------------------------
GRAND TOTAL: {format_currency(data['total'])}
=========================================
   Thank you for your business!
=========================================
        """

        def copy_receipt():
            self.root.clipboard_clear()
            self.root.clipboard_append(receipt_text)
            messagebox.showinfo("Success", "Receipt copied to clipboard!")

        def print_receipt():
            try:
                filename = f"receipts/receipt_{data['invoice']}.txt"
                os.makedirs("receipts", exist_ok=True)
                with open(filename, "w") as f:
                    f.write(receipt_text)
                
                # Improved printing for Windows
                try:
                    # Try the standard Windows print command
                    os.startfile(os.path.abspath(filename), "print")
                    messagebox.showinfo("Printing", "Receipt sent to the default printer.")
                except Exception as print_err:
                    # Fallback: Open with default app and ask user to press Ctrl+P
                    os.startfile(os.path.abspath(filename))
                    messagebox.showinfo("Manual Print", f"Could not send to printer automatically.\n\nOpening the receipt file now.\nPlease press Ctrl+P to print it manually.")
                    
            except Exception as e:
                messagebox.showerror("Error", f"Failed to process receipt: {e}")

        # Action Buttons
        btn_frame = ctk.CTkFrame(receipt_window, fg_color="transparent")
        btn_frame.pack(fill="x", pady=20, padx=20)
        
        ctk.CTkButton(btn_frame, text="Print Receipt", command=print_receipt, fg_color="#1976D2").pack(side="left", padx=10, fill="x", expand=True)
        ctk.CTkButton(btn_frame, text="Copy Text", command=copy_receipt, fg_color="#607D8B").pack(side="left", padx=10, fill="x", expand=True)
        ctk.CTkButton(receipt_window, text="Close", command=receipt_window.destroy).pack(pady=(0, 20))

    def export_sales_data(self):
        try:
            sales = self.db.execute_query("""
                SELECT s.id, p.name as product_name, s.quantity, s.total_amount, s.date, s.payment_method, s.customer_name
                FROM sales s
                JOIN products p ON s.product_id = p.id
                ORDER BY s.date DESC
            """)
            from utils import export_to_csv
            export_to_csv(sales, "inventory_sales")
        except Exception as e:
            messagebox.showerror("Export Error", str(e))

    def search_sales(self):
        search_term = self.search_entry.get().strip()
        if not search_term:
            self.refresh_sales()
            return
            
        for item in self.tree.get_children():
            self.tree.delete(item)
            
        try:
            query = """
                SELECT s.id, s.invoice_number, p.name as product_name, s.quantity, s.total_amount, s.date, s.payment_method, s.customer_name
                FROM sales s
                JOIN products p ON s.product_id = p.id
                WHERE p.name LIKE %s OR s.customer_name LIKE %s OR s.invoice_number LIKE %s
                ORDER BY s.date DESC
            """
            sales = self.db.execute_query(query, (f"%{search_term}%", f"%{search_term}%", f"%{search_term}%"))
            
            for s in sales:
                self.tree.insert("", "end", values=(
                    s['id'], 
                    s['invoice_number'] or "N/A",
                    s['product_name'], 
                    s['quantity'], 
                    format_currency(s['total_amount']), 
                    s['date'], 
                    s['payment_method'],
                    s['customer_name']
                ))
        except Exception as e:
            messagebox.showerror("Search Error", str(e))
