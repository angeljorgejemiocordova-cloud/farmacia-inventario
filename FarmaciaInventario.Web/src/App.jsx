import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Productos from './pages/Productos';
import NuevoProducto from './pages/NuevoProducto';
import Lotes from './pages/Lotes';
import NuevoLote from './pages/NuevoLote';
import Alertas from './pages/Alertas';
import RegistrarSalida from './pages/RegistrarSalida';
import Proveedores from './pages/Proveedores';

function RutaProtegida({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<RutaProtegida><Dashboard /></RutaProtegida>} />
        <Route path="/productos" element={<RutaProtegida><Productos /></RutaProtegida>} />
        <Route path="/productos/nuevo" element={<RutaProtegida><NuevoProducto /></RutaProtegida>} />
        <Route path="/lotes" element={<RutaProtegida><Lotes /></RutaProtegida>} />
        <Route path="/lotes/nuevo" element={<RutaProtegida><NuevoLote /></RutaProtegida>} />
        <Route path="/alertas" element={<RutaProtegida><Alertas /></RutaProtegida>} />
        <Route path="/salidas" element={<RutaProtegida><RegistrarSalida /></RutaProtegida>} />
        <Route path="/proveedores" element={<RutaProtegida><Proveedores /></RutaProtegida>} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;