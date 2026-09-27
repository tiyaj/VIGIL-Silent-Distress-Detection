from fastapi import APIRouter
from app.api.settings import router as settings_router
from app.api.alerts import router as alerts_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(settings_router)
api_router.include_router(alerts_router)
