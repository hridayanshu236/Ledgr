import sqlite3
import os

db_path = "/home/ubuntu/ledgr/backend/data/ledgr.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.execute("PRAGMA table_info(users)")
    columns = [col[1] for col in cursor.fetchall()]
    
    if "push_token" not in columns:
        cursor.execute("ALTER TABLE users ADD COLUMN push_token VARCHAR")
        print("Added push_token")
    if "budget_amount" not in columns:
        cursor.execute("ALTER TABLE users ADD COLUMN budget_amount FLOAT")
        print("Added budget_amount")
    if "budget_period" not in columns:
        cursor.execute("ALTER TABLE users ADD COLUMN budget_period VARCHAR DEFAULT 'monthly'")
        print("Added budget_period")

    cursor.execute("DROP TABLE IF EXISTS budgets")
    
    conn.commit()
    print("Migration successful on server!")
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()
