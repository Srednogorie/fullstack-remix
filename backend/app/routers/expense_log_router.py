from typing import Annotated
from fastapi import Depends, Request
from app import schemas
from app.models.expense_log_model import ExpenseLog
from app.utils.service_result import handle_result
from app.utils.custom_api_route import APIRouter
from app.models.user_model import User
from app.config.users import CurrentActiveUser

router = APIRouter(prefix="/expense_logs", tags=["expense_logs"])


@router.get("/", response_model=list[schemas.ExpenseLogRead])
async def read_items(user: CurrentActiveUser, expense_id: int):
    expense_logs = await ExpenseLog.get_all(user, expense_id)
    return handle_result(expense_logs)


@router.post("/")
async def create_item(
    request: Request, expense_log: schemas.ExpenseLog, user: CurrentActiveUser
):
    expense_log.user_id = user.id
    created = await ExpenseLog.create(expense_log)
    return handle_result(created)
