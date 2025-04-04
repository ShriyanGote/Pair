from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from dotenv import load_dotenv
import os

from app.api.routes.swipe_routes import router as swipe_router
from app.api.routes.user_routes import router as user_router
from app.api.routes.duo_routes import router as duo_router
from app.api.routes.group_routes import router as group_router
from app.api.routes.upload_routes import router as upload_router
# from app.api.routes.auth_routes import router as auth_router

load_dotenv()
app = FastAPI()

app.add_middleware(SessionMiddleware, secret_key=os.environ["SESSION_SECRET"], same_site="none", https_only=False)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# Include all routers
app.include_router(user_router)
app.include_router(swipe_router)
app.include_router(duo_router)
app.include_router(group_router)
app.include_router(upload_router)

@app.get("/")
def root():
    return {"message": "Shriyan's Dating App Backend"}