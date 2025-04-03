# google_auth.py
import os
from fastapi import APIRouter, Request, Depends
from starlette.responses import RedirectResponse, JSONResponse
from google_auth_oauthlib.flow import Flow
from sqlalchemy.orm import Session
from database import SessionLocal
from model import User
from crud import get_user_by_email, create_user
from auth import create_access_token
from google.oauth2 import id_token
from google.auth.transport import requests
from urllib.parse import urlencode
router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Enable OAuth on http
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")

SCOPES = [
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email",
    "openid",
]

@router.get("/auth/google/login")
def login_with_google(request: Request):
    profile_type = request.query_params.get("profile_type", "uno")  # default to uno

    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET,
                "redirect_uris": [REDIRECT_URI],
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=SCOPES,
    )
    flow.redirect_uri = REDIRECT_URI

    # 👇 pass profile_type in state
    authorization_url, state = flow.authorization_url(
        prompt="consent",
        include_granted_scopes="true",
        state=profile_type
    )
    return RedirectResponse(url=authorization_url)

@router.get("/auth/google/callback")
def google_auth_callback(request: Request, db: Session = Depends(get_db)):
    code = request.query_params.get("code")
    profile_type = request.query_params.get("state", "uno")  # recover it from state param

    if not code:
        return JSONResponse({"error": "No code provided"}, status_code=400)

    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET,
                "redirect_uris": [REDIRECT_URI],
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=SCOPES,
    )
    flow.redirect_uri = REDIRECT_URI
    flow.fetch_token(code=code)

    credentials = flow.credentials
    idinfo = id_token.verify_oauth2_token(credentials._id_token, requests.Request(), CLIENT_ID)

    email = idinfo.get("email")
    name = idinfo.get("name", "Google User")

    if not email:
        return JSONResponse({"error": "No email in token"}, status_code=400)

    user = get_user_by_email(db, email)
    if not user:
        user = create_user(db, name=name, email=email, password="", profile_type=profile_type)

    token = create_access_token(data={"sub": user.email})

    # for dev/testing, redirect back to your app or mobile deep link
    return RedirectResponse(url=f"http://localhost:8000/?token={token}")
