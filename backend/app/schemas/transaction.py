import datetime
from decimal import Decimal
from enum import StrEnum
from pydantic import BaseModel


class PaymentMethod(StrEnum):
    cash = "cash"
    fonepay = "fonepay"
    esewa = "esewa"
    khalti = "khalti"
    bank_transfer = "bank_transfer"
    card = "card"
    other = "other"


class Category(StrEnum):
    groceries = "groceries"
    dining = "dining"
    utilities = "utilities"
    transport = "transport"
    shopping = "shopping"
    transfer = "transfer"
    misc = "misc"


class LineItem(BaseModel):
    name: str
    quantity: Decimal
    unit_price: Decimal
    total_price: Decimal


class TransactionItem(BaseModel):
    merchant_or_entity: str
    date: datetime.date
    amount: Decimal
    payment_method: PaymentMethod
    category: Category
    remarks: str | None = None
    line_items: list[LineItem] = []


class TransactionBatch(BaseModel):
    transactions: list[TransactionItem]
