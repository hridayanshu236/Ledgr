import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "data", "ledgr.db")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    print("Checking users table...")
    cursor.execute("PRAGMA table_info(users)")
    columns = [col[1] for col in cursor.fetchall()]
    
    if "budget_amount" not in columns:
        print("Adding budget_amount column...")
        cursor.execute("ALTER TABLE users ADD COLUMN budget_amount FLOAT")
    
    if "budget_period" not in columns:
        print("Adding budget_period column...")
        cursor.execute("ALTER TABLE users ADD COLUMN budget_period VARCHAR DEFAULT 'monthly'")

    print("Dropping old budgets table...")
    cursor.execute("DROP TABLE IF EXISTS budgets")
    
    conn.commit()
    print("Migration successful!")

except Exception as e:
    print(f"Error during migration: {e}")
    conn.rollback()
finally:
    conn.close()
