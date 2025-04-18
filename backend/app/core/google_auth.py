import os
import json
from fastapi import APIRouter, Request, Depends
from starlette.responses import RedirectResponse, JSONResponse
from google_auth_oauthlib.flow import Flow
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.model import User
from app.db.crud import get_user_by_email, create_user
from app.core.auth import create_access_token
from google.oauth2 import id_token
from google.auth.transport import requests
from urllib.parse import quote, unquote

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Enable OAuth on http (for local dev)
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
    raw_profile_data = request.query_params.get("profile_data")
    profile_type_param = request.query_params.get("profile_type", "uno")

    if raw_profile_data is None:
        combined_data = {"profile_type": profile_type_param}
    else:
        combined_data = json.loads(raw_profile_data)
        combined_data.setdefault("profile_type", profile_type_param)

    state_str = quote(json.dumps(combined_data))

    flow = Flow.from_client_config(
        {
            "web": {
                "client_id":     CLIENT_ID,
                "client_secret": CLIENT_SECRET,
                "redirect_uris": [REDIRECT_URI],
                "auth_uri":      "https://accounts.google.com/o/oauth2/auth",
                "token_uri":     "https://oauth2.googleapis.com/token",
            }
        },
        scopes=SCOPES,
    )
    flow.redirect_uri = REDIRECT_URI

    authorization_url, _ = flow.authorization_url(
        prompt="consent",
        include_granted_scopes="true",
        state=state_str
    )
    return RedirectResponse(url=authorization_url)

@router.get("/auth/google/callback")
def google_auth_callback(request: Request, db: Session = Depends(get_db)):
    code = request.query_params.get("code")
    if not code:
        return JSONResponse({"error": "No code provided"}, status_code=400)

    state_str = request.query_params.get("state", "")
    try:
        parsed_state = json.loads(unquote(state_str))
    except:
        parsed_state = {}

    # Directly use the fields from the parsed state
    profile_type      = parsed_state.get("profile_type", "uno")
    ethnicity         = parsed_state.get("ethnicity", [])
    gender            = parsed_state.get("gender")
    social_media_use  = parsed_state.get("social_media_use")
    personality       = parsed_state.get("personality", [])
    occupation        = parsed_state.get("occupation", [])
    interests         = parsed_state.get("interests", [])
    past_activities   = parsed_state.get("past_activities", [])
    location          = parsed_state.get("location")
    looking_for       = parsed_state.get("looking_for")
    bio               = parsed_state.get("bio")

    print("PARSED STATE", parsed_state)

    flow = Flow.from_client_config(
        {
            "web": {
                "client_id":     CLIENT_ID,
                "client_secret": CLIENT_SECRET,
                "redirect_uris": [REDIRECT_URI],
                "auth_uri":      "https://accounts.google.com/o/oauth2/auth",
                "token_uri":     "https://oauth2.googleapis.com/token",
            }
        },
        scopes=SCOPES,
    )
    flow.redirect_uri = REDIRECT_URI
    flow.fetch_token(code=code)

    credentials = flow.credentials
    idinfo = id_token.verify_oauth2_token(
        credentials._id_token,
        requests.Request(),
        CLIENT_ID
    )

    email = idinfo.get("email")
    name = idinfo.get("name", "Google User")

    if not email:
        return JSONResponse({"error": "No email in token"}, status_code=400)

    # Check if user exists
    user = get_user_by_email(db, email)
    if not user:
        # Create user with array fields
        user = create_user(
            db,
            name=name,
            email=email,
            password="",  # Empty since it's OAuth
            profile_type=profile_type,
            ethnicity=ethnicity,
            gender=gender,
            social_media_use=social_media_use,
            personality=personality,
            interests=interests,
            occupation=occupation,
            past_activities=past_activities,
            location=location,
            looking_for=looking_for,
            bio=bio
        )

    # Generate JWT
    token = create_access_token(data={"sub": user.email})

    # Redirect back into app with token
    return RedirectResponse(url=f"pair://login-callback?token={token}")