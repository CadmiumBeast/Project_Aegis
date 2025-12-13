import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HQLogin from './pages/HQLogin';
import HQDashboard from './pages/HQDashboard';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/hq/login" replace />} />
        <Route path="/hq/login" element={<HQLogin />} />
        <Route path="/hq/dashboard" element={<HQDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
