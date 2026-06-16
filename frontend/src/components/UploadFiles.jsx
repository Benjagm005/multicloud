import { useState } from 'react';
import axios from 'axios';
import api from '../api/axios';

const MAX_SIZE = 12 * 1024 * 1024;

const TIPOS_PERMITIDOS = [
    "application/pdf",
    "image/jpeg"
];


export default function UploadFiles({ onUploadSuccess }) {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];

        if (!selectedFile) return;

        if (!TIPOS_PERMITIDOS.includes(selectedFile.type)) {
            setMessage({
                type: 'danger',
                text: 'Solo se permiten archivos PDF y JPG'
            });
            e.target.value = "";
            return;
        }

        if (selectedFile.size > MAX_SIZE) {
            setMessage({
                type: 'danger',
                text: 'El archivo supera el tamaño máximo permitido de 12 MB.'
            });
            e.target.value = "";
            return;
        }

        setFile(selectedFile);
        setMessage({ type: '', text: '' });
    };

    const isDuplicateFilename = async (filename) => {
        const { data } = await api.get('/files');
        return data.files?.some((fileItem) => fileItem.filename === filename);
    };

    const handleUpload = async (e) => {
        e.preventDefault();

        if (!file) {
            setMessage({
                type: 'warning',
                text: 'Selecciona un archivo antes de intentar subirlo.'
            });
            return;
        }

        setUploading(true);
        setMessage({ type: '', text: '' });

        try {
            const duplicate = await isDuplicateFilename(file.name);
            if (duplicate) {
                setMessage({
                    type: 'danger',
                    text: `Ya existe un archivo con el nombre "${file.name}". Cambia el nombre antes de subirlo.`
                });
                return;
            }

            const payload = {
                filename: file.name,
                file_type: file.type,
                file_size: file.size
            };

            const { data } = await api.post('/upload/presigned-url', payload);

            const { upload_url } = data;

            await axios.put(upload_url, file, {
                headers: {
                    'Content-Type': payload.file_type
                }
            });

            setMessage({
                type: 'success',
                text: `El archivo "${file.name}" se subió exitosamente a S3.`
            });

            setFile(null);
            e.target.reset();

            if (onUploadSuccess) {
                onUploadSuccess();
            }

        } catch (error) {
            console.error("Error detectado en el proceso de subida:", error);

            const errorMessage =
                error.response?.data?.detail ||
                error.message ||
                'Error de conexión. Revisa CORS de FastAPI, CORS del bucket S3 o credenciales AWS.';

            setMessage({
                type: 'danger',
                text: `No se pudo subir el archivo. Detalle: ${errorMessage}`
            });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="card shadow-sm mb-4">
            <div className="card-body">
                <h5 className="card-title fw-bold text-secondary mb-3">Subir nuevo archivo</h5>

                <form onSubmit={handleUpload} className="upload-form">
                    <div className="upload-box">
                        <div className="upload-icon">↑</div>
                        <div className="upload-copy">
                            <h2>Arrastra y suelta archivos aquí</h2>
                            <p>o</p>
                            <label className="btn btn-outline-primary file-select-button">
                                Buscar archivos
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    className="file-input"
                                    disabled={uploading}
                                />
                            </label>
                            {file && <p className="upload-selected">Seleccionado: {file.name}</p>}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={!file || uploading}
                        className="btn btn-primary upload-submit"
                    >
                        {uploading ? 'Subiendo...' : 'Subir a S3'}
                    </button>
                </form>

                {message.text && (
                    <div className={`alert alert-${message.type} mt-3 mb-0`} role="alert">
                        {message.text}
                    </div>
                )}
            </div>
        </div>
    );
}