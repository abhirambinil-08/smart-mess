# ============================================================
#  routes/mess_config.py  — CRUD for mess locations
# ============================================================

from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId

from core.database import get_db
from core.security import require_admin, get_current_user
from models.schemas import MessCreate

router = APIRouter()


@router.post("", dependencies=[Depends(require_admin)])
async def create_mess(data: MessCreate):
    db = get_db()
    if await db.mess.find_one({"name": data.name}):
        raise HTTPException(status_code=400, detail="A mess with this name already exists.")
    result = await db.mess.insert_one({
        "name": data.name, "institution": data.institution,
        "location": data.location, "created_at": datetime.utcnow(),
    })
    return {"id": str(result.inserted_id), "name": data.name, "message": "Mess created."}


@router.get("")
async def get_all_mess():
    """Public — used to populate dropdowns in feedback form."""
    db = get_db()
    mess_list = []
    async for m in db.mess.find().sort("created_at", -1):
        mess_list.append({
            "id": str(m["_id"]), "name": m["name"],
            "institution": m["institution"], "location": m.get("location", ""),
        })
    return {"mess": mess_list}


@router.delete("/{mess_id}", dependencies=[Depends(require_admin)])
async def delete_mess(mess_id: str):
    db = get_db()
    result = await db.mess.delete_one({"_id": ObjectId(mess_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Mess not found.")
    return {"message": "Mess deleted."}
