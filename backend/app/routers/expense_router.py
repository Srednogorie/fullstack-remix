from typing import Annotated
from fastapi import Depends, Request
from app import schemas
from app.models.expense_model import Expense
from app.utils.service_result import handle_result
from app.utils.custom_api_route import APIRouter
from app.models.user_model import User
from app.config.users import CurrentActiveUser

router = APIRouter(prefix="/expenses", tags=["expenses"])


@router.get("/", response_model=list[schemas.ExpenseRead])
async def read_items(user: CurrentActiveUser):
    expenses = await Expense.get_all(user)
    return handle_result(expenses)


@router.get("/{expense_id}", response_model=schemas.ExpenseRead)
async def read_item(expense_id: int, user: CurrentActiveUser):
    expense = await Expense.get(expense_id, user)
    return handle_result(expense)


@router.post("/")
async def create_item(
    request: Request, expense: schemas.Expense, user: CurrentActiveUser
):
    expense.user_id = user.id
    created = await Expense.create(expense)
    return handle_result(created)


@router.put("/{expense_id}", response_model=schemas.ExpenseRead)
async def update_item(
    request: Request,
    expense_id: int,
    expense: schemas.Expense,
    user: CurrentActiveUser
):
    updated = await Expense.update(expense_id, expense, user)
    return handle_result(updated)


@router.delete("/{expense_id}")
async def delete_item(expense_id: int, user: CurrentActiveUser):
    deleted = await Expense.delete(expense_id, user)
    return handle_result(deleted)
