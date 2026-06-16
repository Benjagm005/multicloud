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
    <>
      <UploadFiles onUploadSuccess={handleRefresh} />
      <ListFiles refreshTrigger={refreshTrigger} />
    </>
  )
}

export default App
