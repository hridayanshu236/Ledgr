from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    api_key: str | None = None
    push_token: str | None = None
    budget_amount: float | None = None
    budget_period: str | None = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class UserUpdateSettings(BaseModel):
    api_key: str | None = None
    push_token: str | None = None
    budget_amount: float | None = None
    budget_period: str | None = None
