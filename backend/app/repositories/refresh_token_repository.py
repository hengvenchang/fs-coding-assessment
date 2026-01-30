import uuid
from datetime import datetime, timedelta

from sqlmodel import Session, select

from app.models.refresh_token import RefreshToken
from app.core.config import get_settings


class RefreshTokenRepository:
    """Repository for managing refresh tokens."""
    
    def __init__(self, session: Session):
        self.session = session
        self.settings = get_settings()

    async def create_refresh_token(
        self, 
        user_id: uuid.UUID, 
        token_hash: str
    ) -> RefreshToken:
        """Create a new refresh token for a user."""
        expires_at = datetime.utcnow() + timedelta(days=self.settings.REFRESH_TOKEN_EXPIRE_DAYS)
        
        refresh_token = RefreshToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at
        )
        
        self.session.add(refresh_token)
        await self.session.commit()
        await self.session.refresh(refresh_token)
        return refresh_token

    async def get_by_token_hash(self, token_hash: str) -> RefreshToken | None:
        """Get a refresh token by its hash."""
        statement = select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        result = await self.session.exec(statement)
        return result.first()

    async def get_active_token(self, token_hash: str) -> RefreshToken | None:
        """Get an active (non-revoked, non-expired) refresh token."""
        now = datetime.utcnow()
        statement = select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.revoked_at.is_(None),
            RefreshToken.expires_at > now
        )
        result = await self.session.exec(statement)
        return result.first()

    async def revoke_token(self, token_hash: str) -> RefreshToken | None:
        """Revoke a refresh token."""
        refresh_token = await self.get_by_token_hash(token_hash)
        if not refresh_token:
            return None
        
        refresh_token.revoked_at = datetime.utcnow()
        self.session.add(refresh_token)
        await self.session.commit()
        await self.session.refresh(refresh_token)
        return refresh_token

    async def revoke_all_user_tokens(self, user_id: uuid.UUID) -> int:
        """Revoke all refresh tokens for a user. Returns count of revoked tokens."""
        statement = select(RefreshToken).where(
            RefreshToken.user_id == user_id,
            RefreshToken.revoked_at.is_(None)
        )
        result = await self.session.exec(statement)
        tokens = result.all()
        
        now = datetime.utcnow()
        count = 0
        for token in tokens:
            token.revoked_at = now
            self.session.add(token)
            count += 1
        
        await self.session.commit()
        return count

    async def cleanup_expired_tokens(self, days_old: int = 30) -> int:
        """Delete expired tokens older than specified days. Returns count of deleted tokens."""
        cutoff_date = datetime.utcnow() - timedelta(days=days_old)
        statement = select(RefreshToken).where(
            RefreshToken.expires_at < cutoff_date
        )
        result = await self.session.exec(statement)
        tokens = result.all()
        
        count = 0
        for token in tokens:
            await self.session.delete(token)
            count += 1
        
        await self.session.commit()
        return count
