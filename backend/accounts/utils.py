import requests
from django.conf import settings
from rest_framework import status
from rest_framework.exceptions import APIException


class ImgBBUploadError(APIException):
    status_code = status.HTTP_502_BAD_GATEWAY
    default_detail = 'Image upload failed.'
    default_code = 'imgbb_upload_error'


def upload_to_imgbb(image_file) -> str:
    if not settings.USE_IMGBB:
        raise ImgBBUploadError('ImgBB is not configured.')

    response = requests.post(
        settings.IMGBB_UPLOAD_URL,
        data={'key': settings.IMGBB_API_KEY},
        files={'image': image_file},
        timeout=30,
    )

    if not response.ok:
        raise ImgBBUploadError(
            response.json().get('error', {}).get('message', 'ImgBB upload failed.')
        )

    data = response.json()
    return data['data']['url']
