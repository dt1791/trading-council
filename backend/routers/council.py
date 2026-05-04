import uuid
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.services.council_service import run_council
from backend.services.stock_service import get_stock_data
from backend.database import get_db, init_db

router = APIRouter(prefix="/council", tags=["council"])

class AnalyseRequest(BaseModel):
    userId: str
    ticker: str
    profile: dict

@router.post("/analyse")
def analyse(req: AnalyseRequest):
    try:
        # Get live stock data
        stock = get_stock_data(req.ticker.upper())

        # Run the council
        verdict = run_council(req.profile, stock)

        # Save verdict to database
        init_db()
        conn = get_db()
        verdict_id = str(uuid.uuid4())
        position_id = str(uuid.uuid4())

        conn.execute(
            "INSERT INTO positions (id, user_id, ticker, entry_price, quantity) VALUES (?, ?, ?, ?, ?)",
            (position_id, req.userId, req.ticker.upper(), stock["price"], 0)
        )

        conn.execute(
            "INSERT INTO council_verdicts (id, position_id, action, position_size, summary, confidence) VALUES (?, ?, ?, ?, ?, ?)",
            (verdict_id, position_id, verdict["action"], verdict["positionSize"], verdict["summary"], verdict["confidence"])
        )

        conn.commit()
        conn.close()

        verdict["verdictId"] = verdict_id
        verdict["positionId"] = position_id
        verdict["stock"] = stock

        return verdict

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))