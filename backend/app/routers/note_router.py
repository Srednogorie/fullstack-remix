from fastapi import Request
from app import schemas
from app.models.note_model import Note
from app.utils.service_result import handle_result
from app.utils.custom_api_route import APIRouter

router = APIRouter(prefix="/notes", tags=["notes"])


@router.get("/", response_model=list[schemas.NoteRead])
async def read_items():
    notes = await Note.get_all()
    return handle_result(notes)


@router.get("/{note_id}", response_model=schemas.Note)
async def read_item(note_id: int):
    note = await Note.get(note_id)
    return handle_result(note)


@router.post("/")
async def create_item(request: Request, note: schemas.Note):
    created = await Note.create(note)
    return handle_result(created)


@router.put("/{note_id}", response_model=schemas.Note)
async def update_item(note_id: int, note: schemas.Note):
    pass


@router.delete("/{note_id}")
async def delete_item(note_id: int):
    pass
