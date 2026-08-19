# Ledgr

> Turn crumpled receipts, payment screenshots, and PDF bank statements into a queryable, self-hosted relational & semantic personal finance ledger.

Ledgr is a personal finance assistant that understands your spending without requiring you to enter data manually. Photograph a receipt, screenshot an eSewa or Khalti payment, or upload a bank statement PDF — the system extracts structured transaction data using a multimodal LLM and lets you query it in plain English.

---

## What it does

- **Ingests** physical receipts, digital wallet screenshots (eSewa, Khalti, Fonepay), and bank statement PDFs
- **Extracts** structured data (merchant, date, amount, category, line items) using Google Gemini Flash
- **Persists** transactions to a local SQLite database for exact queries and a ChromaDB vector store for semantic search
- **Answers** natural language questions by routing them to either a Text-to-SQL engine or a RAG pipeline depending on intent

---

## Architecture

```
Mobile App (React Native + Expo)
        |
        |  multipart/form-data upload
        v
FastAPI Backend  ──── Google Gemini Flash (multimodal extraction)
        |
        |  validated TransactionBatch (Pydantic v2)
        |
        +──── SQLite (via SQLAlchemy)    ← exact queries, amounts, dates
        |
        +──── ChromaDB (local vector DB) ← semantic / fuzzy search
        |
        v
LangChain Agent Router
        |
        +──── SQL Tool     → "total spent on groceries in July"
        |
        +──── Vector Tool  → "where did I buy that filter coffee?"
```

All infrastructure runs at zero cost:

| Component | Service |
|---|---|
| Backend | Oracle Cloud Always Free VM (Ubuntu) |
| Networking | Tailscale zero-trust mesh |
| AI API | Google AI Studio (Gemini Flash, free tier) |
| Mobile builds | EAS Cloud Builds (free tier) |

---

## Tech Stack

**Backend**
- Python 3.11+, FastAPI, Uvicorn
- Pydantic v2, pydantic-settings
- SQLAlchemy 2.0 (SQLite)
- ChromaDB (local persistent vector store)
- LangChain 0.3, langchain-google-genai

**Mobile Client**
- React Native, Expo (Managed Workflow, TypeScript)
- expo-camera, expo-image-picker, expo-document-picker
- expo-image-manipulator (client-side compression before upload)

**Infrastructure**
- Oracle Cloud Always Free VM
- Tailscale (private mesh networking)
- EAS Cloud Builds (Android & iOS, no local Mac required)

---

## Features

### Implemented
- [x] Multimodal receipt extraction (images and PDFs via Gemini Flash)
- [x] Structured output validated against Pydantic schema (merchant, date, amount, category, payment method, line items)
- [x] Dual persistence: SQLite for relational data, ChromaDB for semantic search
- [x] Natural language query endpoint with dual-tool LangChain agent
- [x] Text-to-SQL routing for quantitative questions (totals, averages, date filters)
- [x] Vector search routing for fuzzy/semantic questions
- [x] File storage of original uploaded receipts

### In Progress
- [ ] React Native mobile client (capture + review + confirm flow)
- [ ] Conversational query screen in the mobile app

### Planned
- [ ] Deployment to Oracle Cloud VM via systemd
- [ ] Tailscale-based private access from mobile device
- [ ] Production EAS build for Android and iOS
- [ ] API key authentication middleware

---

## Data Contract

Every source (receipt, screenshot, PDF) produces a `TransactionBatch`:

```json
{
  "transactions": [
    {
      "merchant_or_entity": "Bhatbhateni Supermarket",
      "date": "2024-07-10",
      "amount": "1450.00",
      "payment_method": "fonepay",
      "category": "groceries",
      "remarks": "Naxal branch",
      "line_items": [
        {
          "name": "Milk 1L",
          "quantity": "2",
          "unit_price": "120.00",
          "total_price": "240.00"
        }
      ]
    }
  ]
}
```

Supported payment methods: `cash`, `fonepay`, `esewa`, `khalti`, `bank_transfer`, `card`, `other`

Supported categories: `groceries`, `dining`, `utilities`, `transport`, `shopping`, `transfer`, `misc`

---

## Local Development Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- A Google AI Studio API key (free at [aistudio.google.com](https://aistudio.google.com))

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS / Linux

pip install -r requirements.txt

cp .env.example .env
# Edit .env and set GOOGLE_API_KEY

python -m uvicorn app.main:app --reload
```

API is available at `http://127.0.0.1:8000`
Interactive docs at `http://127.0.0.1:8000/docs`

### Mobile Client

```bash
cd client
npx expo install
npx expo start
```

Scan the QR code with Expo Go on your physical device.

---

## Query Examples

Once transactions are ingested, the `/api/v1/query/` endpoint accepts plain English:

| Question | Routes to |
|---|---|
| "Total spent on dining this month?" | SQL Tool |
| "How much did I spend via eSewa?" | SQL Tool |
| "What did I buy at Bhatbhateni?" | Vector Tool |
| "Where did I have soup momo?" | Vector Tool |
| "Average monthly grocery spending?" | SQL Tool |

---

## Project Status

Active development. Backend core (extraction, storage, query agent) is functional. Mobile client is the current work in progress.
