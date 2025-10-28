from fastapi import APIRouter


router = APIRouter()


@router.get("/me")
async def get_me():
    # Stub implementation
    return {"user": None}
