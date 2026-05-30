import customtkinter as ctk
from tkinter import ttk, messagebox
import pymysql

from config import ROLES

class UsersWindow(ctk.CTkFrame):
    def __init__(self, parent_frame, user_data):
        super().__init__(parent_frame)
        self.user_data = user_data
        # Create a container frame inside parent_frame
        self.container = ctk.CTkFrame(parent_frame)
        self.container.grid(row=0, column=0, sticky="nsew")
        # Configure grid weights for parent frame
        parent_frame.grid_rowconfigure(0, weight=1)
        parent_frame.grid_columnconfigure(0, weight=1)
        # Initialize UI components
        self.create_widgets()
      
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

    def create_widgets(self):
        # Title Label
        self.title_label = ctk.CTkLabel(self.container, text="Users Management", 
                                      font=ctk.CTkFont(size=20, weight="bold"))
        self.title_label.pack(pady=(10, 10))

        # Search Frame
        self.search_frame = ctk.CTkFrame(self.container)
        self.search_frame.pack(fill="x", padx=10, pady=(0, 10))
        self.search_entry = ctk.CTkEntry(self.search_frame, placeholder_text="Search users...")
        self.search_entry.pack(side="left", fill="x", expand=True, padx=(0, 5))
        self.search_button = ctk.CTkButton(self.search_frame, text="Search", command=self.search_users)
        self.search_button.pack(side="left", padx=5)

        # Buttons Frame
        self.buttons_frame = ctk.CTkFrame(self.container)
        self.buttons_frame.pack(fill="x", padx=10, pady=(0, 10))
        self.add_button = ctk.CTkButton(self.buttons_frame, text="Add", command=self.add_user)
        self.add_button.pack(side="left", padx=5)
        self.update_button = ctk.CTkButton(self.buttons_frame, text="Update", command=self.update_user)
        self.update_button.pack(side="left", padx=5)
        self.delete_button = ctk.CTkButton(self.buttons_frame, text="Delete", command=self.delete_user)
        self.delete_button.pack(side="left", padx=5)
        self.refresh_button = ctk.CTkButton(self.buttons_frame, text="Refresh", command=self.refresh_users)
        self.refresh_button.pack(side="left", padx=5)

        # Treeview Frame
        self.tree_frame = ctk.CTkFrame(self.container)
        self.tree_frame.pack(fill="both", expand=True, padx=10, pady=(0, 10))

        # Create Treeview
        self.tree = ttk.Treeview(self.tree_frame, columns=("ID", "Username", "Role"), show="headings")
        self.tree.pack(fill="both", expand=True)

        # Bind events
        self.tree.bind("<Double-1>", lambda e: self.view_user_details())
        self.tree.bind("<Button-3>", self.show_context_menu)

        # Define headings
        self.tree.heading("ID", text="ID")
        self.tree.heading("Username", text="Username")
        self.tree.heading("Role", text="Role")

        # Configure column widths
        self.tree.column("ID", width=50)
        self.tree.column("Username", width=150)
        self.tree.column("Role", width=100)

        # Scrollbar
        scrollbar = ttk.Scrollbar(self.tree_frame, orient="vertical", command=self.tree.yview)
        scrollbar.pack(side="right", fill="y")
        self.tree.configure(yscrollcommand=scrollbar.set)

        # Load initial data
        self.refresh_users()

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
            menu.add_command(label="View Details", command=self.view_user_details)
            menu.add_command(label="Edit User", command=self.update_user)
            menu.add_command(label="Delete User", command=self.delete_user)
            menu.add_separator()
            menu.add_command(label="Refresh List", command=self.refresh_users)
            
            # Show menu
            menu.post(event.x_root, event.y_root)

    def view_user_details(self):
        """View user details in a read-only window"""
        selected = self.tree.selection()
        if not selected:
            return
            
        user_id = self.tree.item(selected[0])["values"][0]
        
        connection = self.get_db_connection()
        if not connection:
            return
            
        try:
            with connection.cursor(pymysql.cursors.DictCursor) as cursor:
                cursor.execute("SELECT id, username, role FROM users WHERE id = %s", (user_id,))
                u = cursor.fetchone()
                
            if not u:
                messagebox.showerror("Error", "User not found")
                return
                
            dialog = ctk.CTkToplevel(self)
            dialog.title("User Details")
            dialog.geometry("400x400")
            dialog.transient(self)
            dialog.grab_set()
            
            main_frame = ctk.CTkFrame(dialog)
            main_frame.pack(fill="both", expand=True, padx=20, pady=20)
            
            ctk.CTkLabel(main_frame, text="👥 User Information", font=ctk.CTkFont(size=20, weight="bold")).pack(pady=(0, 20))
            
            def add_detail(label, value):
                f = ctk.CTkFrame(main_frame, fg_color="transparent")
                f.pack(fill="x", pady=5)
                ctk.CTkLabel(f, text=label, width=120, anchor="w", font=ctk.CTkFont(weight="bold")).pack(side="left")
                ctk.CTkLabel(f, text=str(value), anchor="w").pack(side="left", fill="x", expand=True)

            add_detail("User ID:", f"USER-{u['id']:03d}")
            add_detail("Username:", u['username'])
            add_detail("Role:", u['role'].title())
            
            # Action Buttons
            btn_frame = ctk.CTkFrame(main_frame, fg_color="transparent")
            btn_frame.pack(fill="x", pady=(30, 0))
            
            ctk.CTkButton(btn_frame, text="Edit User", command=lambda: [dialog.destroy(), self.update_user()], fg_color="orange").pack(side="left", padx=10, fill="x", expand=True)
            ctk.CTkButton(btn_frame, text="Close", command=dialog.destroy).pack(side="left", padx=10, fill="x", expand=True)

        except Exception as e:
            messagebox.showerror("Error", str(e))
        finally:
            connection.close()

    def refresh_users(self):
        """Load all users from database into treeview"""
        connection = self.get_db_connection()
        if not connection:
            return

        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT id, username, role FROM users")
                users = cursor.fetchall()

                # Clear existing items
                for item in self.tree.get_children():
                    self.tree.delete(item)

                # Insert users into treeview
                for user in users:
                    self.tree.insert("", "end", values=(user['id'], user['username'], user['role']))
        except pymysql.Error as e:
            messagebox.showerror("Database Error", f"Error loading users: {e}")
        finally:
            connection.close()

    def search_users(self):
        """Search users by username"""
        search_term = self.search_entry.get().strip()
        connection = self.get_db_connection()
        if not connection:
            return

        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT id, username, role FROM users WHERE username LIKE %s",
                    (f"%{search_term}%",)
                )
                users = cursor.fetchall()

                # Clear existing items
                for item in self.tree.get_children():
                    self.tree.delete(item)

                # Insert matching users into treeview
                for user in users:
                    self.tree.insert("", "end", values=(user['id'], user['username'], user['role']))
        except pymysql.Error as e:
            messagebox.showerror("Database Error", f"Error searching users: {e}")
        finally:
            connection.close()

    def add_user(self):
        """Open dialog to add a new user"""
        dialog = ctk.CTkToplevel(self.container)
        dialog.title("Add User")
        dialog.geometry("400x300")
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
        title_label = ctk.CTkLabel(main_frame, text="Add New User", 
                                  font=ctk.CTkFont(size=16, weight="bold"))
        title_label.pack(pady=(0, 15))

        # Form fields
        fields = {}
        
        # Username field
        username_frame = ctk.CTkFrame(main_frame)
        username_frame.pack(fill="x", pady=5)
        ctk.CTkLabel(username_frame, text="Username:", width=100).pack(side="left", padx=(0, 10))
        username_entry = ctk.CTkEntry(username_frame)
        username_entry.pack(side="left", fill="x", expand=True)
        fields["username"] = username_entry

        # Password field
        password_frame = ctk.CTkFrame(main_frame)
        password_frame.pack(fill="x", pady=5)
        ctk.CTkLabel(password_frame, text="Password:", width=100).pack(side="left", padx=(0, 10))
        password_entry = ctk.CTkEntry(password_frame, show="*")
        password_entry.pack(side="left", fill="x", expand=True)
        fields["password"] = password_entry

        # Role field
        role_frame = ctk.CTkFrame(main_frame)
        role_frame.pack(fill="x", pady=5)
        ctk.CTkLabel(role_frame, text="Role:", width=100).pack(side="left", padx=(0, 10))
        role_var = ctk.StringVar(value="user")
        # In users.py, update the role menu values
        role_menu = ctk.CTkOptionMenu(role_frame, variable=role_var, values=list(ROLES.keys()))

        role_menu.pack(side="left", fill="x", expand=True)
        fields["role"] = role_var

        # Buttons frame
        buttons_frame = ctk.CTkFrame(main_frame)
        buttons_frame.pack(fill="x", pady=(15, 0))

        def save_user():
            username = fields["username"].get().strip()
            password = fields["password"].get().strip()
            role = fields["role"].get()

            if not username or not password:
                messagebox.showerror("Input Error", "Username and password are required!")
                return

            connection = self.get_db_connection()
            if not connection:
                return

            try:
                with connection.cursor() as cursor:
                    cursor.execute(
                        "INSERT INTO users (username, password, role) VALUES (%s, %s, %s)",
                        (username, password, role)
                    )
                    connection.commit()
                    messagebox.showinfo("Success", "User added successfully!")
                    dialog.destroy()
                    self.refresh_users()
            except pymysql.Error as e:
                messagebox.showerror("Database Error", f"Error adding user: {e}")
            finally:
                connection.close()

        def cancel():
            dialog.destroy()

        # Buttons
        save_button = ctk.CTkButton(buttons_frame, text="Save", command=save_user)
        save_button.pack(side="right", padx=5)
        cancel_button = ctk.CTkButton(buttons_frame, text="Cancel", command=cancel)
        cancel_button.pack(side="right", padx=5)

    def update_user(self):
        """Update selected user"""
        selected_item = self.tree.selection()
        if not selected_item:
            messagebox.showwarning("Selection Error", "Please select a user to update!")
            return

        user_data = self.tree.item(selected_item[0])["values"]
        user_id = user_data[0]

        dialog = ctk.CTkToplevel(self.container)
        dialog.title("Update User")
        dialog.geometry("400x300")
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
        title_label = ctk.CTkLabel(main_frame, text="Update User", 
                                  font=ctk.CTkFont(size=16, weight="bold"))
        title_label.pack(pady=(0, 15))

        # Form fields with current values
        fields = {}
        
        # Username field
        username_frame = ctk.CTkFrame(main_frame)
        username_frame.pack(fill="x", pady=5)
        ctk.CTkLabel(username_frame, text="Username:", width=100).pack(side="left", padx=(0, 10))
        username_entry = ctk.CTkEntry(username_frame)
        username_entry.insert(0, str(user_data[1]))
        username_entry.pack(side="left", fill="x", expand=True)
        fields["username"] = username_entry

        # Password field
        password_frame = ctk.CTkFrame(main_frame)
        password_frame.pack(fill="x", pady=5)
        ctk.CTkLabel(password_frame, text="Password:", width=100).pack(side="left", padx=(0, 10))
        password_entry = ctk.CTkEntry(password_frame, show="*")
        password_entry.pack(side="left", fill="x", expand=True)
        fields["password"] = password_entry

        # Role field
        role_frame = ctk.CTkFrame(main_frame)
        role_frame.pack(fill="x", pady=5)
        ctk.CTkLabel(role_frame, text="Role:", width=100).pack(side="left", padx=(0, 10))
        role_var = ctk.StringVar(value=str(user_data[2]))
        role_menu = ctk.CTkOptionMenu(role_frame, variable=role_var, values=["user", "admin"])
        role_menu.pack(side="left", fill="x", expand=True)
        fields["role"] = role_var

        # Buttons frame
        buttons_frame = ctk.CTkFrame(main_frame)
        buttons_frame.pack(fill="x", pady=(15, 0))

        def save_update():
            username = fields["username"].get().strip()
            password = fields["password"].get().strip()
            role = fields["role"].get()

            if not username:
                messagebox.showerror("Input Error", "Username is required!")
                return

            connection = self.get_db_connection()
            if not connection:
                return

            try:
                with connection.cursor() as cursor:
                    if password:  # Only update password if a new one is provided
                        cursor.execute(
                            "UPDATE users SET username=%s, password=%s, role=%s WHERE id=%s",
                            (username, password, role, user_id)
                        )
                    else:
                        cursor.execute(
                            "UPDATE users SET username=%s, role=%s WHERE id=%s",
                            (username, role, user_id)
                        )
                    connection.commit()
                    messagebox.showinfo("Success", "User updated successfully!")
                    dialog.destroy()
                    self.refresh_users()
            except pymysql.Error as e:
                messagebox.showerror("Database Error", f"Error updating user: {e}")
            finally:
                connection.close()

        def cancel():
            dialog.destroy()

        # Buttons
        save_button = ctk.CTkButton(buttons_frame, text="Save", command=save_update)
        save_button.pack(side="right", padx=5)
        cancel_button = ctk.CTkButton(buttons_frame, text="Cancel", command=cancel)
        cancel_button.pack(side="right", padx=5)

    def delete_user(self):
        """Delete selected user"""
        selected_item = self.tree.selection()
        if not selected_item:
            messagebox.showwarning("Selection Error", "Please select a user to delete!")
            return

        user_data = self.tree.item(selected_item[0])["values"]
        user_id = user_data[0]
        username = user_data[1]

        # Confirm deletion
        if not messagebox.askyesno("Confirm Delete", 
                                  f"Are you sure you want to delete user '{username}'?"):
            return

        connection = self.get_db_connection()
        if not connection:
            return

        try:
            with connection.cursor() as cursor:
                cursor.execute("DELETE FROM users WHERE id=%s", (user_id,))
                connection.commit()
                messagebox.showinfo("Success", "User deleted successfully!")
                self.refresh_users()
        except pymysql.Error as e:
            messagebox.showerror("Database Error", f"Error deleting user: {e}")
        finally:
            connection.close()
