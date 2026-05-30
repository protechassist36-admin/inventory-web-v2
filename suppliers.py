# --- suppliers.py ---
import customtkinter as ctk
import tkinter as tk
from tkinter import ttk, messagebox
import pymysql

class SuppliersWindow(ctk.CTkFrame):
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
        self.title_label = ctk.CTkLabel(self.container, text="Suppliers Management", 
                                      font=ctk.CTkFont(size=20, weight="bold"))
        self.title_label.pack(pady=(10, 10))
        
        # Search Frame
        self.search_frame = ctk.CTkFrame(self.container)
        self.search_frame.pack(fill="x", padx=10, pady=(0, 10))
        
        self.search_entry = ctk.CTkEntry(self.search_frame, placeholder_text="Search suppliers...")
        self.search_entry.pack(side="left", fill="x", expand=True, padx=(0, 5))
        
        self.search_button = ctk.CTkButton(self.search_frame, text="Search", command=self.search_suppliers)
        self.search_button.pack(side="left", padx=5)
        
        # Buttons Frame
        self.buttons_frame = ctk.CTkFrame(self.container)
        self.buttons_frame.pack(fill="x", padx=10, pady=(0, 10))
        
        self.add_button = ctk.CTkButton(self.buttons_frame, text="Add", command=self.add_supplier)
        self.add_button.pack(side="left", padx=5)
        
        self.update_button = ctk.CTkButton(self.buttons_frame, text="Update", command=self.update_supplier)
        self.update_button.pack(side="left", padx=5)
        
        self.delete_button = ctk.CTkButton(self.buttons_frame, text="Delete", command=self.delete_supplier)
        self.delete_button.pack(side="left", padx=5)
        
        self.refresh_button = ctk.CTkButton(self.buttons_frame, text="Refresh", command=self.refresh_suppliers)
        self.refresh_button.pack(side="left", padx=5)
        
        # Treeview Frame
        self.tree_frame = ctk.CTkFrame(self.container)
        self.tree_frame.pack(fill="both", expand=True, padx=10, pady=(0, 10))
        
        # Create Treeview
        self.tree = ttk.Treeview(self.tree_frame, columns=("ID", "Name", "Contact", "Email", "Address"), show="headings")
        self.tree.pack(fill="both", expand=True)
        
        # Bind events
        self.tree.bind("<Double-1>", lambda e: self.update_supplier())
        self.tree.bind("<Button-3>", self.show_context_menu)
        
        # Define headings
        self.tree.heading("ID", text="ID")
        self.tree.heading("Name", text="Name")
        self.tree.heading("Contact", text="Contact")
        self.tree.heading("Email", text="Email")
        self.tree.heading("Address", text="Address")
        
        # Configure column widths
        self.tree.column("ID", width=50)
        self.tree.column("Name", width=150)
        self.tree.column("Contact", width=100)
        self.tree.column("Email", width=150)
        self.tree.column("Address", width=200)
        
        # Scrollbar
        scrollbar = ttk.Scrollbar(self.tree_frame, orient="vertical", command=self.tree.yview)
        scrollbar.pack(side="right", fill="y")
        self.tree.configure(yscrollcommand=scrollbar.set)
        
        # Load initial data
        self.refresh_suppliers()
    
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
    
    def show_context_menu(self, event):
        """Display right-click context menu"""
        # Select item on right click
        item = self.tree.identify_row(event.y)
        if item:
            self.tree.selection_set(item)
            
            # Create menu
            menu = tk.Menu(self, tearoff=0)
            menu.add_command(label="View Details", command=self.view_supplier_details)
            menu.add_command(label="Edit Supplier", command=self.update_supplier)
            menu.add_command(label="Delete Supplier", command=self.delete_supplier)
            menu.add_separator()
            menu.add_command(label="Refresh List", command=self.refresh_suppliers)
            
            # Show menu
            menu.post(event.x_root, event.y_root)

    def view_supplier_details(self):
        """View supplier details in a read-only window"""
        selected = self.tree.selection()
        if not selected:
            return
            
        sup_id = self.tree.item(selected[0])["values"][0]
        
        connection = self.get_db_connection()
        if not connection:
            return
            
        try:
            with connection.cursor(pymysql.cursors.DictCursor) as cursor:
                cursor.execute("SELECT * FROM suppliers WHERE id = %s", (sup_id,))
                s = cursor.fetchone()
                
            if not s:
                messagebox.showerror("Error", "Supplier not found")
                return
                
            dialog = ctk.CTkToplevel(self)
            dialog.title("Supplier Details")
            dialog.geometry("450x450")
            dialog.transient(self)
            dialog.grab_set()
            
            main_frame = ctk.CTkFrame(dialog)
            main_frame.pack(fill="both", expand=True, padx=20, pady=20)
            
            ctk.CTkLabel(main_frame, text="🏢 Supplier Information", font=ctk.CTkFont(size=20, weight="bold")).pack(pady=(0, 20))
            
            def add_detail(label, value):
                f = ctk.CTkFrame(main_frame, fg_color="transparent")
                f.pack(fill="x", pady=5)
                ctk.CTkLabel(f, text=label, width=150, anchor="w", font=ctk.CTkFont(weight="bold")).pack(side="left")
                ctk.CTkLabel(f, text=str(value), anchor="w").pack(side="left", fill="x", expand=True)

            add_detail("Supplier ID:", f"SUP-{s['id']:04d}")
            add_detail("Name:", s['name'])
            add_detail("Contact Person:", s.get('contact_person', 'N/A'))
            add_detail("Email:", s['email'])
            add_detail("Address:", s['address'])
            
            # Action Buttons
            btn_frame = ctk.CTkFrame(main_frame, fg_color="transparent")
            btn_frame.pack(fill="x", pady=(30, 0))
            
            ctk.CTkButton(btn_frame, text="Edit This Supplier", command=lambda: [dialog.destroy(), self.update_supplier()], fg_color="orange").pack(side="left", padx=10, fill="x", expand=True)
            ctk.CTkButton(btn_frame, text="Close", command=dialog.destroy).pack(side="left", padx=10, fill="x", expand=True)

        except Exception as e:
            messagebox.showerror("Error", str(e))
        finally:
            connection.close()

    def refresh_suppliers(self):
        """Load all suppliers from database into treeview"""
        # Clear existing items
        for item in self.tree.get_children():
            self.tree.delete(item)
        
        connection = self.get_db_connection()
        if not connection:
            return
            
        try:
            with connection.cursor() as cursor:
                # Fixed column name from contact to contact_person
                cursor.execute("SELECT id, name, contact_person, email, address FROM suppliers")
                suppliers = cursor.fetchall()
                
                for supplier in suppliers:
                    self.tree.insert("", "end", values=supplier)
        except pymysql.Error as e:
            messagebox.showerror("Database Error", f"Error fetching suppliers: {e}")
        finally:
            connection.close()
    
    def search_suppliers(self):
        """Filter suppliers by name"""
        search_term = self.search_entry.get().strip()
        if not search_term:
            self.refresh_suppliers()
            return
            
        # Clear existing items
        for item in self.tree.get_children():
            self.tree.delete(item)
        
        connection = self.get_db_connection()
        if not connection:
            return
            
        try:
            with connection.cursor() as cursor:
                # Fixed column name from contact to contact_person
                cursor.execute("SELECT id, name, contact_person, email, address FROM suppliers WHERE name LIKE %s", (f"%{search_term}%",))
                suppliers = cursor.fetchall()
                
                for supplier in suppliers:
                    self.tree.insert("", "end", values=supplier)
        except pymysql.Error as e:
            messagebox.showerror("Database Error", f"Error searching suppliers: {e}")
        finally:
            connection.close()
    
    def add_supplier(self):
        """Open dialog to add a new supplier"""
        dialog = ctk.CTkToplevel(self.container)
        dialog.title("Add Supplier")
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
        title_label = ctk.CTkLabel(main_frame, text="Add New Supplier", 
                                  font=ctk.CTkFont(size=16, weight="bold"))
        title_label.pack(pady=(0, 15))
        
        # Form fields
        fields = {}
        
        # Name field
        name_frame = ctk.CTkFrame(main_frame)
        name_frame.pack(fill="x", pady=5)
        ctk.CTkLabel(name_frame, text="Name:", width=100).pack(side="left", padx=(0, 10))
        name_entry = ctk.CTkEntry(name_frame)
        name_entry.pack(side="left", fill="x", expand=True)
        fields["name"] = name_entry
        
        # Contact field
        contact_frame = ctk.CTkFrame(main_frame)
        contact_frame.pack(fill="x", pady=5)
        ctk.CTkLabel(contact_frame, text="Contact:", width=100).pack(side="left", padx=(0, 10))
        contact_entry = ctk.CTkEntry(contact_frame)
        contact_entry.pack(side="left", fill="x", expand=True)
        fields["contact"] = contact_entry
        
        # Email field
        email_frame = ctk.CTkFrame(main_frame)
        email_frame.pack(fill="x", pady=5)
        ctk.CTkLabel(email_frame, text="Email:", width=100).pack(side="left", padx=(0, 10))
        email_entry = ctk.CTkEntry(email_frame)
        email_entry.pack(side="left", fill="x", expand=True)
        fields["email"] = email_entry
        
        # Address field
        address_frame = ctk.CTkFrame(main_frame)
        address_frame.pack(fill="x", pady=5)
        ctk.CTkLabel(address_frame, text="Address:", width=100).pack(side="left", padx=(0, 10))
        address_entry = ctk.CTkEntry(address_frame)
        address_entry.pack(side="left", fill="x", expand=True)
        fields["address"] = address_entry
        
        # Buttons frame
        buttons_frame = ctk.CTkFrame(main_frame)
        buttons_frame.pack(fill="x", pady=(15, 0))
        
        def save_supplier():
            # Get values from form
            name = fields["name"].get().strip()
            contact = fields["contact"].get().strip()
            email = fields["email"].get().strip()
            address = fields["address"].get().strip()
            
            if not name:
                messagebox.showerror("Input Error", "Supplier name is required!")
                return
            
            connection = self.get_db_connection()
            if not connection:
                return
            
            try:
                with connection.cursor() as cursor:
                    # Fixed column name from contact to contact_person
                    cursor.execute(
                        "INSERT INTO suppliers (name, contact_person, email, address) VALUES (%s, %s, %s, %s)",
                        (name, contact, email, address)
                    )

                    connection.commit()
                    messagebox.showinfo("Success", "Supplier added successfully!")
                    dialog.destroy()
                    self.refresh_suppliers()
            except pymysql.Error as e:
                messagebox.showerror("Database Error", f"Error adding supplier: {e}")
            finally:
                connection.close()
        
        def cancel():
            dialog.destroy()
        
        # Buttons
        save_button = ctk.CTkButton(buttons_frame, text="Save", command=save_supplier)
        save_button.pack(side="right", padx=5)
        
        cancel_button = ctk.CTkButton(buttons_frame, text="Cancel", command=cancel)
        cancel_button.pack(side="right", padx=5)
    
    def update_supplier(self):
        """Update selected supplier"""
        selected_item = self.tree.selection()
        if not selected_item:
            messagebox.showwarning("Selection Error", "Please select a supplier to update!")
            return
        
        # Get selected supplier data
        supplier_data = self.tree.item(selected_item[0])["values"]
        supplier_id = supplier_data[0]
        
        dialog = ctk.CTkToplevel(self.container)
        dialog.title("Update Supplier")
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
        title_label = ctk.CTkLabel(main_frame, text="Update Supplier", 
                                  font=ctk.CTkFont(size=16, weight="bold"))
        title_label.pack(pady=(0, 15))
        
        # Form fields with current values
        fields = {}
        
        # Name field
        name_frame = ctk.CTkFrame(main_frame)
        name_frame.pack(fill="x", pady=5)
        ctk.CTkLabel(name_frame, text="Name:", width=100).pack(side="left", padx=(0, 10))
        name_entry = ctk.CTkEntry(name_frame)
        name_entry.insert(0, str(supplier_data[1]))
        name_entry.pack(side="left", fill="x", expand=True)
        fields["name"] = name_entry
        
        # Contact field
        contact_frame = ctk.CTkFrame(main_frame)
        contact_frame.pack(fill="x", pady=5)
        ctk.CTkLabel(contact_frame, text="Contact:", width=100).pack(side="left", padx=(0, 10))
        contact_entry = ctk.CTkEntry(contact_frame)
        contact_entry.insert(0, str(supplier_data[2]))
        contact_entry.pack(side="left", fill="x", expand=True)
        fields["contact"] = contact_entry
        
        # Email field
        email_frame = ctk.CTkFrame(main_frame)
        email_frame.pack(fill="x", pady=5)
        ctk.CTkLabel(email_frame, text="Email:", width=100).pack(side="left", padx=(0, 10))
        email_entry = ctk.CTkEntry(email_frame)
        email_entry.insert(0, str(supplier_data[3]))
        email_entry.pack(side="left", fill="x", expand=True)
        fields["email"] = email_entry
        
        # Address field
        address_frame = ctk.CTkFrame(main_frame)
        address_frame.pack(fill="x", pady=5)
        ctk.CTkLabel(address_frame, text="Address:", width=100).pack(side="left", padx=(0, 10))
        address_entry = ctk.CTkEntry(address_frame)
        address_entry.insert(0, str(supplier_data[4]))
        address_entry.pack(side="left", fill="x", expand=True)
        fields["address"] = address_entry
        
        # Buttons frame
        buttons_frame = ctk.CTkFrame(main_frame)
        buttons_frame.pack(fill="x", pady=(15, 0))
        
        def save_update():
            # Get values from form
            name = fields["name"].get().strip()
            contact = fields["contact"].get().strip()
            email = fields["email"].get().strip()
            address = fields["address"].get().strip()
            
            if not name:
                messagebox.showerror("Input Error", "Supplier name is required!")
                return
            
            connection = self.get_db_connection()
            if not connection:
                return
            
            try:
                with connection.cursor() as cursor:
                    # Fixed column name from contact to contact_person
                    cursor.execute(
                        "UPDATE suppliers SET name=%s, contact_person=%s, email=%s, address=%s WHERE id=%s",
                        (name, contact, email, address, supplier_id)
                    )

                    connection.commit()
                    messagebox.showinfo("Success", "Supplier updated successfully!")
                    dialog.destroy()
                    self.refresh_suppliers()
            except pymysql.Error as e:
                messagebox.showerror("Database Error", f"Error updating supplier: {e}")
            finally:
                connection.close()
        
        def cancel():
            dialog.destroy()
        
        # Buttons
        save_button = ctk.CTkButton(buttons_frame, text="Save", command=save_update)
        save_button.pack(side="right", padx=5)
        
        cancel_button = ctk.CTkButton(buttons_frame, text="Cancel", command=cancel)
        cancel_button.pack(side="right", padx=5)
    
    def delete_supplier(self):
        """Delete selected supplier"""
        selected_item = self.tree.selection()
        if not selected_item:
            messagebox.showwarning("Selection Error", "Please select a supplier to delete!")
            return
        
        # Get selected supplier ID
        supplier_id = self.tree.item(selected_item[0])["values"][0]
        
        # Check if supplier is being used by products
        connection = self.get_db_connection()
        if not connection:
            return
        
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT COUNT(*) FROM products WHERE supplier_id=%s", (supplier_id,))
                product_count = cursor.fetchone()[0]
                
                if product_count > 0:
                    messagebox.showerror("Delete Error", 
                                       f"Cannot delete this supplier. It is being used by {product_count} product(s).")
                    return
                
                # Confirm deletion
                if not messagebox.askyesno("Confirm Deletion", "Are you sure you want to delete this supplier?"):
                    return
                
                cursor.execute("DELETE FROM suppliers WHERE id=%s", (supplier_id,))
                connection.commit()
                messagebox.showinfo("Success", "Supplier deleted successfully!")
                self.refresh_suppliers()
        except pymysql.Error as e:
            messagebox.showerror("Database Error", f"Error deleting supplier: {e}")
        finally:
            connection.close()
