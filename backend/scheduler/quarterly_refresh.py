import logging
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.services.data_pipeline import ingest_all_bdcs, ingest_macro_data
from app.models.database import RefreshLog

logger = logging.getLogger(__name__)

def quarterly_refresh_job():
    """
    Main job to refresh BDC filings and macro data.
    """
    db: Session = SessionLocal()
    refresh_log = RefreshLog(status="running", started_at=datetime.utcnow())
    db.add(refresh_log)
    db.commit()

    try:
        logger.info("Starting scheduled quarterly refresh...")
        
        # 1. Refresh BDC Filings
        bdc_results = ingest_all_bdcs(db)
        updated_bdcs = [res['ticker'] for res in bdc_results if res.get('status') == 'success']
        failed_bdcs = [res['ticker'] for res in bdc_results if res.get('status') == 'failed']
        
        # 2. Refresh Macro Data
        macro_result = ingest_macro_data(db)
        
        # 3. Update log
        refresh_log.status = "success"
        refresh_log.completed_at = datetime.utcnow()
        refresh_log.bdcs_updated = ",".join(updated_bdcs)
        refresh_log.bdcs_failed = ",".join(failed_bdcs)
        db.commit()
        
        logger.info(f"Scheduled refresh completed successfully. Updated: {len(updated_bdcs)}, Failed: {len(failed_bdcs)}")
        
    except Exception as e:
        logger.error(f"Error during scheduled refresh: {e}")
        refresh_log.status = "failed"
        refresh_log.completed_at = datetime.utcnow()
        refresh_log.error_message = str(e)
        db.commit()
    finally:
        db.close()

def start_scheduler():
    """
    Initialize and start the background scheduler.
    """
    scheduler = BackgroundScheduler()
    
    # Run every Monday at 6AM UTC
    trigger = CronTrigger(day_of_week='mon', hour=6, minute=0, timezone='UTC')
    
    scheduler.add_job(
        quarterly_refresh_job,
        trigger=trigger,
        id='quarterly_refresh_task',
        replace_existing=True
    )
    
    scheduler.start()
    logger.info("Quarterly refresh scheduler started (Monday 6AM UTC).")
    return scheduler
