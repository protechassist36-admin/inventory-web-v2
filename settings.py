import customtkinter as ctk
from tkinter import ttk, messagebox
import pymysql
from config import DB_CONFIG

class SettingsWindow(ctk.CTkFrame):
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
                host=DB_CONFIG['host'],
                user=DB_CONFIG['user'],
                password=DB_CONFIG['password'],
                database=DB_CONFIG['database'],
                charset='utf8mb4',
                cursorclass=pymysql.cursors.DictCursor
            )
            return connection
        except pymysql.Error as e:
            messagebox.showerror("Database Error", f"Error connecting to database: {e}")
            return None
    
    def create_widgets(self):
        # Title Label
        self.title_label = ctk.CTkLabel(self.container, text="Settings", 
                                      font=ctk.CTkFont(size=20, weight="bold"))
        self.title_label.pack(pady=(10, 10))
        
        # Create notebook for tabbed interface
        self.notebook = ttk.Notebook(self.container)
        self.notebook.pack(fill="both", expand=True, padx=10, pady=(0, 10))
        
        # Profile Tab
        self.profile_frame = ctk.CTkFrame(self.notebook)
        self.notebook.add(self.profile_frame, text="Profile")
        self.create_profile_widgets()
        
        # Security Tab
        self.security_frame = ctk.CTkFrame(self.notebook)
        self.notebook.add(self.security_frame, text="Security")
        self.create_security_widgets()
        
        # Appearance Tab
        self.appearance_frame = ctk.CTkFrame(self.notebook)
        self.notebook.add(self.appearance_frame, text="Appearance")
        self.create_appearance_widgets()
        
        # Buttons Frame - Fixed positioning
        self.buttons_frame = ctk.CTkFrame(self.container)
        self.buttons_frame.pack(fill="x", padx=10, pady=10)  # Changed from (0, 10) to (10, 10)
        
        # Save Button - Made smaller and more visible
        self.save_button = ctk.CTkButton(
            self.buttons_frame, 
            text="Save Settings", 
            command=self.save_settings,
            width=100,  # Explicit width
            height=25,  # Explicit height
            fg_color="#43A047",  # Green
            hover_color="#2E7D32"  # Darker green for hover
        )
        self.save_button.pack(side="right", padx=5)
        
        # Reset Button - Made smaller and more visible
        self.reset_button = ctk.CTkButton(
            self.buttons_frame, 
            text="Reset to Default", 
            command=self.reset_settings,
            width=100,  # Explicit width
            height=25,  # Explicit height
            fg_color="#E53935",  # Red
            hover_color="#C62828"  # Darker red for hover
        )
        self.reset_button.pack(side="right", padx=5)
    
    def create_profile_widgets(self):
        # Name field
        name_frame = ctk.CTkFrame(self.profile_frame)
        name_frame.pack(fill="x", padx=20, pady=10)
        ctk.CTkLabel(name_frame, text="Name:", width=100).pack(side="left", padx=(0, 10))
        self.name_entry = ctk.CTkEntry(name_frame)
        self.name_entry.pack(side="left", fill="x", expand=True)
        self.name_entry.insert(0, self.user_data.get('name', ''))
        
        # Email field
        email_frame = ctk.CTkFrame(self.profile_frame)
        email_frame.pack(fill="x", padx=20, pady=10)
        ctk.CTkLabel(email_frame, text="Email:", width=100).pack(side="left", padx=(0, 10))
        self.email_entry = ctk.CTkEntry(email_frame)
        self.email_entry.pack(side="left", fill="x", expand=True)
        self.email_entry.insert(0, self.user_data.get('email', ''))
        
        # Save button for profile - Made smaller
        self.save_profile_button = ctk.CTkButton(
            self.profile_frame, 
            text="Save Profile", 
            command=self.save_settings,
            width=100,  # Explicit width
            height=25,  # Explicit height
            fg_color="#43A047",  # Green
            hover_color="#2E7D32"  # Darker green for hover
        )
        self.save_profile_button.pack(pady=20)
    
    def create_security_widgets(self):
        # Current Password
        current_pass_frame = ctk.CTkFrame(self.security_frame)
        current_pass_frame.pack(fill="x", padx=20, pady=10)
        ctk.CTkLabel(current_pass_frame, text="Current Password:", width=150).pack(side="left", padx=(0, 10))
        self.current_pass_entry = ctk.CTkEntry(current_pass_frame, show="*")
        self.current_pass_entry.pack(side="left", fill="x", expand=True)
        
        # New Password
        new_pass_frame = ctk.CTkFrame(self.security_frame)
        new_pass_frame.pack(fill="x", padx=20, pady=10)
        ctk.CTkLabel(new_pass_frame, text="New Password:", width=150).pack(side="left", padx=(0, 10))
        self.new_pass_entry = ctk.CTkEntry(new_pass_frame, show="*")
        self.new_pass_entry.pack(side="left", fill="x", expand=True)
        
        # Confirm Password
        confirm_pass_frame = ctk.CTkFrame(self.security_frame)
        confirm_pass_frame.pack(fill="x", padx=20, pady=10)
        ctk.CTkLabel(confirm_pass_frame, text="Confirm Password:", width=150).pack(side="left", padx=(0, 10))
        self.confirm_pass_entry = ctk.CTkEntry(confirm_pass_frame, show="*")
        self.confirm_pass_entry.pack(side="left", fill="x", expand=True)
        
        # Change Password Button - Made smaller
        self.change_pass_button = ctk.CTkButton(
            self.security_frame, 
            text="Change Password", 
            command=self.change_password,
            width=100,  # Explicit width
            height=25,  # Explicit height
            fg_color="#FB8C00",  # Orange
            hover_color="#EF6C00"  # Darker orange for hover
        )
        self.change_pass_button.pack(pady=10)
    
    def create_appearance_widgets(self):
        # Theme Selection
        theme_frame = ctk.CTkFrame(self.appearance_frame)
        theme_frame.pack(fill="x", padx=20, pady=10)
        ctk.CTkLabel(theme_frame, text="Theme:", width=100).pack(side="left", padx=(0, 10))
        self.theme_var = ctk.StringVar(value=ctk.get_appearance_mode())
        self.theme_menu = ctk.CTkOptionMenu(theme_frame, variable=self.theme_var,
                                          values=["Light", "Dark", "System"],
                                          command=self.change_theme)
        self.theme_menu.pack(side="left", fill="x", expand=True)
    
    def save_settings(self):
        """Save user profile settings"""
        name = self.name_entry.get().strip()
        email = self.email_entry.get().strip()
        
        if not name or not email:
            messagebox.showerror("Input Error", "Name and email are required!")
            return
            
        connection = self.get_db_connection()
        if not connection:
            return
            
        try:
            with connection.cursor() as cursor:
                # Check if user settings exist
                cursor.execute(
                    "SELECT id FROM user_settings WHERE user_id=%s",
                    (self.user_data['id'],)
                )
                result = cursor.fetchone()
                
                if result:
                    # Update existing settings
                    cursor.execute(
                        "UPDATE user_settings SET name=%s, email=%s WHERE user_id=%s",
                        (name, email, self.user_data['id'])
                    )
                else:
                    # Insert new settings
                    cursor.execute(
                        "INSERT INTO user_settings (user_id, name, email) VALUES (%s, %s, %s)",
                        (self.user_data['id'], name, email)
                    )
                
                connection.commit()
                
                messagebox.showinfo("Success", "Settings saved successfully!")
                
                # Update user_data
                self.user_data['name'] = name
                self.user_data['email'] = email
        except pymysql.Error as e:
            messagebox.showerror("Database Error", f"Error saving settings: {e}")
        finally:
            connection.close()
    
    def change_password(self):
        """Change user password"""
        current_pass = self.current_pass_entry.get().strip()
        new_pass = self.new_pass_entry.get().strip()
        confirm_pass = self.confirm_pass_entry.get().strip()
        
        if not current_pass or not new_pass or not confirm_pass:
            messagebox.showerror("Input Error", "All password fields are required!")
            return
            
        if new_pass != confirm_pass:
            messagebox.showerror("Input Error", "New passwords do not match!")
            return
            
        connection = self.get_db_connection()
        if not connection:
            return
            
        try:
            with connection.cursor() as cursor:
                # Verify current password - hash it first
                from utils import hash_password
                hashed_current_pass = hash_password(current_pass)
                
                cursor.execute(
                    "SELECT password FROM users WHERE id=%s",
                    (self.user_data['id'],)
                )
                result = cursor.fetchone()
                
                if not result or result['password'] != hashed_current_pass:
                    messagebox.showerror("Error", "Current password is incorrect!")
                    return

                # Update password - hash the new password
                hashed_new_pass = hash_password(new_pass)
                cursor.execute(
                    "UPDATE users SET password=%s WHERE id=%s",
                    (hashed_new_pass, self.user_data['id'])
                )
                connection.commit()
                
                messagebox.showinfo("Success", "Password changed successfully!")
                
                # Clear password fields
                self.current_pass_entry.delete(0, 'end')
                self.new_pass_entry.delete(0, 'end')
                self.confirm_pass_entry.delete(0, 'end')
        except pymysql.Error as e:
            messagebox.showerror("Database Error", f"Error changing password: {e}")
        finally:
            connection.close()

    
    def change_theme(self, theme):
        """Change application theme"""
        ctk.set_appearance_mode(theme)
        
        # Save theme preference to database
        connection = self.get_db_connection()
        if not connection:
            return
            
        try:
            with connection.cursor() as cursor:
                # Check if user settings exist
                cursor.execute(
                    "SELECT id FROM user_settings WHERE user_id=%s",
                    (self.user_data['id'],)
                )
                result = cursor.fetchone()
                
                if result:
                    # Update existing settings
                    cursor.execute(
                        "UPDATE user_settings SET theme=%s WHERE user_id=%s",
                        (theme.lower(), self.user_data['id'])
                    )
                else:
                    # Insert new settings with theme
                    cursor.execute(
                        "INSERT INTO user_settings (user_id, name, email, theme) VALUES (%s, %s, %s, %s)",
                        (
                            self.user_data['id'],
                            self.user_data.get('name', ''),
                            self.user_data.get('email', ''),
                            theme.lower()
                        )
                    )
                
                connection.commit()
        except pymysql.Error as e:
            messagebox.showerror("Database Error", f"Error saving theme: {e}")
        finally:
            connection.close()
    
    def reset_settings(self):
        """Reset all settings to default"""
        if not messagebox.askyesno("Confirm Reset", 
                                  "Are you sure you want to reset all settings to default?"):
            return
            
        # Reset profile fields
        self.name_entry.delete(0, 'end')
        self.name_entry.insert(0, self.user_data.get('username', ''))
        self.email_entry.delete(0, 'end')
        self.email_entry.insert(0, '')
        
        # Reset password fields
        self.current_pass_entry.delete(0, 'end')
        self.new_pass_entry.delete(0, 'end')
        self.confirm_pass_entry.delete(0, 'end')
        
        # Reset theme
        self.theme_var.set("System")
        self.change_theme("System")
        
        messagebox.showinfo("Success", "Settings reset to default!")
