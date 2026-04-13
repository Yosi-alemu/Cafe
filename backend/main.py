from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3

app = FastAPI()

# CORS Middleware - allows the frontend to talk to this server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database Initialization
def init_db():
    conn = sqlite3.connect("cafe.db")
    cursor = conn.cursor()
    cursor.execute('''CREATE TABLE IF NOT EXISTS orders 
                      (id INTEGER PRIMARY KEY AUTOINCREMENT, 
                       items TEXT, 
                       total REAL, 
                       table_number TEXT, 
                       status TEXT)''')
    cursor.execute('''CREATE TABLE IF NOT EXISTS expenses 
                      (id INTEGER PRIMARY KEY AUTOINCREMENT, 
                       description TEXT, 
                       amount REAL)''')
    cursor.execute('''CREATE TABLE IF NOT EXISTS menu 
                      (id INTEGER PRIMARY KEY AUTOINCREMENT, 
                       name TEXT, 
                       price REAL, 
                       target TEXT)''')
    
    # Seed default menu if empty
    cursor.execute("SELECT COUNT(*) FROM menu")
    if cursor.fetchone()[0] == 0:
        default_menu = [
            ('Espresso', 3.0, 'barista'),
            ('Latte', 4.0, 'barista'),
            ('Cappuccino', 4.0, 'barista'),
            ('Iced Coffee', 4.5, 'barista'),
            ('Tea', 2.5, 'barista'),
            ('Croissant', 3.5, 'cake'),
            ('Cheesecake', 5.0, 'cake'),
            ('Muffin', 3.0, 'cake'),
            ('Cookie', 2.0, 'cake')
        ]
        cursor.executemany("INSERT INTO menu (name, price, target) VALUES (?, ?, ?)", default_menu)

    conn.commit()
    conn.close()

init_db()

# Models - These must match the JS object keys exactly
class Order(BaseModel):
    items: str
    total: float
    table_number: str
    status: str

class Expense(BaseModel):
    description: str
    amount: float

class MenuItem(BaseModel):
    name: str
    price: float
    target: str

# Routes
@app.get("/orders/")
def get_orders():
    conn = sqlite3.connect("cafe.db")
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM orders")
    rows = cursor.fetchall()
    conn.close()
    return [{"id": r[0], "items": r[1], "total": r[2], "table_number": r[3], "status": r[4]} for r in rows]

@app.post("/orders/")
def create_order(order: Order):
    try:
        conn = sqlite3.connect("cafe.db")
        cursor = conn.cursor()
        cursor.execute("INSERT INTO orders (items, total, table_number, status) VALUES (?, ?, ?, ?)",
                       (order.items, order.total, order.table_number, order.status))
        conn.commit()
        conn.close()
        return {"message": "Order created"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/orders/{order_id}")
def update_status(order_id: int, status: str):
    conn = sqlite3.connect("cafe.db")
    cursor = conn.cursor()
    cursor.execute("UPDATE orders SET status = ? WHERE id = ?", (status, order_id))
    conn.commit()
    conn.close()
    return {"message": "Updated"}

@app.post("/expenses/")
def create_expense(exp: Expense):
    conn = sqlite3.connect("cafe.db")
    cursor = conn.cursor()
    cursor.execute("INSERT INTO expenses (description, amount) VALUES (?, ?)", (exp.description, exp.amount))
    conn.commit()
    conn.close()
    return {"message": "Expense logged"}

@app.get("/expenses/")
def get_expenses():
    conn = sqlite3.connect("cafe.db")
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM expenses")
    rows = cursor.fetchall()
    conn.close()
    return [{"id": r[0], "description": r[1], "amount": r[2]} for r in rows]

@app.get("/menu/")
def get_menu():
    conn = sqlite3.connect("cafe.db")
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM menu")
    rows = cursor.fetchall()
    conn.close()
    return [{"id": r[0], "name": r[1], "price": r[2], "target": r[3]} for r in rows]

@app.post("/menu/")
def create_menu_item(item: MenuItem):
    conn = sqlite3.connect("cafe.db")
    cursor = conn.cursor()
    cursor.execute("INSERT INTO menu (name, price, target) VALUES (?, ?, ?)", (item.name, item.price, item.target))
    conn.commit()
    conn.close()
    return {"message": "Menu item added"}

@app.put("/menu/{item_id}")
def update_menu_item(item_id: int, item: MenuItem):
    conn = sqlite3.connect("cafe.db")
    cursor = conn.cursor()
    cursor.execute("UPDATE menu SET name=?, price=?, target=? WHERE id=?", (item.name, item.price, item.target, item_id))
    conn.commit()
    conn.close()
    return {"message": "Menu item updated"}

@app.delete("/menu/{item_id}")
def delete_menu_item(item_id: int):
    conn = sqlite3.connect("cafe.db")
    cursor = conn.cursor()
    cursor.execute("DELETE FROM menu WHERE id=?", (item_id,))
    conn.commit()
    conn.close()
    return {"message": "Menu item deleted"}

@app.delete("/orders/{order_id}")
def delete_order(order_id: int):
    conn = sqlite3.connect("cafe.db")
    cursor = conn.cursor()
    cursor.execute("DELETE FROM orders WHERE id = ?", (order_id,))
    conn.commit()
    conn.close()
    return {"message": "Deleted"}