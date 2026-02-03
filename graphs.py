import customtkinter as ctk
from tkinter import ttk
from matplotlib.figure import Figure
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import matplotlib.pyplot as plt
from datetime import datetime
from database import Database
from config import GUI_CONFIG, CURRENCY_SYMBOL
from utils import format_currency

class GraphWindow:
    def __init__(self, parent, user_data):
        self.parent = parent
        self.user_data = user_data
        self.db = Database()
        
        # Check database data
        has_sales, has_purchases = self.check_database_data()
        print(f"Database check: Sales data: {has_sales}, Purchases data: {has_purchases}")
        
        # Clear the parent frame
        for widget in parent.winfo_children():
            widget.destroy()
            
        # Create graph window frame
        self.graph_frame = ctk.CTkFrame(parent)
        self.graph_frame.pack(fill="both", expand=True, padx=20, pady=20)
        
        # Create header
        self.header = ctk.CTkLabel(
            self.graph_frame,
            text="Data Visualization",
            font=ctk.CTkFont(size=24, weight="bold")
        )
        self.header.pack(pady=(10, 20))
        
        # Create summary statistics
        self.create_summary_stats()
        
        # Create notebook for different graphs
        self.notebook = ttk.Notebook(self.graph_frame)
        self.notebook.pack(fill="both", expand=True, padx=10, pady=10)
        
        # Create tabs for different graphs
        self.create_sales_tab()
        self.create_inventory_tab()
        self.create_category_tab()
        
        # Only show purchases tab for admin users and if there is purchase data
        if self.user_data.get('role') == 'admin' and has_purchases:
            self.create_purchases_tab()
        
        # Back button
        self.back_button = ctk.CTkButton(
            self.graph_frame,
            text="Back to Dashboard",
            command=self.back_to_dashboard,
            width=150
        )
        self.back_button.pack(pady=10)
    
    def check_database_data(self):
        """Check if the database has sales and purchase data"""
        try:
            # Check sales data
            sales_count = self.db.execute_query("SELECT COUNT(*) as count FROM sales")[0]['count']
            print(f"Database contains {sales_count} sales records")
            
            # Check purchase data
            purchases_count = self.db.execute_query("SELECT COUNT(*) as count FROM purchases")[0]['count']
            print(f"Database contains {purchases_count} purchase records")
            
            return sales_count > 0, purchases_count > 0
        except Exception as e:
            print(f"Error checking database data: {e}")
            return False, False
    
    def create_summary_stats(self):
        """Create summary statistics section"""
        # Create summary frame
        self.summary_frame = ctk.CTkFrame(self.graph_frame)
        self.summary_frame.pack(fill="x", padx=10, pady=10)
        
        # Summary label
        summary_label = ctk.CTkLabel(
            self.summary_frame,
            text="Summary Statistics",
            font=ctk.CTkFont(size=18, weight="bold")
        )
        summary_label.pack(pady=(10, 5))
        
        # Create stats container
        stats_container = ctk.CTkFrame(self.summary_frame)
        stats_container.pack(fill="x", padx=10, pady=5)
        
        try:
            # Get highest sales day
            highest_sales = self.db.execute_query(
                """
                SELECT DATE(created_at) as date, SUM(total_amount) as total
                FROM sales
                GROUP BY DATE(created_at)
                ORDER BY total DESC
                LIMIT 1
                """
            )
            
            # Get highest purchase day
            highest_purchase = self.db.execute_query(
                """
                SELECT DATE(date) as date, SUM(total_amount) as total
                FROM purchases
                GROUP BY DATE(date)
                ORDER BY total DESC
                LIMIT 1
                """
            )
            
            # Get average daily sales
            avg_sales = self.db.execute_query(
                """
                SELECT AVG(daily_total) as average
                FROM (
                    SELECT DATE(created_at) as date, SUM(total_amount) as daily_total
                    FROM sales
                    GROUP BY DATE(created_at)
                ) as daily_sales
                """
            )
            
            # Get average daily purchases
            avg_purchases = self.db.execute_query(
                """
                SELECT AVG(daily_total) as average
                FROM (
                    SELECT DATE(date) as date, SUM(total_amount) as daily_total
                    FROM purchases
                    GROUP BY DATE(date)
                ) as daily_purchases
                """
            )
            
            # Display stats
            if highest_sales:
                highest_sales_date = highest_sales[0]['date']
                highest_sales_value = highest_sales[0]['total']
                
                highest_sales_label = ctk.CTkLabel(
                    stats_container,
                    text=f"Highest Sales Day: {format_currency(highest_sales_value)} on {highest_sales_date}",
                    font=ctk.CTkFont(size=14)
                )
                highest_sales_label.grid(row=0, column=0, padx=20, pady=5, sticky="w")
            
            if highest_purchase:
                highest_purchase_date = highest_purchase[0]['date']
                highest_purchase_value = highest_purchase[0]['total']
                
                highest_purchase_label = ctk.CTkLabel(
                    stats_container,
                    text=f"Highest Purchase Day: {format_currency(highest_purchase_value)} on {highest_purchase_date}",
                    font=ctk.CTkFont(size=14)
                )
                highest_purchase_label.grid(row=1, column=0, padx=20, pady=5, sticky="w")
            
            if avg_sales and avg_sales[0]['average']:
                avg_sales_value = avg_sales[0]['average']
                
                avg_sales_label = ctk.CTkLabel(
                    stats_container,
                    text=f"Average Daily Sales: {format_currency(avg_sales_value)}",
                    font=ctk.CTkFont(size=14)
                )
                avg_sales_label.grid(row=0, column=1, padx=20, pady=5, sticky="w")
            
            if avg_purchases and avg_purchases[0]['average']:
                avg_purchases_value = avg_purchases[0]['average']
                
                avg_purchases_label = ctk.CTkLabel(
                    stats_container,
                    text=f"Average Daily Purchases: {format_currency(avg_purchases_value)}",
                    font=ctk.CTkFont(size=14)
                )
                avg_purchases_label.grid(row=1, column=1, padx=20, pady=5, sticky="w")
                
        except Exception as e:
            print(f"Error loading summary statistics: {e}")
            error_label = ctk.CTkLabel(
                stats_container,
                text=f"Error loading statistics: {str(e)}",
                font=ctk.CTkFont(size=14),
                text_color="red"
            )
            error_label.pack(padx=20, pady=10)
    
    def create_sales_tab(self):
        print("Creating sales tab...")
        # Create sales tab
        self.sales_tab = ctk.CTkFrame(self.notebook)
        self.notebook.add(self.sales_tab, text="Sales")
        
        # Create figure for sales graph
        self.sales_figure = Figure(figsize=(6, 4), dpi=100)
        self.sales_plot = self.sales_figure.add_subplot(111)
        
        # Get sales data from database
        try:
            print("Querying sales data from database...")
            sales_data = self.db.execute_query(
                """
                SELECT DATE(created_at) as date, SUM(total_amount) as total
                FROM sales
                GROUP BY DATE(created_at)
                ORDER BY DATE(created_at)
                LIMIT 30
                """
            )
            print(f"Retrieved {len(sales_data)} sales records")
            
            if sales_data:
                dates = [item['date'] for item in sales_data]
                totals = [float(item['total']) for item in sales_data]
                print(f"Processing {len(dates)} data points for sales graph")
                
                # Find the highest sales day
                max_sales_index = totals.index(max(totals))
                max_sales_date = dates[max_sales_index]
                max_sales_value = totals[max_sales_index]
                
                # Plot sales data
                self.sales_plot.plot(dates, totals, 'b-')
                
                # Highlight the highest sales day
                self.sales_plot.scatter(max_sales_date, max_sales_value, color='red', s=100, zorder=5)
                
                # Add annotation for the highest sales day
                self.sales_plot.annotate(
                    f'Highest: {format_currency(max_sales_value)}',
                    xy=(max_sales_date, max_sales_value),
                    xytext=(10, 20),
                    textcoords='offset points',
                    arrowprops=dict(arrowstyle='->'),
                    bbox=dict(boxstyle='round,pad=0.5', fc='yellow', alpha=0.5)
                )
                
                # Set title with highest sales info
                self.sales_plot.set_title(f'Daily Sales Trend (Highest: {format_currency(max_sales_value)} on {max_sales_date})')
                self.sales_plot.set_xlabel('Date')
                self.sales_plot.set_ylabel(f'Sales ({CURRENCY_SYMBOL})')
                self.sales_plot.tick_params(axis='x', rotation=45)
                self.sales_figure.tight_layout()
                print("Sales graph plotted successfully")
            else:
                print("No sales data available")
                self.sales_plot.text(0.5, 0.5, 'No sales data available', 
                                    horizontalalignment='center',
                                    verticalalignment='center',
                                    transform=self.sales_plot.transAxes)
        except Exception as e:
            print(f"Error loading sales data: {e}")
            self.sales_plot.text(0.5, 0.5, f'Error loading sales data: {str(e)}', 
                                horizontalalignment='center',
                                verticalalignment='center',
                                transform=self.sales_plot.transAxes)
        
        # Create canvas
        self.sales_canvas = FigureCanvasTkAgg(self.sales_figure, master=self.sales_tab)
        self.sales_canvas.draw()
        self.sales_canvas.get_tk_widget().pack(fill="both", expand=True)
        print("Sales tab created successfully")
    
    def create_inventory_tab(self):
        # Create inventory tab
        self.inventory_tab = ctk.CTkFrame(self.notebook)
        self.notebook.add(self.inventory_tab, text="Inventory")
        
        # Create figure for inventory graph
        self.inventory_figure = Figure(figsize=(6, 4), dpi=100)
        self.inventory_plot = self.inventory_figure.add_subplot(111)
        
        # Get inventory data from database
        try:
            inventory_data = self.db.execute_query(
                """
                SELECT p.name, s.quantity
                FROM products p
                JOIN stock s ON p.id = s.product_id
                ORDER BY s.quantity DESC
                LIMIT 10
                """
            )
            
            if inventory_data:
                products = [item['name'] for item in inventory_data]
                quantities = [int(item['quantity']) for item in inventory_data]
                
                # Find the highest stocked product
                max_stock_index = quantities.index(max(quantities))
                max_stock_product = products[max_stock_index]
                max_stock_value = quantities[max_stock_index]
                
                # Plot inventory data
                bars = self.inventory_plot.bar(products, quantities)
                
                # Highlight the highest stocked product
                bars[max_stock_index].set_color('red')
                
                # Add annotation for the highest stocked product
                self.inventory_plot.annotate(
                    f'Highest: {max_stock_value} units',
                    xy=(max_stock_index, max_stock_value),
                    xytext=(10, 20),
                    textcoords='offset points',
                    arrowprops=dict(arrowstyle='->'),
                    bbox=dict(boxstyle='round,pad=0.5', fc='yellow', alpha=0.5)
                )
                
                # Set title with highest stock info
                self.inventory_plot.set_title(f'Top 10 Products by Stock Quantity (Highest: {max_stock_product} with {max_stock_value} units)')
                self.inventory_plot.set_xlabel('Product')
                self.inventory_plot.set_ylabel('Quantity')
                self.inventory_plot.tick_params(axis='x', rotation=45)
                self.inventory_figure.tight_layout()
            else:
                self.inventory_plot.text(0.5, 0.5, 'No inventory data available', 
                                        horizontalalignment='center',
                                        verticalalignment='center',
                                        transform=self.inventory_plot.transAxes)
        except Exception as e:
            self.inventory_plot.text(0.5, 0.5, f'Error loading inventory data: {str(e)}', 
                                    horizontalalignment='center',
                                    verticalalignment='center',
                                    transform=self.inventory_plot.transAxes)
        
        # Create canvas
        self.inventory_canvas = FigureCanvasTkAgg(self.inventory_figure, master=self.inventory_tab)
        self.inventory_canvas.draw()
        self.inventory_canvas.get_tk_widget().pack(fill="both", expand=True)
    
    def create_category_tab(self):
        # Create category tab
        self.category_tab = ctk.CTkFrame(self.notebook)
        self.notebook.add(self.category_tab, text="Categories")
        
        # Create figure for category graph
        self.category_figure = Figure(figsize=(6, 4), dpi=100)
        self.category_plot = self.category_figure.add_subplot(111)
        
        # Get category data from database
        try:
            category_data = self.db.execute_query(
                """
                SELECT c.name, COUNT(p.id) as product_count
                FROM categories c
                LEFT JOIN products p ON c.id = p.category_id
                GROUP BY c.id, c.name
                ORDER BY product_count DESC
                """
            )
            
            if category_data:
                categories = [item['name'] for item in category_data]
                counts = [int(item['product_count']) for item in category_data]
                
                # Find the category with most products
                max_category_index = counts.index(max(counts))
                max_category_name = categories[max_category_index]
                max_category_count = counts[max_category_index]
                
                # Create explode array to highlight the largest category
                explode = [0] * len(categories)
                explode[max_category_index] = 0.1
                
                # Plot category data as a pie chart
                wedges, texts, autotexts = self.category_plot.pie(
                    counts, 
                    labels=categories, 
                    autopct='%1.1f%%',
                    explode=explode,
                    shadow=True
                )
                
                # Highlight the text for the largest category
                autotexts[max_category_index].set_color('red')
                autotexts[max_category_index].set_fontweight('bold')
                
                # Set title with highest category info
                self.category_plot.set_title(f'Products by Category (Highest: {max_category_name} with {max_category_count} products)')
                self.category_figure.tight_layout()
            else:
                self.category_plot.text(0.5, 0.5, 'No category data available', 
                                      horizontalalignment='center',
                                      verticalalignment='center',
                                      transform=self.category_plot.transAxes)
        except Exception as e:
            self.category_plot.text(0.5, 0.5, f'Error loading category data: {str(e)}', 
                                  horizontalalignment='center',
                                  verticalalignment='center',
                                  transform=self.category_plot.transAxes)
        
        # Create canvas
        self.category_canvas = FigureCanvasTkAgg(self.category_figure, master=self.category_tab)
        self.category_canvas.draw()
        self.category_canvas.get_tk_widget().pack(fill="both", expand=True)
    
    def create_purchases_tab(self):
        print("Creating purchases tab...")
        # Create purchases tab (admin only)
        self.purchases_tab = ctk.CTkFrame(self.notebook)
        self.notebook.add(self.purchases_tab, text="Purchases")
        
        # Create figure for purchases graph
        self.purchases_figure = Figure(figsize=(6, 4), dpi=100)
        self.purchases_plot = self.purchases_figure.add_subplot(111)
        
        # Get purchases data from database
        try:
            print("Querying purchases data from database...")
            purchases_data = self.db.execute_query(
                """
                SELECT DATE(date) as date, SUM(total_amount) as total
                FROM purchases
                GROUP BY DATE(date)
                ORDER BY DATE(date)
                LIMIT 30
                """
            )
            print(f"Retrieved {len(purchases_data)} purchase records")
            
            if purchases_data:
                dates = [item['date'] for item in purchases_data]
                totals = [float(item['total']) for item in purchases_data]
                print(f"Processing {len(dates)} data points for purchases graph")
                
                # Find the highest purchase day
                max_purchase_index = totals.index(max(totals))
                max_purchase_date = dates[max_purchase_index]
                max_purchase_value = totals[max_purchase_index]
                
                # Plot purchases data
                self.purchases_plot.plot(dates, totals, 'g-')
                
                # Highlight the highest purchase day
                self.purchases_plot.scatter(max_purchase_date, max_purchase_value, color='red', s=100, zorder=5)
                
                # Add annotation for the highest purchase day
                self.purchases_plot.annotate(
                    f'Highest: {format_currency(max_purchase_value)}',
                    xy=(max_purchase_date, max_purchase_value),
                    xytext=(10, 20),
                    textcoords='offset points',
                    arrowprops=dict(arrowstyle='->'),
                    bbox=dict(boxstyle='round,pad=0.5', fc='yellow', alpha=0.5)
                )
                
                # Set title with highest purchase info
                self.purchases_plot.set_title(f'Daily Purchases Trend (Highest: {format_currency(max_purchase_value)} on {max_purchase_date})')
                self.purchases_plot.set_xlabel('Date')
                self.purchases_plot.set_ylabel(f'Purchases ({CURRENCY_SYMBOL})')
                self.purchases_plot.tick_params(axis='x', rotation=45)
                self.purchases_figure.tight_layout()
                print("Purchases graph plotted successfully")
            else:
                print("No purchases data available")
                self.purchases_plot.text(0.5, 0.5, 'No purchases data available', 
                                       horizontalalignment='center',
                                       verticalalignment='center',
                                       transform=self.purchases_plot.transAxes)
        except Exception as e:
            print(f"Error loading purchases data: {e}")
            self.purchases_plot.text(0.5, 0.5, f'Error loading purchases data: {str(e)}', 
                                   horizontalalignment='center',
                                   verticalalignment='center',
                                   transform=self.purchases_plot.transAxes)
        
        # Create canvas
        self.purchases_canvas = FigureCanvasTkAgg(self.purchases_figure, master=self.purchases_tab)
        self.purchases_canvas.draw()
        self.purchases_canvas.get_tk_widget().pack(fill="both", expand=True)
        print("Purchases tab created successfully")
    
    def back_to_dashboard(self):
        # Import here to avoid circular import
        from dashboard import Dashboard
        dashboard = Dashboard(self.user_data)
        dashboard.show_dashboard()
