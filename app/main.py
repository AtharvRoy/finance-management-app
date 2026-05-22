from fastapi import FastAPI

from app.investments.api import router as investments_router

app = FastAPI(title="Finance Management App")
app.include_router(investments_router)
