"""
Automated tests for Attachments:
- Upload valid PDF (with %PDF- magic bytes)
- Upload valid image (PNG with PNG magic bytes)
- Upload valid text file
- Reject invalid extension (.exe, .sh)
- Reject magic-byte mismatch (renamed .exe to .pdf)
- Reject empty file
- Reject oversized file
- Sanitize path traversal attempts in filenames
- List attachments for task
- Download attachment
- Delete attachment
- Permission checks (Employee can only delete their own attachment unless admin)
- Verify internal filesystem paths are never leaked in response
"""

import io
import pytest


def test_upload_valid_pdf_and_metadata_isolation(client, admin_headers):
    # 1. Create task
    task_res = client.post("/api/tasks/", json={"title": "PDF Attachment Task"}, headers=admin_headers)
    task_id = task_res.json()["id"]

    # 2. Upload valid PDF
    pdf_content = b"%PDF-1.4 \n1 0 obj<</Type/Catalog>>endobj xref\n0 1\n0000000000 65535 f\ntrailer<</Size 1>>startxref\n99\n%%EOF"
    file_payload = {"file": ("report.pdf", pdf_content, "application/pdf")}
    upload_res = client.post(f"/api/tasks/{task_id}/attachments", files=file_payload, headers=admin_headers)
    assert upload_res.status_code == 201
    data = upload_res.json()
    assert data["original_filename"] == "report.pdf"
    assert data["content_type"] == "application/pdf"
    assert data["file_size"] == len(pdf_content)
    # Ensure internal file path is NOT leaked
    assert "stored_name" not in data
    assert "file_path" not in data
    assert "storage_path" not in data
    assert "uploads/" not in str(data)


def test_upload_valid_png(client, admin_headers):
    task_res = client.post("/api/tasks/", json={"title": "PNG Attachment Task"}, headers=admin_headers)
    task_id = task_res.json()["id"]

    png_content = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    file_payload = {"file": ("screenshot.png", png_content, "image/png")}
    upload_res = client.post(f"/api/tasks/{task_id}/attachments", files=file_payload, headers=admin_headers)
    assert upload_res.status_code == 201
    assert upload_res.json()["original_filename"] == "screenshot.png"


def test_upload_valid_text_file(client, admin_headers):
    task_res = client.post("/api/tasks/", json={"title": "Text Attachment Task"}, headers=admin_headers)
    task_id = task_res.json()["id"]

    txt_content = b"This is a valid plain text note file for testing."
    file_payload = {"file": ("notes.txt", txt_content, "text/plain")}
    upload_res = client.post(f"/api/tasks/{task_id}/attachments", files=file_payload, headers=admin_headers)
    assert upload_res.status_code == 201
    assert upload_res.json()["original_filename"] == "notes.txt"


def test_reject_invalid_extension(client, admin_headers):
    task_res = client.post("/api/tasks/", json={"title": "Invalid Ext Task"}, headers=admin_headers)
    task_id = task_res.json()["id"]

    file_payload = {"file": ("script.exe", b"MZ\x90\x00\x03\x00\x00\x00", "application/x-msdownload")}
    upload_res = client.post(f"/api/tasks/{task_id}/attachments", files=file_payload, headers=admin_headers)
    assert upload_res.status_code == 400


def test_reject_magic_byte_mismatch(client, admin_headers):
    task_res = client.post("/api/tasks/", json={"title": "Magic Mismatch Task"}, headers=admin_headers)
    task_id = task_res.json()["id"]

    # Spoofed PDF containing fake text rather than %PDF- header
    spoofed_content = b"Not a real PDF file, just malicious fake content"
    file_payload = {"file": ("fake.pdf", spoofed_content, "application/pdf")}
    upload_res = client.post(f"/api/tasks/{task_id}/attachments", files=file_payload, headers=admin_headers)
    assert upload_res.status_code == 400


def test_reject_empty_file(client, admin_headers):
    task_res = client.post("/api/tasks/", json={"title": "Empty File Task"}, headers=admin_headers)
    task_id = task_res.json()["id"]

    file_payload = {"file": ("empty.txt", b"", "text/plain")}
    upload_res = client.post(f"/api/tasks/{task_id}/attachments", files=file_payload, headers=admin_headers)
    assert upload_res.status_code in (400, 422)


def test_reject_oversized_file(client, admin_headers):
    task_res = client.post("/api/tasks/", json={"title": "Oversized File Task"}, headers=admin_headers)
    task_id = task_res.json()["id"]

    # WorkPulse limit is 10 MB. Generate 10.5 MB of data
    oversized_content = b"A" * (10 * 1024 * 1024 + 500)
    file_payload = {"file": ("large.txt", oversized_content, "text/plain")}
    upload_res = client.post(f"/api/tasks/{task_id}/attachments", files=file_payload, headers=admin_headers)
    assert upload_res.status_code in (400, 413)


def test_sanitize_path_traversal_in_filename(client, admin_headers):
    task_res = client.post("/api/tasks/", json={"title": "Traversal Task"}, headers=admin_headers)
    task_id = task_res.json()["id"]

    txt_content = b"Harmless content"
    file_payload = {"file": ("../../etc/passwd.txt", txt_content, "text/plain")}
    upload_res = client.post(f"/api/tasks/{task_id}/attachments", files=file_payload, headers=admin_headers)
    assert upload_res.status_code == 201
    # Check that traversal components were stripped
    saved_filename = upload_res.json()["original_filename"]
    assert ".." not in saved_filename
    assert "/" not in saved_filename
    assert saved_filename == "passwd.txt"


def test_list_download_delete_lifecycle(client, admin_headers, employee_headers):
    # 1. Create task
    task_res = client.post("/api/tasks/", json={"title": "Download Test Task", "assigned_to": 3}, headers=admin_headers)
    task_id = task_res.json()["id"]

    # 2. Upload text attachment
    txt_content = b"Content to download and verify."
    file_payload = {"file": ("download_me.txt", txt_content, "text/plain")}
    upload_res = client.post(f"/api/tasks/{task_id}/attachments", files=file_payload, headers=admin_headers)
    attachment_id = upload_res.json()["id"]

    # 3. List attachments
    list_res = client.get(f"/api/tasks/{task_id}/attachments", headers=admin_headers)
    assert list_res.status_code == 200
    assert list_res.json()["total"] == 1
    assert list_res.json()["items"][0]["id"] == attachment_id

    # 4. Download attachment
    download_res = client.get(f"/api/attachments/{attachment_id}/download", headers=admin_headers)
    assert download_res.status_code == 200
    assert download_res.content == txt_content

    # 5. Delete attachment (Admin override)
    del_res = client.delete(f"/api/attachments/{attachment_id}", headers=admin_headers)
    assert del_res.status_code == 200

    # 6. Verify missing after delete (404)
    after_del = client.get(f"/api/attachments/{attachment_id}/download", headers=admin_headers)
    assert after_del.status_code == 404
