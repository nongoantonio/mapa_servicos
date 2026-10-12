import MapView from './components/MapView'
import AuthPanel from './components/AuthPanel'

export default function App() {
  return (
    <div className="relative h-screen w-screen">
      <MapView />
      <AuthPanel />
    </div>
  )
}