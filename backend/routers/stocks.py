from fastapi import APIRouter, HTTPException
from backend.services.stock_service import get_stock_data

router = APIRouter(prefix="/stocks", tags=["stocks"])

@router.get("/{ticker}")
def get_stock(ticker: str):
    try:
        return get_stock_data(ticker.upper())
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch stock data")