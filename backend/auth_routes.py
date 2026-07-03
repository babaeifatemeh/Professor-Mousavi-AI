from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel, EmailStr

from database import get_session
from models import User, Conversation, Message
from auth_utils import hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["Auth"])

ALLOWED_EMAIL_DOMAINS = {
    "gmail.com",
    "yahoo.com",
    "outlook.com",
    "hotmail.com",
    "icloud.com",
}


class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    new_password: str


class MakeAdminRequest(BaseModel):
    email: EmailStr


class UpdateUserRequest(BaseModel):
    full_name: str
    email: EmailStr
    is_admin: bool
    is_active: bool


def normalize_email(email: str) -> str:
    return email.strip().lower()


def validate_email_domain(email: str):
    domain = email.split("@")[-1]

    if domain not in ALLOWED_EMAIL_DOMAINS:
        raise HTTPException(
            status_code=400,
            detail="فقط ایمیل‌های معتبر مانند Gmail, Yahoo, Outlook, Hotmail یا iCloud قابل قبول هستند.",
        )


def active_admin_count(session: Session) -> int:
    admins = session.exec(
        select(User).where(User.is_admin == True, User.is_active == True)
    ).all()
    return len(admins)


@router.post("/register")
def register_user(
    request: RegisterRequest,
    session: Session = Depends(get_session),
):
    email = normalize_email(request.email)
    validate_email_domain(email)

    if len(request.password) < 8:
        raise HTTPException(
            status_code=400,
            detail="رمز عبور باید حداقل ۸ کاراکتر باشد.",
        )

    existing_user = session.exec(
        select(User).where(User.email == email)
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="کاربری با این ایمیل قبلاً ثبت شده است.",
        )

    new_user = User(
        full_name=request.full_name.strip(),
        email=email,
        password=hash_password(request.password),
    )

    session.add(new_user)
    session.commit()
    session.refresh(new_user)

    return {
        "message": "ثبت‌نام با موفقیت انجام شد.",
        "user_id": new_user.id,
        "email": new_user.email,
    }


@router.post("/login")
def login_user(
    request: LoginRequest,
    session: Session = Depends(get_session),
):
    email = normalize_email(request.email)

    user = session.exec(
        select(User).where(User.email == email)
    ).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="ایمیل یا رمز عبور نادرست است.",
        )

    if not verify_password(request.password, user.password):
        raise HTTPException(
            status_code=401,
            detail="ایمیل یا رمز عبور نادرست است.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="حساب کاربری غیرفعال است.",
        )

    return {
        "message": "ورود با موفقیت انجام شد.",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "is_admin": user.is_admin,
        },
    }


@router.post("/reset-password-demo")
def reset_password_demo(
    request: ResetPasswordRequest,
    session: Session = Depends(get_session),
):
    email = normalize_email(request.email)

    user = session.exec(
        select(User).where(User.email == email)
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="کاربر پیدا نشد.",
        )

    if len(request.new_password) < 8:
        raise HTTPException(
            status_code=400,
            detail="رمز عبور جدید باید حداقل ۸ کاراکتر باشد.",
        )

    user.password = hash_password(request.new_password)
    session.add(user)
    session.commit()

    return {
        "message": "رمز عبور با موفقیت تغییر کرد.",
        "email": user.email,
    }


@router.post("/make-admin-demo")
def make_admin_demo(
    request: MakeAdminRequest,
    session: Session = Depends(get_session),
):
    email = normalize_email(request.email)

    user = session.exec(
        select(User).where(User.email == email)
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="کاربر پیدا نشد.",
        )

    user.is_admin = True
    session.add(user)
    session.commit()
    session.refresh(user)

    return {
        "message": "کاربر با موفقیت مدیر شد.",
        "email": user.email,
        "is_admin": user.is_admin,
    }


@router.put("/admin/users/{user_id}")
def update_admin_user(
    user_id: int,
    request: UpdateUserRequest,
    session: Session = Depends(get_session),
):
    user = session.get(User, user_id)

    if not user:
        raise HTTPException(status_code=404, detail="کاربر پیدا نشد.")

    email = normalize_email(request.email)
    validate_email_domain(email)

    existing_user = session.exec(
        select(User).where(User.email == email, User.id != user_id)
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="این ایمیل برای کاربر دیگری ثبت شده است.",
        )

    if user.is_admin and (not request.is_admin or not request.is_active):
        if active_admin_count(session) <= 1:
            raise HTTPException(
                status_code=400,
                detail="نمی‌توان آخرین مدیر فعال سایت را غیرفعال یا کاربر عادی کرد.",
            )

    user.full_name = request.full_name.strip()
    user.email = email
    user.is_admin = request.is_admin
    user.is_active = request.is_active

    session.add(user)
    session.commit()
    session.refresh(user)

    return {
        "message": "مشخصات کاربر با موفقیت ویرایش شد.",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "is_admin": user.is_admin,
            "is_active": user.is_active,
        },
    }


@router.delete("/admin/users/{user_id}")
def delete_admin_user(
    user_id: int,
    session: Session = Depends(get_session),
):
    user = session.get(User, user_id)

    if not user:
        raise HTTPException(status_code=404, detail="کاربر پیدا نشد.")

    if user.is_admin and active_admin_count(session) <= 1:
        raise HTTPException(
            status_code=400,
            detail="نمی‌توان آخرین مدیر فعال سایت را حذف کرد.",
        )

    conversations = session.exec(
        select(Conversation).where(Conversation.user_id == user_id)
    ).all()

    for conversation in conversations:
        messages = session.exec(
            select(Message).where(Message.conversation_id == conversation.id)
        ).all()

        for message in messages:
            session.delete(message)

        session.delete(conversation)

    session.delete(user)
    session.commit()

    return {"message": "کاربر و گفتگوهای مربوط به او با موفقیت حذف شد."}