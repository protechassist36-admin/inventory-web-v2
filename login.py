import customtkinter as ctk
from tkinter import messagebox, simpledialog, font
from database import Database
from utils import hash_password, verify_password
from config import ROLES
import time

# Company name and version
COMPANY_NAME = "ProTech Assist (SL) Limited"
APP_VERSION = "1.0.0"

class SplashScreen:
    def __init__(self, root, callback):
        self.root = root
        self.callback = callback
        
        # Create splash screen window
        self.splash = ctk.CTkToplevel(root)
        self.splash.title("Inventory Management System")
        
        # Make splash screen centered and without window decorations
        self.splash.overrideredirect(True)
        
        # Set splash screen size
        width = 550
        height = 400
        screen_width = self.splash.winfo_screenwidth()
        screen_height = self.splash.winfo_screenheight()
        x = (screen_width // 2) - (width // 2)
        y = (screen_height // 2) - (height // 2)
        self.splash.geometry(f"{width}x{height}+{x}+{y}")
        
        # Create a frame for the splash screen content
        self.frame = ctk.CTkFrame(self.splash, corner_radius=15)
        self.frame.pack(fill="both", expand=True, padx=20, pady=20)
        
        # Add logo placeholder
        self.logo_label = ctk.CTkLabel(
            self.frame,
            text="📦",
            font=ctk.CTkFont(size=80)
        )
        self.logo_label.pack(pady=(20, 10))
        
        # Add app name
        self.app_name = ctk.CTkLabel(
            self.frame,
            text="Inventory Management System",
            font=ctk.CTkFont(size=24, weight="bold")
        )
        self.app_name.pack(pady=(0, 5))
        
        # Add version
        self.version_label = ctk.CTkLabel(
            self.frame,
            text=f"Version {APP_VERSION}",
            font=ctk.CTkFont(size=12)
        )
        self.version_label.pack(pady=(0, 5))
        
        # Add company name
        self.company_name = ctk.CTkLabel(
            self.frame,
            text=COMPANY_NAME,
            font=ctk.CTkFont(size=16),
            wraplength=400
        )
        self.company_name.pack(pady=(0, 5))
        
        # Add developed by text
        self.developed_by_label = ctk.CTkLabel(
            self.frame,
            text=f"Developed by {COMPANY_NAME}",
            font=ctk.CTkFont(size=12),
            wraplength=400
        )
        self.developed_by_label.pack(pady=(0, 15))
        
        # Add loading text
        self.loading_label = ctk.CTkLabel(
            self.frame,
            text="Loading...",
            font=ctk.CTkFont(size=14)
        )
        self.loading_label.pack(pady=(10, 15))
        
        # Add progress bar
        self.progress = ctk.CTkProgressBar(self.frame, width=400, height=10)
        self.progress.pack(pady=(0, 20))
        self.progress.set(0)
        
        # Start the animation
        self.animate_progress()
        
        # Schedule the splash screen to close after 3 seconds
        self.splash.after(3000, self.close_splash)
    
    def animate_progress(self):
        """Animate the progress bar"""
        current_value = self.progress.get()
        if current_value < 1:
            self.progress.set(current_value + 0.05)
            self.splash.after(50, self.animate_progress)
    
    def close_splash(self):
        """Close the splash screen and show the login window"""
        self.progress.set(1)  # Ensure progress bar is full
        self.splash.destroy()
        self.callback()  # Call the callback to show the login window

class LoginWindow:
    def __init__(self):
        self.root = ctk.CTk()
        self.root.withdraw()  # Hide the main window initially
        
        # Show splash screen first
        self.splash = SplashScreen(self.root, self.show_login_window)
        
        # Initialize database
        self.db = Database()
        self.db.initialize_database()
        self.user_data = None
        self.first_login = False
    
    def show_login_window(self):
        """Show the login window after splash screen closes"""
        self.root.deiconify()  # Show the main window
        self.root.title(f"Inventory Management System v{APP_VERSION} - Login")
        # Significantly increased window size
        self.root.geometry("950x900+100+10")  # Increased height to 900
        
        # Configure grid weights
        self.root.grid_columnconfigure(0, weight=1)
        self.root.grid_rowconfigure(0, weight=1)
        
        # Create main frame
        self.main_frame = ctk.CTkFrame(self.root, corner_radius=15)
        self.main_frame.pack(fill="both", expand=True, padx=50, pady=50)
        
        # Create a scrollable frame for all content
        self.scrollable_frame = ctk.CTkScrollableFrame(
            self.main_frame, 
            corner_radius=15,
            fg_color="transparent"
        )
        self.scrollable_frame.pack(fill="both", expand=True, padx=10, pady=10)
        
        # Title with icon - centered at the top
        self.title_frame = ctk.CTkFrame(self.scrollable_frame, fg_color="transparent")
        self.title_frame.pack(pady=(20, 15))
        
        self.title_icon_label = ctk.CTkLabel(
            self.title_frame, 
            text="📦",
            font=ctk.CTkFont(size=48)
        )
        self.title_icon_label.pack(side="left", padx=(0, 15))
        
        self.title_label = ctk.CTkLabel(
            self.title_frame,
            text="Inventory Management System",
            font=ctk.CTkFont(size=28, weight="bold")
        )
        self.title_label.pack(side="left")
        
        # Version info
        self.version_label = ctk.CTkLabel(
            self.scrollable_frame,
            text=f"Version {APP_VERSION}",
            font=ctk.CTkFont(size=14)
        )
        self.version_label.pack(pady=(0, 5))
        
        # Company name
        self.company_label = ctk.CTkLabel(
            self.scrollable_frame,
            text=COMPANY_NAME,
            font=ctk.CTkFont(size=18),
            wraplength=600
        )
        self.company_label.pack(pady=(0, 10))
        
        # Separator line
        self.separator = ctk.CTkFrame(self.scrollable_frame, height=2, fg_color="gray70")
        self.separator.pack(fill="x", padx=40, pady=(0, 20))
        
        # Form frame
        self.form_frame = ctk.CTkFrame(self.scrollable_frame, fg_color="transparent")
        self.form_frame.pack(fill="x", padx=40, pady=(0, 20))
        
        # Username with icon
        self.username_frame = ctk.CTkFrame(self.form_frame, fg_color="transparent")
        self.username_frame.pack(fill="x", pady=(0, 15))
        
        self.username_icon_label = ctk.CTkLabel(
            self.username_frame, 
            text="👤",
            font=ctk.CTkFont(size=28)
        )
        self.username_icon_label.pack(side="left", padx=(0, 10))
        
        self.username_label = ctk.CTkLabel(
            self.username_frame,
            text="Username:",
            font=ctk.CTkFont(size=16)
        )
        self.username_label.pack(side="left")
        
        self.username_entry = ctk.CTkEntry(
            self.form_frame,
            placeholder_text="Enter username",
            width=350,
            height=45,
            corner_radius=10,
            border_width=2,
            border_color="gray30"
        )
        self.username_entry.pack(pady=(0, 15))
        
        # Password with icon
        self.password_frame = ctk.CTkFrame(self.form_frame, fg_color="transparent")
        self.password_frame.pack(fill="x", pady=(0, 15))
        
        self.password_icon_label = ctk.CTkLabel(
            self.password_frame, 
            text="🔒",
            font=ctk.CTkFont(size=28)
        )
        self.password_icon_label.pack(side="left", padx=(0, 10))
        
        self.password_label = ctk.CTkLabel(
            self.password_frame,
            text="Password:",
            font=ctk.CTkFont(size=16)
        )
        self.password_label.pack(side="left")
        
        self.password_entry = ctk.CTkEntry(
            self.form_frame,
            placeholder_text="Enter password",
            width=350,
            height=45,
            corner_radius=10,
            border_width=2,
            border_color="gray30",
            show="*"
        )
        self.password_entry.pack(pady=(0, 15))
        
        # Role Selection with icon
        self.role_frame = ctk.CTkFrame(self.form_frame, fg_color="transparent")
        self.role_frame.pack(fill="x", pady=(0, 15))
        
        self.role_icon_label = ctk.CTkLabel(
            self.role_frame, 
            text="👔",
            font=ctk.CTkFont(size=28)
        )
        self.role_icon_label.pack(side="left", padx=(0, 10))
        
        self.role_label = ctk.CTkLabel(
            self.role_frame,
            text="Role:",
            font=ctk.CTkFont(size=16)
        )
        self.role_label.pack(side="left")
        
        self.role_var = ctk.StringVar(value="user")
        self.role_menu = ctk.CTkOptionMenu(
            self.form_frame,
            variable=self.role_var,
            values=list(ROLES.keys()),
            width=350,
            height=45,
            corner_radius=10,
            fg_color="#3a3a3a",
            button_color="#1E88E5",
            button_hover_color="#1565C0"
        )
        self.role_menu.pack(pady=(0, 20))
        
        # Button frame
        self.button_frame = ctk.CTkFrame(self.scrollable_frame, fg_color="transparent")
        self.button_frame.pack(pady=10)
        
        # Login Button
        self.login_button = ctk.CTkButton(
            self.button_frame,
            text="🚪 Login",
            command=self.login,
            width=200,
            height=45,
            font=ctk.CTkFont(size=18, weight="bold"),
            corner_radius=10,
            fg_color="#1E88E5",
            hover_color="#1565C0"
        )
        self.login_button.pack(pady=(0, 10))
        
        # Forgot Password Button
        self.forgot_button = ctk.CTkButton(
            self.button_frame,
            text="❓ Forgot Password",
            command=self.forgot_password,
            width=200,
            height=35,
            font=ctk.CTkFont(size=14),
            corner_radius=10,
            fg_color="#8E24AA",
            hover_color="#6A1B9A"
        )
        self.forgot_button.pack()
        
        # Security Notice - completely new approach
        # Create a prominent frame for the security notice
        self.security_frame = ctk.CTkFrame(
            self.scrollable_frame,
            corner_radius=10,
            fg_color="#2b2b2b",
            border_width=2,
            border_color="#ff9500"  # Orange border to make it stand out
        )
        self.security_frame.pack(fill="x", padx=40, pady=30)
        
        # Security icon and text in a horizontal layout
        self.security_content = ctk.CTkFrame(self.security_frame, fg_color="transparent")
        self.security_content.pack(fill="both", expand=True, padx=15, pady=15)
        
        # Security icon
        self.security_icon_label = ctk.CTkLabel(
            self.security_content,
            text="⚠️",
            font=ctk.CTkFont(size=36)
        )
        self.security_icon_label.pack(side="left", padx=(0, 15))
        
        # Security text
        self.security_text = ctk.CTkLabel(
            self.security_content,
            text="For security, please change these default passwords after first login.\nIf you forget your password, use the \"Forgot Password\" option\nor contact your Administrator.",
            font=ctk.CTkFont(size=14, weight="bold"),  # Made text bold
            justify="left",
            wraplength=600,
            text_color="#ff9500"  # Orange text to match border
        )
        self.security_text.pack(side="left", fill="both", expand=True)
        
        # Add a title to the security notice
        self.security_title = ctk.CTkLabel(
            self.security_frame,
            text="SECURITY NOTICE",
            font=ctk.CTkFont(size=16, weight="bold"),
            text_color="#ff9500"
        )
        self.security_title.pack(anchor="w", padx=15, pady=(5, 0))
        
        # Developed by text
        self.developed_by_label = ctk.CTkLabel(
            self.scrollable_frame,
            text=f"Developed by {COMPANY_NAME}",
            font=ctk.CTkFont(size=12),
            wraplength=600
        )
        self.developed_by_label.pack(pady=(20, 5))
        
        # Copyright notice
        self.copyright_label = ctk.CTkLabel(
            self.scrollable_frame,
            text=f"© 2023 {COMPANY_NAME}. All rights reserved.",
            font=ctk.CTkFont(size=10),
            wraplength=600
        )
        self.copyright_label.pack(pady=(5, 20))
        
        # Bind Enter key to login
        self.root.bind('<Return>', lambda event: self.login())
        
        # Center the window
        self.root.update_idletasks()
        x = (self.root.winfo_screenwidth() // 2) - (self.root.winfo_width() // 2)
        y = (self.root.winfo_screenheight() // 2) - (self.root.winfo_height() // 2)
        self.root.geometry(f"+{x}+{y}")

    def login(self):
        username = self.username_entry.get()
        password = self.password_entry.get()
        role = self.role_var.get()
        if not username or not password:
            messagebox.showerror("Error", "Please enter both username and password")
            return
        
        # First, get the user from the database
        query = """
            SELECT id, username, role, password, password_changed 
            FROM users 
            WHERE username = %s AND role = %s
        """
        result = self.db.execute_query(query, (username, role))
        
        if result:
            user = result[0]
            stored_hash = user['password']
            
            # Use verify_password to check if the password matches
            if verify_password(password, stored_hash):
                self.user_data = {
                    'id': user['id'],
                    'username': user['username'],
                    'role': user['role'],
                    'password_changed': user['password_changed']
                }
                
                # Check if password has been changed
                if not self.user_data['password_changed']:
                    self.first_login = True
                    self.root.destroy()
                else:
                    self.root.destroy()
                return
        
        # If we get here, login failed
        messagebox.showerror("Error", "Invalid username, password or role")
        self.password_entry.delete(0, 'end')

    def forgot_password(self):
        username = simpledialog.askstring("Forgot Password", "Enter your username:")
        if username:
            query = "SELECT id FROM users WHERE username = %s"
            result = self.db.execute_query(query, (username,))
            if result:
                temp_password = "temp123"
                hashed_password = hash_password(temp_password)
                update_query = "UPDATE users SET password = %s, password_changed = 0 WHERE username = %s"
                self.db.execute_query(update_query, (hashed_password, username))
                messagebox.showinfo("Password Reset", f"Temporary password: {temp_password}\n\nPlease change this password after logging in.")
            else:
                messagebox.showerror("Error", "Username not found")
                
                # Set role based on username
                if username == "admin":
                    self.role_var.set("admin")
                elif username == "emp":
                    self.role_var.set("employee")
                elif username == "supp":
                    self.role_var.set("supplier")

    def run(self):
        self.root.mainloop()

def get_login():
    login_window = LoginWindow()
    login_window.run()
    return login_window.user_data, login_window.first_login

if __name__ == "__main__":
    user_data, first_login = get_login()
    if user_data:
        print(f"Welcome {user_data['username']} ({user_data['role']})")
        if first_login:
            print("First login detected. Please change your password.")
