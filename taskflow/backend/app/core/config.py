import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "TaskFlow"
    VERSION: str = "1.0.0"
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://user:password@postgres/taskflow"
    )
    
    # API
    API_V1_PREFIX: str = "/api/v1"
    
    # WebSocket
    WS_MAX_CONNECTIONS: int = 100

settings = Settings()