# CreditLens (Djup)

Institutional-grade private credit intelligence platform.

## Overview
CreditLens is a full-stack dashboard for monitoring Business Development Companies (BDCs), tracking yield compression, and analyzing loan-level stress in the private credit market.

### Core Features
- **Yield Monitor**: Real-time tracking of spreads and yields.
* **Stress Radar**: Non-accrual monitoring and portfolio health distribution.
- **NLP Sentiment**: FinBERT-powered analysis of earnings call transcripts.
- **Macro Overlay**: Correlation analysis between private credit and public benchmarks (HY, SOFR).
- **Auto-Refresh**: Weekly scheduled data ingestion from SEC EDGAR and FRED.

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, Recharts, D3.js.
- **Backend**: FastAPI, SQLAlchemy, Alembic, APScheduler.
- **NLP**: HuggingFace Transformers (FinBERT), PyTorch.
- **Database**: PostgreSQL (Production), SQLite (Development).

## Local Development Setup

### Backend
1. `cd backend`
2. `python -m venv .venv`
3. `source .venv/bin/activate`
4. `pip install -r requirements.txt`
5. `export DATABASE_URL=sqlite:///djup.db`
6. `alembic upgrade head`
7. `uvicorn main:app --reload`

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`

## Deployment

### Render (Backend + Database)
The project is configured for Render via `render.yaml`. It will automatically:
- Provision a PostgreSQL database.
- Build the React frontend.
- Serve the unified application from the FastAPI backend.

**Required Environment Variables (Secrets)**:
- `FRED_API_KEY`: Your Federal Reserve API key.
- `FMP_API_KEY`: Financial Modeling Prep API key.
- `SEC_USER_AGENT`: format "Company (email)".

### Vercel (Frontend Alternative)
You can also deploy the `frontend/` folder separately to Vercel. Ensure `VITE_API_URL` points to your Render backend.

## GitHub Actions
- **Deploy Workflow**: Runs tests and triggers Render deployment on push to `main`.
- **Refresh Workflow**: Triggers the weekly data refresh script (Mondays 6AM UTC).
