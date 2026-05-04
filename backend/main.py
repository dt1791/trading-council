from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from backend.routers.auth import router as auth_router
from backend.routers.stocks import router as stocks_router
from backend.routers.council import router as council_router

load_dotenv()

app = FastAPI(title="Trading Council API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(stocks_router)
app.include_router(council_router)

@app.get("/health")
def health():
    return {"status": "ok"}