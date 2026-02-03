import customtkinter as ctk
from tkinter import messagebox, filedialog
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import csv
from datetime import datetime
from database import Database

class ReportsWindow:
    def __init__(self, parent, user_data):
        self.parent = parent
        self.user_data = user_data
        self.db = Database()
        
        # Clear existing content
        for widget in parent.winfo_children():
            widget.destroy()
        
        # Configure grid
        parent.grid_columnconfigure(0, weight=1)
        parent.grid_rowconfigure(0, weight=1)
        
        # Create main frame
        self.main_frame = ctk.CTkFrame(parent)
        self.main_frame.grid(row=0, column=0, sticky="nsew", padx=20, pady=20)
        self.main_frame.grid_columnconfigure(0, weight=1)
        
        # Title and button frame
        self.title_frame = ctk.CTkFrame(self.main_frame)
        self.title_frame.grid(row=0, column=0, sticky="ew", pady=(0, 20))
        self.title_frame.grid_columnconfigure(0, weight=1)
        
        # Title
        self.title_label = ctk.CTkLabel(
            self.title_frame,
            text="Inventory Reports",
            font=ctk.CTkFont(size=24, weight="bold")
        )
        self.title_label.grid(row=0, column=0, padx=20, pady=10)
        
        # Generate Report button at the top
        self.export_button = ctk.CTkButton(
            self.title_frame,
            text="Generate Report",
            command=self.export_report,
            fg_color="#2E7D32",
            hover_color="#1B5E20",
            width=150
        )
        self.export_button.grid(row=0, column=1, padx=20, pady=10)
        
        # Create report sections
        self.create_report_sections()
        
        # Create chart section
        self.create_chart_section()
        
        # Create back button
        self.back_button = ctk.CTkButton(
            self.main_frame,
            text="Back to Dashboard",
            command=self.back_to_dashboard,
            fg_color="#8E24AA",
            hover_color="#6A1B9A"
        )
        self.back_button.grid(row=4, column=0, pady=(0, 20))
        
        # Load initial data
        self.load_reports()

    def create_report_sections(self):
        # Create frame for report sections
        self.reports_frame = ctk.CTkFrame(self.main_frame)
        self.reports_frame.grid(row=1, column=0, sticky="nsew", pady=(0, 20))
        self.reports_frame.grid_columnconfigure((0, 1), weight=1)
        
        # Daily Sales
        self.daily_sales_frame = ctk.CTkFrame(self.reports_frame)
        self.daily_sales_frame.grid(row=0, column=0, padx=10, pady=10, sticky="nsew")
        self.daily_sales_label = ctk.CTkLabel(
            self.daily_sales_frame,
            text="Daily Sales Total",
            font=ctk.CTkFont(size=16, weight="bold")
        )
        self.daily_sales_label.pack(pady=(10, 5))
        self.daily_sales_value = ctk.CTkLabel(
            self.daily_sales_frame,
            text="Loading...",
            font=ctk.CTkFont(size=20)
        )
        self.daily_sales_value.pack(pady=(0, 10))
        
        # Monthly Sales
        self.monthly_sales_frame = ctk.CTkFrame(self.reports_frame)
        self.monthly_sales_frame.grid(row=0, column=1, padx=10, pady=10, sticky="nsew")
        self.monthly_sales_label = ctk.CTkLabel(
            self.monthly_sales_frame,
            text="Monthly Sales Total",
            font=ctk.CTkFont(size=16, weight="bold")
        )
        self.monthly_sales_label.pack(pady=(10, 5))
        self.monthly_sales_value = ctk.CTkLabel(
            self.monthly_sales_frame,
            text="Loading...",
            font=ctk.CTkFont(size=20)
        )
        self.monthly_sales_value.pack(pady=(0, 10))
        
        # Top Products
        self.top_products_frame = ctk.CTkFrame(self.reports_frame)
        self.top_products_frame.grid(row=1, column=0, padx=10, pady=10, sticky="nsew")
        self.top_products_label = ctk.CTkLabel(
            self.top_products_frame,
            text="Top 5 Selling Products",
            font=ctk.CTkFont(size=16, weight="bold")
        )
        self.top_products_label.pack(pady=(10, 5))
        self.top_products_text = ctk.CTkTextbox(
            self.top_products_frame,
            height=150
        )
        self.top_products_text.pack(padx=10, pady=(0, 10))
        
        # Sales by Employee
        self.employee_sales_frame = ctk.CTkFrame(self.reports_frame)
        self.employee_sales_frame.grid(row=1, column=1, padx=10, pady=10, sticky="nsew")
        self.employee_sales_label = ctk.CTkLabel(
            self.employee_sales_frame,
            text="Sales by Employee",
            font=ctk.CTkFont(size=16, weight="bold")
        )
        self.employee_sales_label.pack(pady=(10, 5))
        self.employee_sales_text = ctk.CTkTextbox(
            self.employee_sales_frame,
            height=150
        )
        self.employee_sales_text.pack(padx=10, pady=(0, 10))

    def create_chart_section(self):
        # Create frame for chart
        self.chart_frame = ctk.CTkFrame(self.main_frame)
        self.chart_frame.grid(row=2, column=0, sticky="nsew", pady=(0, 20))
        
        # Configure grid weights
        self.chart_frame.grid_rowconfigure(0, weight=1)
        self.chart_frame.grid_columnconfigure(0, weight=1)
        
        # Create matplotlib figure with adjusted size
        self.figure, self.ax = plt.subplots(figsize=(10, 4), dpi=100)
        self.figure.patch.set_facecolor('white')
        
        # Adjust subplot parameters
        plt.subplots_adjust(left=0.1, right=0.95, top=0.95, bottom=0.3)
        
        # Create canvas
        self.canvas = FigureCanvasTkAgg(self.figure, master=self.chart_frame)
        self.canvas.draw()
        self.canvas.get_tk_widget().grid(row=0, column=0, sticky="nsew", padx=10, pady=10)

    def load_reports(self):
        try:
            # Load daily sales
            daily_sales = self.db.execute_query(
                """
                SELECT COALESCE(SUM(total_amount), 0) as total
                FROM sales
                WHERE DATE(created_at) = CURDATE()
                """
            )[0]['total']
            self.daily_sales_value.configure(text=f"SLL {daily_sales:,.2f}")
            
            # Load monthly sales
            monthly_sales = self.db.execute_query(
                """
                SELECT COALESCE(SUM(total_amount), 0) as total
                FROM sales
                WHERE MONTH(created_at) = MONTH(CURDATE())
                AND YEAR(created_at) = YEAR(CURDATE())
                """
            )[0]['total']
            self.monthly_sales_value.configure(text=f"SLL {monthly_sales:,.2f}")
            
            # Load top products
            top_products = self.db.execute_query(
                """
                SELECT p.name, COUNT(s.id) as total_sold
                FROM sales s
                JOIN products p ON s.product_id = p.id
                WHERE MONTH(s.created_at) = MONTH(CURDATE())
                AND YEAR(s.created_at) = YEAR(CURDATE())
                GROUP BY p.id, p.name
                ORDER BY total_sold DESC
                LIMIT 5
                """
            )
            
            self.top_products_text.delete("1.0", "end")
            for product in top_products:
                self.top_products_text.insert("end", f"{product['name']}: {product['total_sold']} units\n")
            
            # Load employee sales (if user_id exists in sales table)
            try:
                employee_sales = self.db.execute_query(
                    """
                    SELECT u.username, COUNT(s.id) as total_sales, COALESCE(SUM(s.total_amount), 0) as total_amount
                    FROM sales s
                    JOIN users u ON s.user_id = u.id
                    WHERE MONTH(s.created_at) = MONTH(CURDATE())
                    AND YEAR(s.created_at) = YEAR(CURDATE())
                    GROUP BY u.id, u.username
                    ORDER BY total_amount DESC
                    """
                )
                
                self.employee_sales_text.delete("1.0", "end")
                for emp in employee_sales:
                    self.employee_sales_text.insert("end", 
                        f"{emp['username']}: {emp['total_sales']} sales, SLL {emp['total_amount']:,.2f}\n")
            except:
                # If user_id doesn't exist, show a message
                self.employee_sales_text.delete("1.0", "end")
                self.employee_sales_text.insert("end", "Employee tracking not available")
            
            # Load category sales chart
            self.update_category_chart()
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to load reports: {str(e)}")

    def update_category_chart(self):
        try:
            # Get sales by category
            category_sales = self.db.execute_query(
                """
                SELECT c.name as category, COALESCE(SUM(s.total_amount), 0) as total_sales
                FROM sales s
                JOIN products p ON s.product_id = p.id
                JOIN categories c ON p.category_id = c.id
                WHERE MONTH(s.created_at) = MONTH(CURDATE())
                AND YEAR(s.created_at) = YEAR(CURDATE())
                GROUP BY c.id, c.name
                ORDER BY total_sales DESC
                """
            )
            
            # Clear previous chart
            self.ax.clear()
            
            if not category_sales:
                self.ax.text(0.5, 0.5, 'No sales data available', 
                            horizontalalignment='center',
                            verticalalignment='center',
                            transform=self.ax.transAxes,
                            fontsize=12)
            else:
                # Create bar chart
                categories = [cat['category'] for cat in category_sales]
                sales = [cat['total_sales'] for cat in category_sales]
                
                # Create bars with custom styling
                bars = self.ax.bar(categories, sales, color='#2E7D32', alpha=0.8, width=0.6)
                
                # Add value labels on top of each bar with smaller font
                for bar in bars:
                    height = bar.get_height()
                    self.ax.text(bar.get_x() + bar.get_width()/2., height,
                               f'SLL {height:,.0f}',
                               ha='center', va='bottom',
                               fontsize=8,
                               rotation=0)
                
                # Customize chart appearance with smaller fonts
                self.ax.set_title('Sales by Category', fontsize=12, fontweight='bold', pad=20)
                self.ax.set_xlabel('Category', fontsize=10)
                self.ax.set_ylabel('Sales (SLL)', fontsize=10)
                
                # Format y-axis to show SLL with smaller font
                self.ax.tick_params(axis='y', labelsize=8)
                self.ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'SLL {x:,.0f}'))
                
                # Rotate x-axis labels for better readability with smaller font
                plt.xticks(rotation=45, ha='right', fontsize=8)
                
                # Add grid for better readability
                self.ax.grid(True, axis='y', alpha=0.3)
                
                # Adjust layout to prevent label cutoff
                plt.tight_layout()
            
            # Update canvas
            self.canvas.draw()
            
        except Exception as e:
            print(f"Error updating chart: {str(e)}")
            # Show error message in chart
            self.ax.clear()
            self.ax.text(0.5, 0.5, f'Error loading chart: {str(e)}', 
                        horizontalalignment='center',
                        verticalalignment='center',
                        transform=self.ax.transAxes,
                        fontsize=10)
            self.canvas.draw()

    def export_report(self):
        try:
            # Get file path from user
            file_path = filedialog.asksaveasfilename(
                defaultextension=".csv",
                filetypes=[("CSV files", "*.csv"), ("All files", "*.*")],
                initialfile=f"inventory_report_{datetime.now().strftime('%Y%m%d')}.csv"
            )
            
            if not file_path:
                return
            
            # Get all report data
            daily_sales = self.db.execute_query(
                """
                SELECT COALESCE(SUM(total_amount), 0) as total
                FROM sales
                WHERE DATE(created_at) = CURDATE()
                """
            )[0]['total']
            
            monthly_sales = self.db.execute_query(
                """
                SELECT COALESCE(SUM(total_amount), 0) as total
                FROM sales
                WHERE MONTH(created_at) = MONTH(CURDATE())
                AND YEAR(created_at) = YEAR(CURDATE())
                """
            )[0]['total']
            
            top_products = self.db.execute_query(
                """
                SELECT p.name, COUNT(s.id) as total_sold
                FROM sales s
                JOIN products p ON s.product_id = p.id
                WHERE MONTH(s.created_at) = MONTH(CURDATE())
                AND YEAR(s.created_at) = YEAR(CURDATE())
                GROUP BY p.id, p.name
                ORDER BY total_sold DESC
                LIMIT 5
                """
            )
            
            # Create CSV file
            with open(file_path, 'w', newline='') as csvfile:
                writer = csv.writer(csvfile)
                
                # Write summary
                writer.writerow(['Inventory Management System Report'])
                writer.writerow(['Generated on:', datetime.now().strftime('%Y-%m-%d %H:%M:%S')])
                writer.writerow([])
                
                # Write sales summary
                writer.writerow(['Sales Summary'])
                writer.writerow(['Daily Sales Total:', f"SLL {daily_sales:,.2f}"])
                writer.writerow(['Monthly Sales Total:', f"SLL {monthly_sales:,.2f}"])
                writer.writerow([])
                
                # Write top products
                writer.writerow(['Top 5 Selling Products'])
                writer.writerow(['Product Name', 'Units Sold'])
                for product in top_products:
                    writer.writerow([product['name'], product['total_sold']])
                writer.writerow([])
                
                # Try to write employee sales if available
                try:
                    employee_sales = self.db.execute_query(
                        """
                        SELECT u.username, COUNT(s.id) as total_sales, COALESCE(SUM(s.total_amount), 0) as total_amount
                        FROM sales s
                        JOIN users u ON s.user_id = u.id
                        WHERE MONTH(s.created_at) = MONTH(CURDATE())
                        AND YEAR(s.created_at) = YEAR(CURDATE())
                        GROUP BY u.id, u.username
                        ORDER BY total_amount DESC
                        """
                    )
                    
                    writer.writerow(['Sales by Employee'])
                    writer.writerow(['Employee', 'Number of Sales', 'Total Amount (SLL)'])
                    for emp in employee_sales:
                        writer.writerow([emp['username'], emp['total_sales'], f"SLL {emp['total_amount']:,.2f}"])
                except:
                    writer.writerow(['Sales by Employee'])
                    writer.writerow(['Employee tracking not available'])
            
            messagebox.showinfo("Success", "Report exported successfully!")
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to export report: {str(e)}")

    def back_to_dashboard(self):
        # Clear current content
        for widget in self.parent.winfo_children():
            widget.destroy()
        
        # Import here to avoid circular import
        from dashboard import Dashboard
        dashboard = Dashboard(self.user_data)
        dashboard.create_main_content()
        dashboard.load_dashboard_stats()
