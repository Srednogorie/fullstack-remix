from typing import Annotated

from app import schemas
from app.config.users import CurrentActiveUser
from app.models.invoice_model import Invoice
from app.models.user_model import User
from app.utils.custom_api_route import APIRouter
from app.utils.service_result import handle_result
from fastapi import Depends, Query, Request
from fastapi_pagination import Page, pagination_ctx

router = APIRouter(prefix="/invoices", tags=["invoices"])


Page = Page.with_custom_options(size=Query(2))

@router.get(
    "/",
    response_model=Page[schemas.ExpenseRead],
    dependencies=[Depends(pagination_ctx(Page))]
)
async def read_items(user: CurrentActiveUser):
    invoices = await Invoice.get_all(user)
    return handle_result(invoices)


@router.get("/first", response_model=schemas.InvoiceRead)
async def first(user: CurrentActiveUser):
    invoice = await Invoice.first(user)
    return handle_result(invoice)


@router.get("/{invoice_id}", response_model=schemas.InvoiceRead)
async def read_item(invoice_id: int, user: CurrentActiveUser):
    invoice = await Invoice.get(invoice_id, user)
    return handle_result(invoice)


@router.post("/")
async def create_item(
    request: Request, invoice: schemas.Invoice, user: CurrentActiveUser
):
    invoice.user_id = user.id
    created = await Invoice.create(invoice)
    return handle_result(created)


@router.put("/{invoice_id}", response_model=schemas.InvoiceRead)
async def update_item(
    request: Request,
    invoice_id: int,
    invoice: schemas.InvoiceUpdate,
    user: CurrentActiveUser
):
    updated = await Invoice.update(invoice_id, invoice, user)
    return handle_result(updated)


@router.delete("/{invoice_id}")
async def delete_item(invoice_id: int, user: CurrentActiveUser):
    deleted = await Invoice.delete(invoice_id, user)
    return handle_result(deleted)
