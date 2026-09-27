import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./vigil.db")
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]
RISK_THRESHOLD_ELEVATED = int(os.getenv("RISK_THRESHOLD_ELEVATED", "40"))
RISK_THRESHOLD_CRITICAL = int(os.getenv("RISK_THRESHOLD_CRITICAL", "70"))
CALIBRATION_SECONDS = int(os.getenv("CALIBRATION_SECONDS", "15"))
DEMO_MODE = os.getenv("DEMO_MODE", "true").lower() in ("true", "1", "yes")
