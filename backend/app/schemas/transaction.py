import datetime
from decimal import Decimal
from enum import StrEnum
from pydantic import BaseModel, ConfigDict, Field


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
    model_config = ConfigDict(from_attributes=True)

    id: str | None = None
    name: str
    quantity: Decimal
    unit_price: Decimal
    total_price: Decimal


class TransactionItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str | None = None
    merchant_or_entity: str
    date: datetime.date
    amount: Decimal
    payment_method: str = Field(description="Payment method used (e.g., cash, fonepay, esewa, khalti, bank_transfer, card, or custom like dental, health)")
    category: str = Field(description="Category of the transaction (e.g., groceries, dining, utilities, transport, shopping, transfer, misc, or custom like health, dental)")
    remarks: str | None = None
    file_path: str | None = None
    line_items: list[LineItem] = []


class TransactionBatch(BaseModel):
    transactions: list[TransactionItem]
