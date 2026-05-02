from sqlalchemy import Column, Integer, String, Float, Boolean, Date, DateTime, Text, UniqueConstraint
from sqlalchemy.sql import func
from app.database import Base

class BDCCompany(Base):
    """Config table to store the list of BDCs"""
    __tablename__ = "bdc_companies"

    ticker = Column(String(10), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    cik = Column(String(10), nullable=False)
    created_at = Column(DateTime, default=func.now())

class BDCLoan(Base):
    __tablename__ = "bdc_loans"

    id = Column(Integer, primary_key=True, autoincrement=True)
    bdc_ticker = Column(String(10), nullable=False, index=True)
    filing_date = Column(Date, nullable=False)
    quarter = Column(String(6), index=True)
    borrower_name = Column(String(200))
    industry = Column(String(100))
    loan_type = Column(String(50))
    interest_rate = Column(Float)
    sofr_spread = Column(Float)
    sofr_floor = Column(Float)
    par_value = Column(Float)
    fair_value = Column(Float)
    fair_to_par_ratio = Column(Float)
    maturity_date = Column(Date)
    is_non_accrual = Column(Boolean, default=False)
    accession_number = Column(String(50))
    created_at = Column(DateTime, default=func.now())

class BDCSummary(Base):
    __tablename__ = "bdc_summary"

    id = Column(Integer, primary_key=True, autoincrement=True)
    bdc_ticker = Column(String(10), nullable=False)
    bdc_name = Column(String(100))
    filing_date = Column(Date)
    quarter = Column(String(6))
    nav_per_share = Column(Float)
    stock_price = Column(Float)
    nav_premium_discount_pct = Column(Float)
    total_portfolio_fair_value = Column(Float)
    non_accrual_rate_pct = Column(Float)
    weighted_avg_yield = Column(Float)
    new_originations = Column(Float)
    repayments = Column(Float)
    net_new_deployment = Column(Float)
    debt_to_equity = Column(Float)
    first_lien_pct = Column(Float)
    total_loan_count = Column(Integer)
    created_at = Column(DateTime, default=func.now())

class MacroIndicator(Base):
    __tablename__ = "macro_indicators"

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(Date, nullable=False, index=True)
    series_id = Column(String(50), nullable=False)
    series_name = Column(String(100))
    value = Column(Float)
    created_at = Column(DateTime, default=func.now())

    __table_args__ = (
        UniqueConstraint('date', 'series_id', name='uq_macro_date_series'),
    )

class NLPSentiment(Base):
    __tablename__ = "nlp_sentiment"

    id = Column(Integer, primary_key=True, autoincrement=True)
    bdc_ticker = Column(String(10))
    quarter = Column(String(6))
    call_date = Column(Date)
    net_sentiment_score = Column(Float)
    positive_chunks = Column(Integer)
    negative_chunks = Column(Integer)
    neutral_chunks = Column(Integer)
    keyword_spread_compression = Column(Integer)
    keyword_covenant_lite = Column(Integer)
    keyword_dry_powder = Column(Integer)
    keyword_deal_flow = Column(Integer)
    keyword_non_accrual = Column(Integer)
    keyword_origination = Column(Integer)
    keyword_competition = Column(Integer)
    raw_transcript_length = Column(Integer)
    created_at = Column(DateTime, default=func.now())

class FilingRegistry(Base):
    __tablename__ = "filing_registry"

    id = Column(Integer, primary_key=True, autoincrement=True)
    bdc_ticker = Column(String(10))
    accession_number = Column(String(50), unique=True)
    filing_date = Column(Date)
    quarter = Column(String(6))
    form_type = Column(String(10))
    processing_status = Column(String(20))
    error_message = Column(Text, nullable=True)
    processed_at = Column(DateTime)
    created_at = Column(DateTime, default=func.now())
