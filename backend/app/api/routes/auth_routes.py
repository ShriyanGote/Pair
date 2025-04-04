# from fastapi import APIRouter, Request, Depends
# from authlib.integrations.starlette_client import OAuth
# from starlette.config import Config
# from starlette.responses import RedirectResponse
# import os
# router = APIRouter()
# config = Config(".env")
# oauth = OAuth(config)
# oauth.register(
#     name='google',
#     client_id=os.getenv("GOOGLE_CLIENT_ID"),
#     client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
#     server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
#     client_kwargs={'scope': 'openid email profile'},
# )



# @router.get('/auth/google/login')
# async def login_via_google(request: Request):
#     redirect_uri = request.url_for('auth_google_callback')
#     return await oauth.google.authorize_redirect(request, redirect_uri)

# @router.get('/auth/google/callback')
# async def auth_google_callback(request: Request):
#     token = await oauth.google.authorize_access_token(request)
#     user_info = await oauth.google.parse_id_token(request, token)
#     # You can now create or fetch the user from your DB using user_info['email']
#     return user_info
