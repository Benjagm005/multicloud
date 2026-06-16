import { useState } from 'react'
import './App.css'
import UploadFiles from './components/UploadFiles';
import ListFiles from './components/ListFiles';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <main className="app-shell">
      <div className="page-container">
        <header className="hero">
          <div>
            <span className="eyebrow">Gestión de archivos</span>
            <h1>Multicloud Upload</h1>
            <p>Sube, lista y elimina archivos PDF o JPG directamente en tu bucket de S3.</p>
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
