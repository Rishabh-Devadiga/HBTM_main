"""Curator authentication API."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Header, HTTPException, status
from fastapi.concurrency import run_in_threadpool

from backend.api.schemas.common import SuccessResponse
from backend.domains.curator.schemas.auth import (
    CuratorAuthResponse,
    CuratorAuthStatusResponse,
    CuratorAppleLoginRequest,
    CuratorLoginRequest,
    CuratorPasswordUpdateRequest,
    CuratorProfileUpdateRequest,
    CuratorRegisterRequest,
    CuratorRegisterResponse,
    CuratorSocialLoginRequest,
)
from backend.domains.curator.workflows.auth_service import (
    AuthenticatedUser,
    CuratorAuthService,
)


router = APIRouter(prefix="/curator/auth", tags=["curator-auth"])


def get_curator_auth_service() -> CuratorAuthService:
    return CuratorAuthService()


def _bearer_token(authorization: str | None) -> str | None:
    if not authorization:
        return None
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        return None
    return token.strip()


async def get_current_curator_user(
    authorization: str | None = Header(default=None),
    service: CuratorAuthService = Depends(get_curator_auth_service),
) -> AuthenticatedUser:
    auth_user = await run_in_threadpool(
        service.authenticate_token,
        _bearer_token(authorization),
    )
    if auth_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "message": "Login is required.",
                "error_code": "auth_required",
            },
        )
    return auth_user


@router.post(
    "/register",
    response_model=SuccessResponse[CuratorRegisterResponse],
    status_code=status.HTTP_201_CREATED,
)
async def register_curator_user(
    request: CuratorRegisterRequest,
    service: CuratorAuthService = Depends(get_curator_auth_service),
) -> SuccessResponse[CuratorRegisterResponse]:
    try:
        user = await run_in_threadpool(
            service.register,
            name=request.name,
            username=request.username,
            email=request.email,
            password=request.password,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": str(exc), "error_code": "registration_failed"},
        ) from exc
    return SuccessResponse(
        message="Registration complete. Please log in.",
        data=CuratorRegisterResponse(
            user=user,
            message="Registration complete. Please log in.",
        ),
    )


@router.post(
    "/login",
    response_model=SuccessResponse[CuratorAuthResponse],
    status_code=status.HTTP_200_OK,
)
async def login_curator_user(
    request: CuratorLoginRequest,
    service: CuratorAuthService = Depends(get_curator_auth_service),
) -> SuccessResponse[CuratorAuthResponse]:
    try:
        token, user, onboarding_completed = await run_in_threadpool(
            service.login,
            identifier=request.identifier,
            password=request.password,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"message": str(exc), "error_code": "invalid_credentials"},
        ) from exc
    return SuccessResponse(
        message="Login successful.",
        data=CuratorAuthResponse(
            token=token,
            user=user,
            onboardingCompleted=onboarding_completed,
        ),
    )


@router.post(
    "/google",
    response_model=SuccessResponse[CuratorAuthResponse],
    status_code=status.HTTP_200_OK,
)
async def login_curator_user_with_google(
    request: CuratorSocialLoginRequest,
    service: CuratorAuthService = Depends(get_curator_auth_service),
) -> SuccessResponse[CuratorAuthResponse]:
    try:
        token, user, onboarding_completed = await run_in_threadpool(
            service.login_with_google,
            id_token=request.idToken,
            code=request.code,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"message": str(exc), "error_code": "google_login_failed"},
        ) from exc
    return SuccessResponse(
        message="Google login successful.",
        data=CuratorAuthResponse(
            token=token,
            user=user,
            onboardingCompleted=onboarding_completed,
        ),
    )


@router.post(
    "/apple",
    response_model=SuccessResponse[CuratorAuthResponse],
    status_code=status.HTTP_200_OK,
)
async def login_curator_user_with_apple(
    request: CuratorAppleLoginRequest,
    service: CuratorAuthService = Depends(get_curator_auth_service),
) -> SuccessResponse[CuratorAuthResponse]:
    try:
        token, user, onboarding_completed = await run_in_threadpool(
            service.login_with_apple,
            id_token=request.idToken,
            name=request.name,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"message": str(exc), "error_code": "apple_login_failed"},
        ) from exc
    return SuccessResponse(
        message="Apple login successful.",
        data=CuratorAuthResponse(
            token=token,
            user=user,
            onboardingCompleted=onboarding_completed,
        ),
    )


@router.patch(
    "/profile",
    response_model=SuccessResponse[CuratorAuthStatusResponse],
    status_code=status.HTTP_200_OK,
)
async def update_curator_profile(
    request: CuratorProfileUpdateRequest,
    auth_user: AuthenticatedUser = Depends(get_current_curator_user),
    service: CuratorAuthService = Depends(get_curator_auth_service),
) -> SuccessResponse[CuratorAuthStatusResponse]:
    try:
        user = await run_in_threadpool(
            service.update_profile,
            user_id=auth_user.user.id,
            name=request.name,
            username=request.username,
            email=request.email,
            avatar_url=request.avatarUrl,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": str(exc), "error_code": "profile_update_failed"},
        ) from exc
    return SuccessResponse(
        message="Profile updated.",
        data=CuratorAuthStatusResponse(
            authenticated=True,
            user=user,
            onboardingCompleted=auth_user.onboarding_completed,
        ),
    )


@router.patch(
    "/password",
    response_model=SuccessResponse[CuratorAuthStatusResponse],
    status_code=status.HTTP_200_OK,
)
async def update_curator_password(
    request: CuratorPasswordUpdateRequest,
    auth_user: AuthenticatedUser = Depends(get_current_curator_user),
    service: CuratorAuthService = Depends(get_curator_auth_service),
) -> SuccessResponse[CuratorAuthStatusResponse]:
    try:
        await run_in_threadpool(
            service.update_password,
            user_id=auth_user.user.id,
            current_password=request.currentPassword,
            new_password=request.newPassword,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": str(exc), "error_code": "password_update_failed"},
        ) from exc
    return SuccessResponse(
        message="Password updated.",
        data=CuratorAuthStatusResponse(
            authenticated=True,
            user=service._to_auth_user(auth_user.user),
            onboardingCompleted=auth_user.onboarding_completed,
        ),
    )


@router.get(
    "/me",
    response_model=SuccessResponse[CuratorAuthStatusResponse],
    status_code=status.HTTP_200_OK,
)
async def get_curator_auth_status(
    authorization: str | None = Header(default=None),
    service: CuratorAuthService = Depends(get_curator_auth_service),
) -> SuccessResponse[CuratorAuthStatusResponse]:
    auth_user = await run_in_threadpool(
        service.authenticate_token,
        _bearer_token(authorization),
    )
    if auth_user is None:
        return SuccessResponse(
            message="No active Curator session.",
            data=CuratorAuthStatusResponse(authenticated=False),
        )
    return SuccessResponse(
        message="Curator session retrieved.",
        data=CuratorAuthStatusResponse(
            authenticated=True,
            user=service._to_auth_user(auth_user.user),
            onboardingCompleted=auth_user.onboarding_completed,
        ),
    )


@router.post("/logout", response_model=SuccessResponse[CuratorAuthStatusResponse])
async def logout_curator_user(
    authorization: str | None = Header(default=None),
    service: CuratorAuthService = Depends(get_curator_auth_service),
) -> SuccessResponse[CuratorAuthStatusResponse]:
    await run_in_threadpool(service.logout, _bearer_token(authorization))
    return SuccessResponse(
        message="Logged out.",
        data=CuratorAuthStatusResponse(authenticated=False),
    )
