from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    display_name: str = Field(..., min_length=1, max_length=100)
    role: str = Field("REQUESTER", pattern="^(REQUESTER|PROVIDER|ADMIN)$")


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    remember_me: bool = False


class GoogleLoginRequest(BaseModel):
    id_token: str
    remember_me: bool = False


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, max_length=128)


class UserOut(BaseModel):
    id: str
    email: Optional[str] = None
    display_name: str
    role: str
    has_password: bool = True

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_minutes: int
    user: UserOut


class MessageResponse(BaseModel):
    message: str
    reset_link: Optional[str] = Field(None, description="Only populated in demo_mode when SMTP isn't configured, for testability without an email provider.")
