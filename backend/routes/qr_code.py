# ============================================================
#  routes/qr_code.py  — QR code generation for mess locations
# ============================================================

import io
import qrcode
import qrcode.image.svg
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse

from core.database import get_db
from core.security import require_mess_staff_or_admin

router = APIRouter()

FRONTEND_URL = "http://localhost:5173"


@router.get("/{mess_id}")
async def generate_qr(mess_id: str):
    """
    Generate a QR code PNG for the given mess_id.
    The QR encodes the feedback form URL: /?mess=<mess_id>
    This route is PUBLIC — anyone can scan without logging in.
    """
    db      = get_db()
    # Verify mess exists
    from bson import ObjectId
    try:
        mess = await db.mess.find_one({"_id": ObjectId(mess_id)})
    except Exception:
        mess = None

    if not mess:
        raise HTTPException(status_code=404, detail="Mess not found.")

    feedback_url = f"{FRONTEND_URL}/feedback?mess={mess_id}&name={mess['name']}"

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(feedback_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#1A56A0", back_color="white")

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    return StreamingResponse(
        buf,
        media_type="image/png",
        headers={"Content-Disposition": f'attachment; filename="{mess["name"]}_qr.png"'},
    )
