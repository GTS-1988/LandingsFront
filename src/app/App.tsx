import { Routes, Route, Navigate } from 'react-router-dom'
import Shell from './Shell'
import Dashboard from '../pages/Dashboard'
import Clients from '../pages/Clients'
import Landings from '../pages/Landings'
import LandingDetail from '../pages/LandingDetail'
import Submissions from '../pages/Submissions'

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/landings" element={<Landings />} />
        <Route path="/landings/:landingId" element={<LandingDetail />} />
        <Route path="/submissions" element={<Submissions />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  )
}
