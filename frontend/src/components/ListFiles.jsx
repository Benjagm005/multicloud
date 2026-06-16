import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function ListFiles({ refreshTrigger }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingKey, setDeletingKey] = useState(null);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/files');
      setFiles(data.files || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (filename) => {
    const shouldDelete = window.confirm(`¿Eliminar archivo "${filename}"?`);
    if (!shouldDelete) return;

    setDeletingKey(filename);
    try {
      await api.delete(`/files/${encodeURIComponent(filename)}`);
      window.alert(`Archivo "${filename}" eliminado exitosamente.`);
      await fetchFiles();
    } catch (error) {
      console.error('Error al eliminar el archivo:', error);
      window.alert('No se pudo eliminar el archivo. Revisa la consola para más detalles.');
    } finally {
      setDeletingKey(null);
    }
  };
  
  const formatDate = (isoString) => isoString.split('T')[0];
  useEffect(() => {
    fetchFiles();
  }, [refreshTrigger]);

  return (
    <div className="card shadow-sm">
      <div className="card-body">
        <h5>Archivos en el bucket</h5>
        {loading ? (
          <p>Cargando archivos...</p>
        ) : files.length === 0 ? (
          <p>No hay archivos.</p>
        ) : (
          <ul className="list-group">
            {files.map((file) => (
              <li key={file.key} className="list-group-item d-flex justify-content-between align-items-center">
                <div>
                  {file.filename} — {Math.round(file.size_bytes / 1024)} KB — {formatDate(file.last_modified)}
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => handleDelete(file.filename)}
                  disabled={deletingKey === file.filename}
                >
                  {deletingKey === file.filename ? 'Eliminando...' : 'Eliminar'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}