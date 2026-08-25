import httpx
import logging
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionItem
from sqlalchemy import func
import datetime
from app.db.session import SessionLocal

logger = logging.getLogger(__name__)

def check_budget_thresholds(user_id: str, tx: TransactionItem):
    with SessionLocal() as db:
        user = db.query(User).filter(User.id == user_id).first()
        # Check if user has push tokens and a budget set
        if not user or not user.push_token or not user.budget_amount:
            return
        
        try:
            date_obj = tx.date
            month = date_obj.month
            year = date_obj.year
        except Exception:
            return

        # Calculate total spent based on the user's budget period
        if user.budget_period == "weekly":
            # Get start and end of the current week (Monday-Sunday)
            start_of_week = date_obj - datetime.timedelta(days=date_obj.weekday())
            end_of_week = start_of_week + datetime.timedelta(days=6)
            
            total_spent = db.query(func.sum(Transaction.amount)).filter(
                Transaction.user_id == user.id,
                Transaction.date >= start_of_week,
                Transaction.date <= end_of_week
            ).scalar() or 0.0
        else:
            # Default to monthly
            total_spent = db.query(func.sum(Transaction.amount)).filter(
                Transaction.user_id == user.id,
                func.strftime('%m', Transaction.date) == f"{month:02d}",
                func.strftime('%Y', Transaction.date) == str(year)
            ).scalar() or 0.0
        
        # Check if exceeding 80% threshold
        if total_spent >= user.budget_amount * 0.8:
            percentage = int((total_spent / user.budget_amount) * 100)
            period_str = "week" if user.budget_period == "weekly" else "month"
            send_push_notification(
                user.push_token,
                f"Global Budget Alert",
                f"You have spent {total_spent} Rs, which is {percentage}% of your {user.budget_amount} Rs budget for this {period_str}!"
            )

def send_push_notification(expo_push_token: str, title: str, body: str):
    message = {
        "to": expo_push_token,
        "sound": "default",
        "title": title,
        "body": body,
        "data": {"someData": "goes here"},
    }
    
    try:
        with httpx.Client() as client:
            response = client.post(
                "https://exp.host/--/api/v2/push/send",
                json=message
            )
            response.raise_for_status()
    except Exception as e:
        logger.error(f"Failed to send push notification: {e}")
