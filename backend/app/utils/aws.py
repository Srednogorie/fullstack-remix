import os

import boto3
from fastapi import UploadFile

s3 = boto3.client(
    "s3",
    region_name=os.getenv("STORAGE_REGION"),
    aws_access_key_id=os.getenv("STORAGE_ACCESS_KEY"),
    aws_secret_access_key=os.getenv("STORAGE_SECRET"),
)


def get_location(file_path: str):
    bucket = os.getenv("STORAGE_BUCKET")
    domain = "s3.eu-central-1.amazonaws.com"
    url = f"https://{bucket}.{domain}/{file_path}"
    return url


def upload_user_file(attachment: UploadFile, user_id: str):
    s3.upload_fileobj(
        attachment.file,
        os.getenv("STORAGE_BUCKET"),
        f"{user_id}/{attachment.filename}",
        ExtraArgs={'ACL': 'public-read'},
    )
    return get_location(f"{user_id}/{attachment.filename}")


def delete_user_file(file_path: str):
    s3.delete_object(Bucket=os.getenv("STORAGE_BUCKET"), Key=file_path)
    return True
