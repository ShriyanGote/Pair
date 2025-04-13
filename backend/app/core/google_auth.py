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
    """
    Example usage from the front-end:
      /auth/google/login?
        profile_data={JSON_ENCODED_STRING}
    Or separate fields:
      /auth/google/login?
        profile_type=uno&ethnicity=asian&social_media_use=5&...
    """

    # 1) Either read a single 'profile_data' param that is a JSON string containing all fields
    raw_profile_data = request.query_params.get("profile_data", None)

    if raw_profile_data is None:
        # Fallback to reading just 'profile_type'
        profile_type = request.query_params.get("profile_type", "uno")
        combined_data = {"profile_type": profile_type}
    else:
        # It's a JSON string from the front-end
        combined_data = json.loads(raw_profile_data)

    # Convert dict back to JSON, then url-encode
    state_str = quote(json.dumps(combined_data))

    # 2) Build the OAuth2 Flow
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

    # 3) Redirect user to Google's OAuth
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

    # 1) Recover the JSON from the state param
    state_str = request.query_params.get("state", "")
    try:
        parsed_state = json.loads(unquote(state_str))
    except:
        parsed_state = {}  # fallback if JSON parse fails

    # Extract any fields we stored in state
    # Note the corrected spelling "past_activities"
    profile_type = parsed_state.get("profile_type", "uno")
    ethnicity = parsed_state.get("ethnicity")
    gender = parsed_state.get("gender")
    social_media_use = parsed_state.get("social_media_use")
    personality = parsed_state.get("personality")
    occupation = parsed_state.get("occupation")
    interests = parsed_state.get("interests")
    past_activities = parsed_state.get("past_activities")  # <--- spelled correctly
    print("PARSED STATE ", parsed_state)

    # 2) Exchange code for tokens
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
    idinfo = id_token.verify_oauth2_token(
        credentials._id_token,
        requests.Request(),
        CLIENT_ID
    )

    email = idinfo.get("email")
    name = idinfo.get("name", "Google User")

    if not email:
        return JSONResponse({"error": "No email in token"}, status_code=400)

    # 3) Check if user already exists
    user = get_user_by_email(db, email)
    if not user:
        # 4) If new user, create them with the extra fields
        user = create_user(
            db,
            name=name,
            email=email,
            password="",  # empty password for OAuth
            profile_type=profile_type,
            ethnicity=ethnicity,
            gender=gender,
            social_media_use=social_media_use,
            personality=personality,
            interests=interests,
            occupation=occupation,
            past_activities=past_activities
        )
    # else:
    #     # 5) If user exists, optionally update them with new fields
    #     #    (In case user logged in again and changed profile info)
    #     something_changed = False

    #     if user.profile_type != profile_type and profile_type:
    #         user.profile_type = profile_type
    #         something_changed = True
    #     if ethnicity and user.ethnicity != ethnicity:
    #         user.ethnicity = ethnicity
    #         something_changed = True
    #     if gender and user.gender != gender:
    #         user.gender = gender
    #         something_changed = True
    #     if social_media_use and user.social_media_use != social_media_use:
    #         user.social_media_use = social_media_use
    #         something_changed = True
    #     if personality and user.personality != personality:
    #         user.personality = personality
    #         something_changed = True
    #     if interests and user.interests != interests:
    #         user.interests = interests
    #         something_changed = True
    #     if occupation and user.occupation != occupation:
    #         user.occupation = occupation
    #         something_changed = True
    #     if past_activities and user.past_activities != past_activities:
    #         user.past_activities = past_activities
    #         something_changed = True

    #     if something_changed:
    #         db.commit()
    #         db.refresh(user)

    # 6) Generate JWT
    token = create_access_token(data={"sub": user.email})

    # 7) Redirect back into your app with the token (deep link)
    return RedirectResponse(url=f"pair://login-callback?token={token}")