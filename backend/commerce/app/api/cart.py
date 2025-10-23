from fastapi import APIRouter


router = APIRouter()


@router.get("/")
async def get_cart():
    return {"items": [], "total": 0}
