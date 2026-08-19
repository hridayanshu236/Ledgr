import asyncio
from pathlib import Path

from app.services.extractor import extract


async def run_test():
    image_path = Path("./data/uploads/receipt.jpeg")

    if not image_path.exists():
        raise FileNotFoundError(f"Image not found at path: {image_path.resolve()}")

    # Read binary bytes from disk
    with open(image_path, "rb") as file_handle:
        image_bytes = file_handle.read()

    # Pass the bytes and explicit MIME type to the extractor
    batch = await extract(file_bytes=image_bytes, mime_type="image/jpeg")

    # Inspect the structured Pydantic output
    print(f"Total transactions extracted: {len(batch.transactions)}")
    for index, tx in enumerate(batch.transactions, start=1):
        print(f"Transaction {index}:")
        print(f"  Merchant: {tx.merchant_or_entity}")
        print(f"  Date: {tx.date}")
        print(f"  Amount: NPR {tx.amount}")
        print(f"  Category: {tx.category}")
        print(f"  Payment Method: {tx.payment_method}")
        print(f"  Line items count: {len(tx.line_items)}")
        if tx.line_items:
            for item in tx.line_items:
                print(f"    - {item.name}: {item.quantity} x NPR {item.unit_price} = NPR {item.total_price}")



if __name__ == "__main__":
    asyncio.run(run_test())