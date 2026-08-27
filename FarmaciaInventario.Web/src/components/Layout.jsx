import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const ENLACES = [
  { to: '/dashboard', label: 'Inicio' },
  { to: '/escanear', label: '📷 Estación de escaneo' },
  { to: '/productos', label: 'Productos' },
  { to: '/lotes', label: 'Lotes' },
  { to: '/alertas', label: 'Alertas' },
  { to: '/salidas', label: 'Registrar salida' },
  { to: '/proveedores', label: 'Proveedores' },
];

function Layout({ children, titulo }) {
  const navigate = useNavigate();
  const nombreUsuario = localStorage.getItem('nombreUsuario');
  const [menuAbierto, setMenuAbierto] = useState(false);

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('nombreUsuario');
    navigate('/login');
  };

  return (
    <div className="app-shell">
      {/* ---- Fondo oscuro al abrir el menú en móvil ---- */}
      {menuAbierto && (
        <div className="overlay-movil" onClick={() => setMenuAbierto(false)} />
      )}

      {/* ---- Barra lateral (se convierte en panel deslizante en móvil) ---- */}
      <aside className={`sidebar ${menuAbierto ? 'sidebar-abierta' : ''}`}>
        <div className="marca">
          Farmacia<span style={{ color: '#8FD9C4' }}>.</span>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          {ENLACES.map((enlace) => (
            <NavLink
              key={enlace.to}
              to={enlace.to}
              onClick={() => setMenuAbierto(false)}
              className={({ isActive }) => `enlace-nav ${isActive ? 'enlace-nav-activo' : ''}`}
            >
              {enlace.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* ---- Contenido principal ---- */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <button
              className="boton-hamburguesa"
              onClick={() => setMenuAbierto(true)}
              aria-label="Abrir menú"
            >
              ☰
            </button>
            <h1 style={{ fontSize: '18px' }}>{titulo}</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <span className="nombre-usuario" style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              {nombreUsuario}
            </span>
            <button className="boton-secundario" onClick={cerrarSesion}>
              Salir
            </button>
          </div>
        </header>

        <main style={{ padding: 'var(--space-4)', flex: 1 }}>{children}</main>
      </div>
    </div>
  );
}

export default Layout;