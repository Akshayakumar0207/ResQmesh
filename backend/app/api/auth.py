import jwt
from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.auth.security import (
    create_access_token, create_refresh_token, create_reset_token, decode_token,
    hash_password, verify_password,
)
from app.config import get_settings
from app.database.session import get_db
from app.models.entities import User
from app.schemas.auth import (
    ForgotPasswordRequest, GoogleLoginRequest, LoginRequest, MessageResponse,
    RegisterRequest, ResetPasswordRequest, TokenResponse, UserOut,
)
from app.services.email import send_password_reset_email
from app.utils.ids import gen_id

router = APIRouter(prefix="/api/auth", tags=["auth"])
settings = get_settings()

REFRESH_COOKIE_NAME = "resqmesh_refresh_token"


def _set_refresh_cookie(response: Response, user_id: str, remember_me: bool) -> None:
    token = create_refresh_token(user_id, remember_me)
    max_age = (settings.refresh_token_remember_days if remember_me else settings.refresh_token_expire_days) * 86400
    response.set_cookie(
        key=REFRESH_COOKIE_NAME, value=token, max_age=max_age, httponly=True,
        samesite="lax", secure=settings.environment == "production", path="/api/auth",
    )


def _token_response(user: User) -> TokenResponse:
    access = create_access_token(user.id, user.role)
    return TokenResponse(
        access_token=access,
        expires_in_minutes=settings.access_token_expire_minutes,
        user=UserOut(id=user.id, email=user.email, display_name=user.display_name, role=user.role, has_password=bool(user.password_hash)),
    )


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(payload: RegisterRequest, response: Response, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists")

    user = User(
        id=gen_id("USR"), username=payload.email, email=payload.email,
        password_hash=hash_password(payload.password), display_name=payload.display_name, role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    _set_refresh_cookie(response, user.id, remember_me=False)
    return _token_response(user)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not user.password_hash or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password")

    _set_refresh_cookie(response, user.id, payload.remember_me)
    return _token_response(user)


@router.post("/login/google", response_model=TokenResponse)
def login_google(payload: GoogleLoginRequest, response: Response, db: Session = Depends(get_db)):
    if not settings.google_client_id:
        raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, "Google Sign-In isn't configured on this server (GOOGLE_CLIENT_ID unset)")

    try:
        info = google_id_token.verify_oauth2_token(payload.id_token, google_requests.Request(), settings.google_client_id)
    except ValueError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid Google token")

    google_sub = info["sub"]
    email = info.get("email")
    name = info.get("name") or (email.split("@")[0] if email else "ResQMesh User")

    user = db.query(User).filter(User.google_sub == google_sub).first()
    if not user and email:
        user = db.query(User).filter(User.email == email).first()
        if user:
            user.google_sub = google_sub  # link existing email/password account to Google

    if not user:
        user = User(id=gen_id("USR"), username=email or google_sub, email=email, google_sub=google_sub, display_name=name, role="REQUESTER")
        db.add(user)

    db.commit()
    db.refresh(user)

    _set_refresh_cookie(response, user.id, payload.remember_me)
    return _token_response(user)


@router.post("/refresh", response_model=TokenResponse)
def refresh(response: Response, resqmesh_refresh_token: str | None = Cookie(None), db: Session = Depends(get_db)):
    if not resqmesh_refresh_token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "No refresh token present")
    try:
        payload = decode_token(resqmesh_refresh_token, "refresh")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Refresh token expired — please sign in again")
    except jwt.PyJWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid refresh token")

    user = db.query(User).get(payload["sub"])
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User no longer exists")

    # Rotate the refresh token (same remember-me duration it was issued with
    # is unknown here, so we re-issue at the shorter default; the user
    # simply re-checks "remember me" on their next explicit login for the
    # longer duration — a reasonable, safe default for a hackathon-scope
    # implementation).
    _set_refresh_cookie(response, user.id, remember_me=False)
    return _token_response(user)


@router.post("/logout", response_model=MessageResponse)
def logout(response: Response):
    response.delete_cookie(REFRESH_COOKIE_NAME, path="/api/auth")
    return MessageResponse(message="Signed out")


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return UserOut(
        id=current_user.id, email=current_user.email, display_name=current_user.display_name,
        role=current_user.role, has_password=bool(current_user.password_hash),
    )


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()

    # Always return a generic success message regardless of whether the
    # email exists — prevents account enumeration.
    generic = MessageResponse(message="If an account with that email exists, a reset link has been sent.")

    if not user or not user.password_hash:
        return generic

    reset_token = create_reset_token(user.id)
    reset_link = f"{settings.frontend_url}/reset-password?token={reset_token}"

    sent = send_password_reset_email(user.email, reset_link)

    if not sent and settings.demo_mode:
        # No SMTP configured — hand the link back directly so the full flow
        # is demoable/testable without setting up an email provider.
        return MessageResponse(message="DEMO MODE: no SMTP configured, reset link returned directly below instead of emailed.", reset_link=reset_link)

    return generic


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    try:
        token_payload = decode_token(payload.token, "reset")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Reset link has expired — please request a new one")
    except jwt.PyJWTError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid reset link")

    user = db.query(User).get(token_payload["sub"])
    if not user:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Account no longer exists")

    user.password_hash = hash_password(payload.new_password)
    db.commit()
    return MessageResponse(message="Password updated — you can now sign in with your new password.")
