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
          <div className="table-responsive">
            <table className="file-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Peso</th>
                  <th>Fecha</th>
                  <th className="text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr key={file.key}>
                    <td>{file.filename}</td>
                    <td>{Math.round(file.size_bytes / 1024)} KB</td>
                    <td>{formatDate(file.last_modified)}</td>
                    <td className="text-right">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(file.filename)}
                        disabled={deletingKey === file.filename}
                      >
                        {deletingKey === file.filename ? 'Eliminando...' : 'Eliminar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}