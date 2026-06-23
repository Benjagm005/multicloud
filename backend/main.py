import os
import boto3
from botocore.exceptions import ClientError
from datetime import datetime, timezone, timedelta
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

S3_BUCKET = os.getenv("AWS_STORAGE_BUCKET_NAME")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
DYNAMODB_TABLE = os.getenv("DYNAMODB_TABLE", "archivacloud-p05")

s3_client = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    aws_session_token=os.getenv("AWS_SESSION_TOKEN"),
    region_name=AWS_REGION
)

class UploadRequest(BaseModel):
    filename: str
    file_type: str
    file_size: int

ALLOWED_TYPES = [
    "application/pdf",
    "image/jpeg"
]

MAX_SIZE_BYTES = 12 * 1024 * 1024

def get_dynamodb_table():
    """Obtiene la conexión a la tabla DynamoDB."""
    dynamodb = boto3.resource(
        'dynamodb',
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        aws_session_token=os.getenv("AWS_SESSION_TOKEN"),
        region_name=AWS_REGION
    )
    return dynamodb.Table(DYNAMODB_TABLE)


def get_weekly_counter(semana_inicio: str) -> int:
    """Obtiene el contador de archivos de DynamoDB para una semana específica."""
    try:
        table = get_dynamodb_table()
        response = table.get_item(
            Key={
                'id_tabla': f"semana_{semana_inicio}",
                'nombre_proyecto': "Contador Semanal S3"
            }
        )
        if 'Item' in response:
            return response['Item'].get('total_archivos', 0)
        return 0
    except Exception as e:
        print(f"Error obteniendo contador de DynamoDB: {str(e)}")
        return 0


def increment_weekly_counter(semana_inicio: str, cantidad: int = 1) -> int:
    """Incrementa el contador semanal en DynamoDB. Devuelve el nuevo valor."""
    try:
        table = get_dynamodb_table()
        response = table.update_item(
            Key={
                'id_tabla': f"semana_{semana_inicio}",
                'nombre_proyecto': "Contador Semanal S3"
            },
            UpdateExpression="SET descripcion = :desc, semana_inicio = :week, last_updated = :updated ADD total_archivos :inc",
            ExpressionAttributeValues={
                ':desc': f"Total de archivos subidos desde el lunes {semana_inicio}: {cantidad}",
                ':week': semana_inicio,
                ':updated': datetime.now(timezone.utc).isoformat(),
                ':inc': cantidad,
            },
            ReturnValues='UPDATED_NEW'
        )
        nuevo_contador = int(response['Attributes'].get('total_archivos', 0))
        if response['Attributes'].get('descripcion') != f"Total de archivos subidos desde el lunes {semana_inicio}: {nuevo_contador}":
            table.update_item(
                Key={
                    'id_tabla': f"semana_{semana_inicio}",
                    'nombre_proyecto': "Contador Semanal S3"
                },
                UpdateExpression="SET descripcion = :desc",
                ExpressionAttributeValues={
                    ':desc': f"Total de archivos subidos desde el lunes {semana_inicio}: {nuevo_contador}"
                }
            )
        print(f"Contador incrementado a {nuevo_contador} en DynamoDB.")
        return nuevo_contador
    except Exception as e:
        print(f"Error incrementando contador en DynamoDB: {str(e)}")
        return get_weekly_counter(semana_inicio)

@app.get("/api/health")
def health_check():
    return {"status": "Api funcionando correctamente."}


@app.post("/api/upload/presigned-url")
def get_presigned_url(request: UploadRequest):

    if request.file_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Solo se permiten archivos PDF y JPG."
        )

    if request.file_size > MAX_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail="El archivo supera el tamaño máximo permitido de 12 MB."
        )

    object_name = f"uploads/{request.filename}"
    expiration = 300

    try:
        s3_client.head_object(Bucket=S3_BUCKET, Key=object_name)
        raise HTTPException(
            status_code=409,
            detail="Ya existe un archivo con ese nombre en el bucket."
        )
    except ClientError as e:
        if e.response["Error"]["Code"] != "404":
            raise HTTPException(
                status_code=500,
                detail=f"Error con AWS: {str(e)}"
            )

    try:
        response = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': S3_BUCKET,
                'Key': object_name,
                'ContentType': request.file_type
            },
            ExpiresIn=expiration
        )

    except ClientError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error con AWS: {str(e)}"
        )

    return {
        "upload_url": response,
        "file_key": object_name
    }

@app.get("/api/files")
def list_files():
    """
    Lista todos los archivos dentro de la carpeta 'uploads/' del bucket de S3.
    """
    prefix = "uploads/"
    
    try:
        response = s3_client.list_objects_v2(
            Bucket=S3_BUCKET,
            Prefix=prefix
        )
    
        if "Contents" not in response:
            return {"files": []}

        files_list = []
        for item in response["Contents"]:
            if item["Key"] == prefix:
                continue
                
            files_list.append({
                "key": item["Key"],
                "filename": item["Key"].replace(prefix, ""),
                "size_bytes": item["Size"],
                "last_modified": item["LastModified"].isoformat()
            })

        return {"files": files_list}

    except ClientError as e:
        raise HTTPException(status_code=500, detail=f"Error con AWS: {str(e)}")

@app.get("/api/files/summary")
def files_summary():
    """
    Devuelve el contador semanal almacenado en DynamoDB.
    No recalcula desde S3 - usa el historial persistente.
    """
    try:
        # Calcular el lunes actual a las 00:00 UTC
        now = datetime.now(timezone.utc)
        inicio_lunes = now - timedelta(
            days=now.weekday(), 
            hours=now.hour, 
            minutes=now.minute, 
            seconds=now.second, 
            microseconds=now.microsecond
        )
        semana_inicio_str = inicio_lunes.strftime("%Y-%m-%d")
        
        # Obtener el contador de DynamoDB
        weekly_count = get_weekly_counter(semana_inicio_str)
        
        return {
            "weekly_count": weekly_count,
            "since_monday": inicio_lunes.isoformat()
        }
    except Exception as e:
        print(f"Error en files_summary: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.post("/api/files/confirm-upload")
def confirm_upload():
    """
    Incrementa el contador semanal en DynamoDB.
    Debe ser llamado por el frontend DESPUÉS de subir un archivo exitosamente a S3.
    """
    try:
        now = datetime.now(timezone.utc)
        inicio_lunes = now - timedelta(
            days=now.weekday(), 
            hours=now.hour, 
            minutes=now.minute, 
            seconds=now.second, 
            microseconds=now.microsecond
        )
        semana_inicio_str = inicio_lunes.strftime("%Y-%m-%d")
        
        nuevo_contador = increment_weekly_counter(semana_inicio_str, cantidad=1)
        
        return {
            "success": True,
            "weekly_count": nuevo_contador,
            "message": f"Contador incrementado a {nuevo_contador}"
        }
    except Exception as e:
        print(f"Error en confirm_upload: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
@app.delete("/api/files/{file_key}")
def delete_file(file_key: str):
    """
    Elimina un archivo específico del bucket de S3 usando su clave.
    """
    object_key = f"uploads/{file_key}"
    
    try:
        s3_client.delete_object(Bucket=S3_BUCKET, Key=object_key)
        return {"message": f"Archivo '{file_key}' eliminado exitosamente."}
    except ClientError as e:
        raise HTTPException(status_code=500, detail=f"Error con AWS: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)