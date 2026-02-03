import customtkinter as ctk
import tkinter as tk
from tkinter import ttk, messagebox
import pymysql
import pymysql.cursors
from typing import Optional, Dict, Any, Callable

class CategoriesWindow(ctk.CTkFrame):
    def __init__(self, parent_frame, user_data, on_category_change: Optional[Callable] = None):
        super().__init__(parent_frame)
        self.user_data = user_data
        self.on_category_change = on_category_change  # Store the callback function
        
        # Create a container frame inside parent_frame
        self.container = ctk.CTkFrame(parent_frame)
        self.container.grid(row=0, column=0, sticky="nsew")
        
        # Configure grid weights for parent frame
        parent_frame.grid_rowconfigure(0, weight=1)
        parent_frame.grid_columnconfigure(0, weight=1)
        
        # Title Label
        self.title_label = ctk.CTkLabel(self.container, text="Categories Management", 
                                      font=ctk.CTkFont(size=20, weight="bold"))
        self.title_label.pack(pady=(10, 10))
        
        # Search Frame
        self.search_frame = ctk.CTkFrame(self.container)
        self.search_frame.pack(fill="x", padx=10, pady=(0, 10))
        
        self.search_entry = ctk.CTkEntry(self.search_frame, placeholder_text="Search categories...")
        self.search_entry.pack(side="left", fill="x", expand=True, padx=(0, 5))
        
        self.search_button = ctk.CTkButton(self.search_frame, text="Search", command=self.search_categories,
                                        fg_color="#1E88E5", hover_color="#1565C0")  # Blue
        self.search_button.pack(side="left", padx=5)
        
        # Buttons Frame
        self.buttons_frame = ctk.CTkFrame(self.container)
        self.buttons_frame.pack(fill="x", padx=10, pady=(0, 10))
        
        self.add_button = ctk.CTkButton(self.buttons_frame, text="Add", command=self.add_category,
                                      fg_color="#43A047", hover_color="#2E7D32")  # Green
        self.add_button.pack(side="left", padx=5)
        
        self.update_button = ctk.CTkButton(self.buttons_frame, text="Update", command=self.update_category,
                                        fg_color="#FB8C00", hover_color="#EF6C00")  # Orange
        self.update_button.pack(side="left", padx=5)
        
        self.delete_button = ctk.CTkButton(self.buttons_frame, text="Delete", command=self.delete_category,
                                        fg_color="#E53935", hover_color="#C62828")  # Red
        self.delete_button.pack(side="left", padx=5)
        
        self.refresh_button = ctk.CTkButton(self.buttons_frame, text="Refresh", command=self.refresh_categories,
                                          fg_color="#8E24AA", hover_color="#6A1B9A")  # Purple
        self.refresh_button.pack(side="left", padx=5)
        
        # Treeview Frame
        self.tree_frame = ctk.CTkFrame(self.container)
        self.tree_frame.pack(fill="both", expand=True, padx=10, pady=(0, 10))
        
        # Create Treeview
        self.tree = ttk.Treeview(self.tree_frame, columns=("ID", "Name", "Description"), show="headings")
        self.tree.pack(fill="both", expand=True)
        
        # Define headings
        self.tree.heading("ID", text="ID")
        self.tree.heading("Name", text="Name")
        self.tree.heading("Description", text="Description")
        
        # Configure column widths
        self.tree.column("ID", width=50)
        self.tree.column("Name", width=150)
        self.tree.column("Description", width=250)
        
        # Scrollbar
        scrollbar = ttk.Scrollbar(self.tree_frame, orient="vertical", command=self.tree.yview)
        scrollbar.pack(side="right", fill="y")
        self.tree.configure(yscrollcommand=scrollbar.set)
        
        # Load initial data
        self.refresh_categories()
    
    def get_db_connection(self) -> Optional[pymysql.Connection]:
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
    
    def refresh_categories(self):
        """Load all categories from database into treeview"""
        # Clear existing items
        for item in self.tree.get_children():
            self.tree.delete(item)
        
        connection = self.get_db_connection()
        if not connection:
            return
            
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT id, name, description FROM categories ORDER BY name")
                categories = cursor.fetchall()
                
                for category in categories:
                    self.tree.insert("", "end", values=(
                        category['id'],
                        category['name'],
                        category['description']
                    ))
        except pymysql.Error as e:
            messagebox.showerror("Database Error", f"Error fetching categories: {e}")
        finally:
            connection.close()
    
    def search_categories(self):
        """Filter categories by name"""
        search_term = self.search_entry.get().strip()
        if not search_term:
            self.refresh_categories()
            return
            
        # Clear existing items
        for item in self.tree.get_children():
            self.tree.delete(item)
        
        connection = self.get_db_connection()
        if not connection:
            return
            
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT * FROM categories WHERE name LIKE %s ORDER BY name", 
                             (f"%{search_term}%",))
                categories = cursor.fetchall()
                
                for category in categories:
                    self.tree.insert("", "end", values=(
                        category['id'],
                        category['name'],
                        category['description']
                    ))
        except pymysql.Error as e:
            messagebox.showerror("Database Error", f"Error searching categories: {e}")
        finally:
            connection.close()
    
    def add_category(self):
        """Open dialog to add a new category"""
        dialog = ctk.CTkToplevel(self.container)
        dialog.title("Add Category")
        dialog.geometry("400x250")
        dialog.transient(self.container)
        dialog.grab_set()
        
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
        title_label = ctk.CTkLabel(main_frame, text="Add New Category", 
                                  font=ctk.CTkFont(size=16, weight="bold"))
        title_label.pack(pady=(0, 15))
        
        # Form fields
        fields = {}
        
        # Name field
        name_frame = ctk.CTkFrame(main_frame)
        name_frame.pack(fill="x", pady=5)
        ctk.CTkLabel(name_frame, text="Name:", width=80).pack(side="left", padx=(0, 10))
        name_entry = ctk.CTkEntry(name_frame)
        name_entry.pack(side="left", fill="x", expand=True)
        fields["name"] = name_entry
        
        # Description field
        desc_frame = ctk.CTkFrame(main_frame)
        desc_frame.pack(fill="x", pady=5)
        ctk.CTkLabel(desc_frame, text="Description:", width=80).pack(side="left", padx=(0, 10))
        desc_entry = ctk.CTkEntry(desc_frame)
        desc_entry.pack(side="left", fill="x", expand=True)
        fields["description"] = desc_entry
        
        # Buttons frame
        buttons_frame = ctk.CTkFrame(main_frame)
        buttons_frame.pack(fill="x", pady=(15, 0))
        
        def save_category():
            # Get values from form
            name = fields["name"].get().strip()
            description = fields["description"].get().strip()
            
            if not name:
                messagebox.showerror("Input Error", "Category name is required!")
                return
            
            connection = self.get_db_connection()
            if not connection:
                return
            
            try:
                with connection.cursor() as cursor:
                    cursor.execute(
                        "INSERT INTO categories (name, description) VALUES (%s, %s)",
                        (name, description)
                    )
                    connection.commit()
                    messagebox.showinfo("Success", "Category added successfully!")
                    dialog.destroy()
                    self.refresh_categories()
                    
                    # Notify parent of the change
                    if self.on_category_change:
                        self.on_category_change()
            except pymysql.Error as e:
                messagebox.showerror("Database Error", f"Error adding category: {e}")
            finally:
                connection.close()
        
        def cancel():
            dialog.destroy()
        
        # Buttons with colors
        save_button = ctk.CTkButton(buttons_frame, text="Save", command=save_category,
                                   fg_color="#43A047", hover_color="#2E7D32")  # Green
        save_button.pack(side="right", padx=5)
        
        cancel_button = ctk.CTkButton(buttons_frame, text="Cancel", command=cancel,
                                    fg_color="#E53935", hover_color="#C62828")  # Red
        cancel_button.pack(side="right", padx=5)
    
    def update_category(self):
        """Update selected category"""
        selected_item = self.tree.selection()
        if not selected_item:
            messagebox.showwarning("Selection Error", "Please select a category to update!")
            return
        
        # Get selected category data
        category_data = self.tree.item(selected_item[0])["values"]
        category_id = category_data[0]
        
        dialog = ctk.CTkToplevel(self.container)
        dialog.title("Update Category")
        dialog.geometry("400x250")
        dialog.transient(self.container)
        dialog.grab_set()
        
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
        title_label = ctk.CTkLabel(main_frame, text="Update Category", 
                                  font=ctk.CTkFont(size=16, weight="bold"))
        title_label.pack(pady=(0, 15))
        
        # Form fields with current values
        fields = {}
        
        # Name field
        name_frame = ctk.CTkFrame(main_frame)
        name_frame.pack(fill="x", pady=5)
        ctk.CTkLabel(name_frame, text="Name:", width=80).pack(side="left", padx=(0, 10))
        name_entry = ctk.CTkEntry(name_frame)
        name_entry.insert(0, str(category_data[1]))
        name_entry.pack(side="left", fill="x", expand=True)
        fields["name"] = name_entry
        
        # Description field
        desc_frame = ctk.CTkFrame(main_frame)
        desc_frame.pack(fill="x", pady=5)
        ctk.CTkLabel(desc_frame, text="Description:", width=80).pack(side="left", padx=(0, 10))
        desc_entry = ctk.CTkEntry(desc_frame)
        desc_entry.insert(0, str(category_data[2]))
        desc_entry.pack(side="left", fill="x", expand=True)
        fields["description"] = desc_entry
        
        # Buttons frame
        buttons_frame = ctk.CTkFrame(main_frame)
        buttons_frame.pack(fill="x", pady=(15, 0))
        
        def save_update():
            # Get values from form
            name = fields["name"].get().strip()
            description = fields["description"].get().strip()
            
            if not name:
                messagebox.showerror("Input Error", "Category name is required!")
                return
            
            connection = self.get_db_connection()
            if not connection:
                return
            
            try:
                with connection.cursor() as cursor:
                    cursor.execute(
                        "UPDATE categories SET name=%s, description=%s WHERE id=%s",
                        (name, description, category_id)
                    )
                    connection.commit()
                    messagebox.showinfo("Success", "Category updated successfully!")
                    dialog.destroy()
                    self.refresh_categories()
                    
                    # Notify parent of the change
                    if self.on_category_change:
                        self.on_category_change()
            except pymysql.Error as e:
                messagebox.showerror("Database Error", f"Error updating category: {e}")
            finally:
                connection.close()
        
        def cancel():
            dialog.destroy()
        
        # Buttons with colors
        save_button = ctk.CTkButton(buttons_frame, text="Save", command=save_update,
                                   fg_color="#FB8C00", hover_color="#EF6C00")  # Orange
        save_button.pack(side="right", padx=5)
        
        cancel_button = ctk.CTkButton(buttons_frame, text="Cancel", command=cancel,
                                    fg_color="#E53935", hover_color="#C62828")  # Red
        cancel_button.pack(side="right", padx=5)
    
    def delete_category(self):
        """Delete selected category"""
        selected_item = self.tree.selection()
        if not selected_item:
            messagebox.showwarning("Selection Error", "Please select a category to delete!")
            return
        
        # Get selected category ID
        category_id = self.tree.item(selected_item[0])["values"][0]
        
        connection = self.get_db_connection()
        if not connection:
            return
        
        try:
            with connection.cursor() as cursor:
                # Check if category is being used by products
                cursor.execute("SELECT COUNT(*) as count FROM products WHERE category_id=%s", (category_id,))
                product_count = cursor.fetchone()['count']
                
                if product_count > 0:
                    messagebox.showerror("Delete Error", 
                                       f"Cannot delete this category. It is being used by {product_count} product(s).")
                    return
                
                # Confirm deletion
                if not messagebox.askyesno("Confirm Deletion", "Are you sure you want to delete this category?"):
                    return
                
                cursor.execute("DELETE FROM categories WHERE id=%s", (category_id,))
                connection.commit()
                messagebox.showinfo("Success", "Category deleted successfully!")
                self.refresh_categories()
                
                # Notify parent of the change
                if self.on_category_change:
                    self.on_category_change()
        except pymysql.Error as e:
            messagebox.showerror("Database Error", f"Error deleting category: {e}")
        finally:
            connection.close()
