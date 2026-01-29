from sqlmodel import SQLModel


class AuthToken(SQLModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class TokenPayload(SQLModel):
    sub: str | None = None
    username: str | None = None
