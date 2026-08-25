from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.security import create_access_token, get_password_hash, verify_password
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import Token, UserCreate, UserResponse, UserUpdateSettings
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/register", response_model=UserResponse)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login_access_token(
    db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(subject=user.id)
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
def read_user_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/settings", response_model=UserResponse)
def update_user_settings(
    settings_in: UserUpdateSettings,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if settings_in.api_key is not None:
        current_user.set_encrypted_api_key(settings_in.api_key)
    if settings_in.push_token is not None:
        current_user.push_token = settings_in.push_token
    if settings_in.budget_amount is not None:
        current_user.budget_amount = settings_in.budget_amount
    if settings_in.budget_period is not None:
        current_user.budget_period = settings_in.budget_period
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user
