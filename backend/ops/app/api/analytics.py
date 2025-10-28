from fastapi import APIRouter


router = APIRouter()


@router.get("/")
async def analytics_overview():
    return {"metrics": {}}
