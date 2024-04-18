from dataclasses import dataclass
import os
from typing import Annotated
from fastapi import Depends, File, Form, Query, Request, UploadFile
from fastapi_pagination import Page, pagination_ctx
from pydantic import ValidationError
from app import schemas
from app.models.expense_model import Expense
from app.utils.aws import get_location, s3, upload_user_file
from app.utils.service_result import handle_result
from app.utils.custom_api_route import APIRouter
from app.models.user_model import User
from app.config.users import CurrentActiveUser

router = APIRouter(prefix="/expenses", tags=["expenses"])


Page = Page.with_custom_options(size=Query(2))


@router.get(
    "/",
    response_model=Page[schemas.ExpenseRead],
    dependencies=[Depends(pagination_ctx(Page))]
)
async def read_items(request: Request, user: CurrentActiveUser):
    search_param = request.query_params.get("q")
    expenses = await Expense.get_all(user, search_param)
    return handle_result(expenses)


@router.get("/first", response_model=schemas.ExpenseRead)
async def first(user: CurrentActiveUser):
    expense = await Expense.first(user)
    return handle_result(expense)


@router.get("/{expense_id}", response_model=schemas.ExpenseRead)
async def read_item(expense_id: int, user: CurrentActiveUser):
    expense = await Expense.get(expense_id, user)
    return handle_result(expense)


@router.post("/", response_model=schemas.ExpenseRead)
async def create_item(
    request: Request,
    user: CurrentActiveUser,
    title: Annotated[str, Form()],
    description: Annotated[str, Form()],
    amount: Annotated[float, Form()],
    attachment: Annotated[UploadFile | None, File()] = None,
):
    expense = await Expense.create(
        user, title, description, amount, attachment
    )
    return handle_result(expense)


@router.put("/{expense_id}", response_model=schemas.ExpenseRead)
async def update_item(
    request: Request,
    user: CurrentActiveUser,
    expense_id: int,
    title: Annotated[str, Form()],
    description: Annotated[str, Form()],
    amount: Annotated[float, Form()],
    attachment: Annotated[UploadFile | None, File()] = None,
):
    updated = await Expense.update(
        expense_id, user, title, description, amount, attachment
    )
    return handle_result(updated)


@router.delete("/{expense_id}")
async def delete_item(expense_id: int, user: CurrentActiveUser):
    deleted = await Expense.delete(expense_id, user)
    return handle_result(deleted)


@router.post("/{expense_id}/delete-attachment")
async def delete_item_attachment(expense_id: int, user: CurrentActiveUser):
    deleted = await Expense.delete_attachment(expense_id, user)
    return handle_result(deleted)
