import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from backend.config import settings
from backend.database import init_db
from backend.routers import dashboard, transactions, customers, cases, analytics, model_info, audit, ai_investigator, simulator, auth

app = FastAPI(title="Pay Sentinel AI", version="1.0.0", description="Real-Time Payment Risk Intelligence Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await init_db()

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"error": "Internal server error", "detail": str(exc)})

app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(transactions.router)
app.include_router(customers.router)
app.include_router(cases.router)
app.include_router(analytics.router)
app.include_router(model_info.router)
app.include_router(audit.router)
app.include_router(ai_investigator.router)
app.include_router(simulator.router)

@app.get("/api/health")
async def health():
    from backend.services.risk_engine import risk_engine
    return {
        "status": "healthy",
        "risk_engine": "online" if risk_engine.model else "offline",
        "ai_investigator": "online" if settings.ANTHROPIC_API_KEY else "demo_mode",
        "database": "online",
        "api": "online",
        "ml_model": "online" if risk_engine.model else "offline",
    }

@app.get("/")
async def root():
    return {"name": "Pay Sentinel AI", "version": "1.0.0", "status": "running"}

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host=settings.APP_HOST, port=settings.APP_PORT, reload=True)
