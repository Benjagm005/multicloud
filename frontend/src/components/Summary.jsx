import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function WeeklySummary({ refreshTrigger }) {
  const [weeklyCount, setWeeklyCount] = useState(null);
  const [sinceMonday, setSinceMonday] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchSummary = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/files/summary');
      setWeeklyCount(data.weekly_count ?? 0);
      setSinceMonday(data.since_monday || '');
    } catch (e) {
      console.error('Error obteniendo resumen semanal:', e);
      setError('No se pudo obtener el contador semanal');
      setWeeklyCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [refreshTrigger]);

  const formatSince = (iso) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch {
      return iso;
    }
  };

  if (loading) return <div className="weekly-counter">Cargando contador...</div>;
  if (error) return <div className="weekly-counter text-danger">{error}</div>;

  return (
    <div className="weekly-counter">
      <strong>{weeklyCount ?? 0}</strong> archivos subidos esta semana
      {sinceMonday && (
        <div className="small text-muted">Contando desde: {formatSince(sinceMonday)}</div>
      )}
    </div>
  );
}