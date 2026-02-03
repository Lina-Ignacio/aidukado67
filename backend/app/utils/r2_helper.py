import os
import uuid
import boto3
import io
import asyncio
import time
from concurrent.futures import ThreadPoolExecutor
import functools
from dotenv import load_dotenv
from botocore.client import Config
from datetime import timedelta
from tenacity import retry, stop_after_attempt, wait_exponential

load_dotenv()

R2_ENDPOINT = os.getenv("R2_ENDPOINT")
R2_BUCKET = os.getenv("R2_BUCKET")
R2_ACCESS_KEY = os.getenv("R2_ACCESS_KEY")
R2_SECRET_KEY = os.getenv("R2_SECRET_KEY")

# Add Config with signature_version='s3v4'
s3_client = boto3.client(
    "s3",
    endpoint_url=R2_ENDPOINT,
    aws_access_key_id=R2_ACCESS_KEY,
    aws_secret_access_key=R2_SECRET_KEY,
    region_name='auto',  # R2 requires 'auto' as region
    config=Config(signature_version='s3v4')  # Force SigV4
)

# Create thread pool for async operations
executor = ThreadPoolExecutor(max_workers=10)

MIME_TYPES = {
    "pdf": "application/pdf",
    "doc": "application/msword",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "ppt": "application/vnd.ms-powerpoint",
    "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "png": "image/png"
}

def upload_file(file_bytes: bytes, filename: str, folder: str) -> str:
    """Original synchronous upload function"""
    file_extension = filename.split(".")[-1].lower()
    file_key = f"{folder}/{uuid.uuid4()}.{file_extension}"

    buffer = io.BytesIO(file_bytes)

    content_type = MIME_TYPES.get(file_extension, "application/octet-stream")

    s3_client.upload_fileobj(
        buffer,
        R2_BUCKET,
        file_key,
        ExtraArgs={"ContentType": content_type}
    )

    return file_key

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
def upload_file_with_retry(file_bytes: bytes, filename: str, folder: str) -> str:
    """Upload with retry logic"""
    start_time = time.time()
    file_extension = filename.split(".")[-1].lower()
    file_key = f"{folder}/{uuid.uuid4()}.{file_extension}"
    
    buffer = io.BytesIO(file_bytes)
    content_type = MIME_TYPES.get(file_extension, "application/octet-stream")
    
    try:
        s3_client.upload_fileobj(
            buffer,
            R2_BUCKET,
            file_key,
            ExtraArgs={
                "ContentType": content_type,
                "CacheControl": "max-age=3600"  # Add caching
            }
        )
        print(f"✅ Uploaded {filename} in {time.time() - start_time:.2f}s")
        return file_key
    except Exception as e:
        print(f"❌ Upload failed for {filename}: {e}")
        raise

async def upload_file_async(file_bytes: bytes, filename: str, folder: str) -> str:
    """Async wrapper for upload_file"""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        executor, 
        functools.partial(upload_file_with_retry, file_bytes, filename, folder)
    )

def generate_presigned_url(file_key: str, expires_in: int = 3600) -> str:
    """Original synchronous URL generation"""
    return s3_client.generate_presigned_url(
        "get_object",
        Params={"Bucket": R2_BUCKET, "Key": file_key},
        ExpiresIn=expires_in
    )

async def generate_presigned_url_async(file_key: str, expires_in: int = 3600) -> str:
    """Async wrapper for generate_presigned_url"""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        executor,
        functools.partial(generate_presigned_url, file_key, expires_in)
    )

def delete_file(file_key: str) -> None:
    """Delete file from R2"""
    try:
        s3_client.delete_object(Bucket=R2_BUCKET, Key=file_key)
        print(f"✅ Deleted file: {file_key}")
    except Exception as e:
        print(f"❌ Error deleting {file_key}: {e}")