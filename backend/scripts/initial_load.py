import sys
import os
import argparse
import logging
from datetime import datetime

# Add the backend directory to python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from rich.console import Console
from rich.table import Table
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TaskProgressColumn
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.services.data_pipeline import ingest_bdc_filing, ingest_macro_data
from app.models.database import BDCCompany, FilingRegistry, BDCLoan, BDCSummary

console = Console()
logger = logging.getLogger(__name__)

def run_ingestion(args):
    db: Session = SessionLocal()
    start_time = datetime.now()
    
    try:
        # 1. Handle Full Reload if requested
        if args.full_reload:
            console.print("[bold red]WARNING:[/bold red] Full reload requested. This will not delete data but will re-parse all filings.")
            if args.bdc:
                db.query(FilingRegistry).filter_by(bdc_ticker=args.bdc).delete()
                db.query(BDCLoan).filter_by(bdc_ticker=args.bdc).delete()
                db.query(BDCSummary).filter_by(bdc_ticker=args.bdc).delete()
            else:
                db.query(FilingRegistry).delete()
                db.query(BDCLoan).delete()
                db.query(BDCSummary).delete()
            db.commit()
            console.print("[green]Cleanup complete. Starting re-ingestion...[/green]")

        # 2. Identify BDCs to process
        if args.bdc:
            bdcs = db.query(BDCCompany).filter_by(ticker=args.bdc).all()
            if not bdcs:
                console.print(f"[bold red]Error:[/bold red] BDC with ticker {args.bdc} not found in database.")
                return 1
        else:
            bdcs = db.query(BDCCompany).all()

        # 3. Process BDCs
        results = []
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            TaskProgressColumn(),
            console=console
        ) as progress:
            task = progress.add_task("Ingesting BDC Filings...", total=len(bdcs))
            
            for bdc in bdcs:
                progress.update(task, description=f"Processing {bdc.ticker}...")
                res = ingest_bdc_filing(bdc.ticker, bdc.cik, db)
                results.append(res)
                progress.advance(task)

        # 4. Process Macro Data (unless specific BDC was requested)
        if not args.bdc:
            console.print("Ingesting Macro Data...")
            macro_res = ingest_macro_data(db)
            console.print(f"[green]Macro ingestion complete:[/green] {macro_res['rows_upserted']} rows updated.")

        # 5. Show Summary Table
        table = Table(title="Ingestion Results")
        table.add_column("Ticker", style="cyan")
        table.add_column("Status", style="magenta")
        table.add_column("Loans Added", justify="right", style="green")
        table.add_column("Error", style="red")

        for res in results:
            table.add_row(
                res.get('ticker', 'N/A'),
                res.get('status', 'unknown'),
                str(res.get('loans_inserted', 0)),
                res.get('error', '')
            )
        
        console.print(table)
        
        duration = (datetime.now() - start_time).total_seconds()
        console.print(f"\n[bold green]Success![/bold green] Total duration: {duration:.2f}s")
        return 0

    except Exception as e:
        console.print(f"[bold red]Critical Error:[/bold red] {e}")
        return 1
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Djup Data Ingestion Script")
    parser.add_argument("--check-new-only", action="store_true", help="Only ingest new filings (default behavior)")
    parser.add_argument("--full-reload", action="store_true", help="Wipe registry and re-process all filings")
    parser.add_argument("--bdc", type=str, help="Specify a single BDC ticker to process")
    
    args = parser.parse_args()
    
    # Default to check-new-only if nothing else specified
    if not args.full_reload and not args.bdc:
        args.check_new_only = True
        
    sys.exit(run_ingestion(args))
