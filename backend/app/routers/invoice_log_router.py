from typing import Annotated
from fastapi import Depends, Request
from app import schemas
from app.models.invoice_log_model import InvoiceLog
from app.utils.service_result import handle_result
from app.utils.custom_api_route import APIRouter
from app.models.user_model import User
from app.config.users import CurrentActiveUser

router = APIRouter(prefix="/invoice_logs", tags=["invoice_logs"])


@router.get("/", response_model=list[schemas.InvoiceLogRead])
async def read_items(user: CurrentActiveUser, invoice_id: int):
    invoice_logs = await InvoiceLog.get_all(user, invoice_id)
    return handle_result(invoice_logs)


@router.post("/")
async def create_item(
    request: Request, invoice_log: schemas.InvoiceLog, user: CurrentActiveUser
):
    invoice_log.user_id = user.id
    invoice_log = await InvoiceLog.create(invoice_log)
    return handle_result(invoice_log)
