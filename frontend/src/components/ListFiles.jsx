import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function ListFiles({ refreshTrigger }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

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
              <li key={file.key} className="list-group-item">
                {file.filename} — {Math.round(file.size_bytes / 1024)} KB
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}