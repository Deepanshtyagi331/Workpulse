from fastapi import APIRouter, Depends, File, Query, UploadFile, status, BackgroundTasks
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.attachment import AttachmentPaginationResponse, AttachmentResponse
from app.services.attachment_service import AttachmentService
from app.services.background_service import background_job_service

task_attachments_router = APIRouter()
router = APIRouter()


def get_attachment_service(db: Session = Depends(get_db)) -> AttachmentService:
    return AttachmentService(db)


@task_attachments_router.get(
    "/{task_id}/attachments",
    response_model=AttachmentPaginationResponse,
    summary="List Task Attachments",
)
def list_task_attachments(
    task_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    service: AttachmentService = Depends(get_attachment_service),
):
    return service.list_for_task(task_id=task_id, page=page, limit=limit)


@task_attachments_router.post(
    "/{task_id}/attachments",
    response_model=AttachmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload Task Attachment",
)
async def upload_task_attachment(
    task_id: int,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    service: AttachmentService = Depends(get_attachment_service),
):
    result = await service.upload(task_id=task_id, upload=file, actor=current_user)
    background_tasks.add_task(
        background_job_service.process_attachment_audit_job,
        action="ATTACHMENT_UPLOADED",
        attachment_id=result.id,
        task_id=task_id,
        filename=result.original_filename,
        file_size=result.file_size,
    )
    return result


@router.get(
    "/{attachment_id}/download",
    summary="Download Attachment",
)
def download_attachment(
    attachment_id: int,
    current_user: User = Depends(get_current_user),
    service: AttachmentService = Depends(get_attachment_service),
):
    return service.download(attachment_id=attachment_id, actor=current_user)


@router.delete(
    "/{attachment_id}",
    response_model=AttachmentResponse,
    summary="Delete Attachment",
)
def delete_attachment(
    attachment_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    service: AttachmentService = Depends(get_attachment_service),
):
    result = service.delete(attachment_id=attachment_id, actor=current_user)
    background_tasks.add_task(
        background_job_service.process_attachment_audit_job,
        action="ATTACHMENT_DELETED",
        attachment_id=attachment_id,
        task_id=attachment_id,
        filename=result.original_filename,
        file_size=result.file_size,
    )
    return result
