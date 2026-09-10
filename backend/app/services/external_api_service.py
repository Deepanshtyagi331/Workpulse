from typing import List
import httpx
from fastapi import HTTPException, status

from app.core.config import settings
from app.schemas.integration import (
    ExternalTaskItem,
    ExternalTasksResponse,
    ExternalPost,
    ExternalIntegrationResponse,
)
from app.utilities.logger import logger


class ExternalApiService:
    """
    Service responsible for interacting with external upstream APIs (JSONPlaceholder).
    Demonstrates clean separation of third-party HTTP logic, timeout protection,
    error resilience, and response schema normalization.
    """

    def __init__(self):
        self.base_url = settings.EXTERNAL_API_BASE_URL.rstrip("/")
        self.timeout = float(settings.EXTERNAL_API_TIMEOUT_SECONDS)

    async def fetch_external_tasks(self, limit: int = 10) -> ExternalTasksResponse:
        """
        Fetches a limited collection of external todos from JSONPlaceholder,
        normalizing them into WorkPulse ExternalTaskItem schemas.
        """
        url = f"{self.base_url}/todos"
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, params={"_limit": limit})

                if response.status_code != status.HTTP_200_OK:
                    logger.error(f"External API /todos returned status {response.status_code}")
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail=f"External service returned error status {response.status_code}.",
                    )

                raw_data = response.json()
                if not isinstance(raw_data, list):
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail="Unexpected response format received from external service.",
                    )

                items = [
                    ExternalTaskItem(
                        external_id=item["id"],
                        title=item.get("title", ""),
                        completed=bool(item.get("completed", False)),
                        source="JSONPlaceholder",
                    )
                    for item in raw_data[:limit]
                ]

                return ExternalTasksResponse(
                    source="JSONPlaceholder",
                    count=len(items),
                    items=items,
                )

        except httpx.TimeoutException as exc:
            logger.error(f"Timeout while fetching external tasks: {str(exc)}")
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail=f"External API request timed out after {self.timeout}s.",
            )
        except (httpx.ConnectError, httpx.ConnectTimeout, httpx.NetworkError) as exc:
            logger.error(f"Connection failure to external service: {str(exc)}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Failed to connect to external service JSONPlaceholder.",
            )
        except HTTPException:
            raise
        except Exception as exc:
            logger.error(f"Unexpected error interacting with external API: {str(exc)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="An error occurred while communicating with the external service.",
            )

    async def fetch_external_task_by_id(self, external_id: int) -> ExternalTaskItem:
        """
        Fetches a single external todo by external_id, returning a normalized ExternalTaskItem.
        """
        url = f"{self.base_url}/todos/{external_id}"
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url)

                if response.status_code == status.HTTP_404_NOT_FOUND:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"External task with ID {external_id} not found.",
                    )
                elif response.status_code != status.HTTP_200_OK:
                    logger.error(f"External API /todos/{external_id} returned status {response.status_code}")
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail=f"External service returned error status {response.status_code}.",
                    )

                raw_data = response.json()
                # If JSONPlaceholder returns empty object {}
                if not raw_data or "id" not in raw_data:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"External task with ID {external_id} not found.",
                    )

                return ExternalTaskItem(
                    external_id=raw_data["id"],
                    title=raw_data.get("title", ""),
                    completed=bool(raw_data.get("completed", False)),
                    source="JSONPlaceholder",
                )

        except httpx.TimeoutException as exc:
            logger.error(f"Timeout while fetching external task {external_id}: {str(exc)}")
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail=f"External API request timed out after {self.timeout}s.",
            )
        except (httpx.ConnectError, httpx.ConnectTimeout, httpx.NetworkError) as exc:
            logger.error(f"Connection failure to external service for task {external_id}: {str(exc)}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Failed to connect to external service JSONPlaceholder.",
            )
        except HTTPException:
            raise
        except Exception as exc:
            logger.error(f"Unexpected error fetching external task {external_id}: {str(exc)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="An error occurred while communicating with the external service.",
            )

    async def fetch_sample_posts(self, limit: int = 5) -> ExternalIntegrationResponse:
        """Legacy sample posts endpoint preserved for backward compatibility."""
        url = f"{self.base_url}/posts"
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url)
                response.raise_for_status()
                raw_data = response.json()

                items = [ExternalPost(**item) for item in raw_data[:limit]]
                return ExternalIntegrationResponse(
                    provider="JSONPlaceholder (External Mock API)",
                    endpoint=url,
                    status="Connected",
                    total_records=len(raw_data),
                    sample_records=items,
                )
        except httpx.HTTPError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"External API integration failure: {str(exc)}",
            )

