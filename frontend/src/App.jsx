import { useEffect, useState } from 'react'
import './App.css'
import UploadFiles from './components/UploadFiles';
import ListFiles from './components/ListFiles';
import api from './api/axios';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [weeklyCount, setWeeklyCount] = useState(0)

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  const fetchWeeklyCount = async () => {
    try {
      const { data } = await api.get('/files/summary');
      setWeeklyCount(data.weekly_count || 0)
    } catch (error) {
      console.error('No se pudo obtener el contador semanal:', error)
      setWeeklyCount(0)
    }
  }

  useEffect(() => {
    fetchWeeklyCount()
  }, [refreshTrigger])

  return (
    <main className="app-shell">
      <div className="page-container">
        <header className="hero">
          <div>
            <span className="eyebrow">Gestión de archivos</span>
            <h1>Multicloud Upload</h1>
            <p>Sube, lista y elimina archivos PDF o JPG directamente en tu bucket de S3.</p>
            <div className="weekly-counter">
              <strong>{weeklyCount}</strong> archivos subidos esta semana
            </div>
          </div>
        </header>

        <section className="stacked-sections">
          <UploadFiles onUploadSuccess={handleRefresh} />
          <ListFiles refreshTrigger={refreshTrigger} />
        </section>
      </div>
    </main>
  )
}

export default App
