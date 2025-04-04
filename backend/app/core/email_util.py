# email_util.py
import smtplib
from email.mime.text import MIMEText
import os
from dotenv import load_dotenv
load_dotenv()

EMAIL_SENDER = os.getenv("EMAIL_SENDER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")  # Use App Password for Gmail
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587



def send_verification_email(to_email, code):
    body = f"Please do not share below.\nYour verification code is: {code}"
    msg = MIMEText(body)
    msg["Subject"] = "Pairs App Verification Code"
    msg["From"] = EMAIL_SENDER
    msg["To"] = to_email

    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
        server.starttls()
        server.login(EMAIL_SENDER, EMAIL_PASSWORD)
        server.sendmail(EMAIL_SENDER, to_email, msg.as_string())
