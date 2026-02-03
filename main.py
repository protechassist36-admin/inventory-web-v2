import customtkinter as ctk
from login import get_login
from dashboard import Dashboard
from config import GUI_CONFIG
from database import Database
import logging
from typing import Optional, Tuple, Dict, Any


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class App:
    """Main application class handling login and dashboard management"""
    
    def __init__(self):
        self.user_data: Dict[str, Any] = self.create_default_user()
        self.first_login: bool = False
        self.initialize_database()
        
    @staticmethod
    def create_default_user() -> Dict[str, Any]:
        """Create and return default user data dictionary
        
        Returns:
            Dict[str, Any]: Default user data with guest account details
        """
        return {
            'id': None,
            'username': 'guest',
            'role': 'user',
            'email': '',
            'first_name': 'Guest',
            'last_name': 'User'
        }

    def initialize_database(self) -> None:
        """Initialize database and ensure schema is up to date"""
        try:
            logger.info("Initializing database...")
            db = Database()
            if not db.initialize_database():
                logger.error("Failed to initialize database")
                raise Exception("Database initialization failed")
            logger.info("Database initialized successfully")
        except Exception as e:
            logger.error(f"Database initialization error: {e}")
            raise

    def setup_gui(self) -> None:
        """Configure GUI appearance and theme from config"""
        try:
            ctk.set_appearance_mode(GUI_CONFIG.get('appearance_mode', 'System'))
            ctk.set_default_color_theme(GUI_CONFIG.get('color_theme', 'blue'))
            logger.info("GUI configuration applied successfully")
        except Exception as e:
            logger.error(f"Error setting up GUI configuration: {e}")
            raise

    def handle_login(self) -> bool:
        """Handle login process with proper error handling
        
        Returns:
            bool: True if login was successful, False otherwise
        """
        try:
            login_result = get_login()
            if login_result:
                self.user_data, self.first_login = login_result
                logger.info(f"User logged in: {self.user_data.get('username', 'Unknown')}")
                return True
            else:
                logger.info("Login cancelled or failed")
                return False
        except ImportError as e:
            logger.error(f"Login module not found: {e}")
            return False
        except Exception as e:
            logger.error(f"Error during login: {e}")
            return False

    def run_dashboard(self) -> None:
        """Initialize and run the dashboard with current user data"""
        try:
            dashboard = Dashboard(self.user_data)
            logger.info("Dashboard created successfully")
            dashboard.run()
        except Exception as e:
            logger.error(f"Error creating dashboard: {e}")
            raise

    def run(self) -> None:
        """Main application runner"""
        try:
            # Setup GUI configuration
            self.setup_gui()
            
            # Attempt login
            if not self.handle_login():
                logger.info("Using default guest account")
            
            # Run dashboard
            self.run_dashboard()
            
        except Exception as e:
            logger.error(f"Fatal error in application: {e}")
            raise
        finally:
            logger.info("Application shutdown")

def main() -> None:
    """Main entry point for the application"""
    try:
        app = App()
        app.run()
    except KeyboardInterrupt:
        logger.info("Application interrupted by user")
    except Exception as e:
        logger.error(f"Unhandled exception in main: {e}")
        raise

if __name__ == "__main__":
    main()
