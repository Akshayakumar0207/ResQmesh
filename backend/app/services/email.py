import smtplib
from email.mime.text import MIMEText

from app.config import get_settings

settings = get_settings()


def smtp_configured() -> bool:
    return bool(settings.smtp_host and settings.smtp_user and settings.smtp_password)


def send_password_reset_email(to_email: str, reset_link: str) -> bool:
    """Sends via SMTP if configured (e.g. a free Gmail app password — no
    paid email API required). Returns False (never raises) if unconfigured
    or sending fails, so the caller can fall back to the demo-mode response."""
    if not smtp_configured():
        return False

    body = (
        f"You requested a password reset for your ResQMesh account.\n\n"
        f"Reset your password here (link expires in {settings.reset_token_expire_minutes} minutes):\n"
        f"{reset_link}\n\n"
        f"If you didn't request this, you can safely ignore this email."
    )
    msg = MIMEText(body)
    msg["Subject"] = "Reset your ResQMesh password"
    msg["From"] = settings.smtp_from
    msg["To"] = to_email

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=8) as server:
            server.starttls()
            server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(settings.smtp_from, [to_email], msg.as_string())
        return True
    except Exception:
        return False
