import sqlite3
import os

# Connect to the SQLite database
db_path = os.path.join(os.path.dirname(__file__), "data", "ledgr.db")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    # 1. Add push_token to users table if it doesn't exist
    print("Checking users table...")
    cursor.execute("PRAGMA table_info(users)")
    columns = [col[1] for col in cursor.fetchall()]
    
    if "push_token" not in columns:
        print("Adding push_token column to users table...")
        cursor.execute("ALTER TABLE users ADD COLUMN push_token VARCHAR")
    else:
        print("push_token column already exists.")

    # 2. Create budgets table
    print("Creating budgets table...")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS budgets (
        id VARCHAR NOT NULL,
        user_id VARCHAR NOT NULL,
        category VARCHAR NOT NULL,
        amount FLOAT NOT NULL,
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE,
        CONSTRAINT uq_budget_user_cat_month_year UNIQUE (user_id, category, month, year)
    )
    """)
    
    # 3. Create indices for budgets
    print("Creating indices for budgets...")
    cursor.execute("CREATE INDEX IF NOT EXISTS ix_budgets_id ON budgets (id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS ix_budgets_user_id ON budgets (user_id)")

    conn.commit()
    print("Migration successful!")

except Exception as e:
    print(f"Error during migration: {e}")
    conn.rollback()
finally:
    conn.close()
