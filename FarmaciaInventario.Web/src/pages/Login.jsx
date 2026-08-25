import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function Login() {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const manejarSubmit = async (evento) => {
    evento.preventDefault();
    setError('');
    setCargando(true);

    try {
      const respuesta = await api.post('/auth/login', { correo, contrasena });
      localStorage.setItem('token', respuesta.data.token);
      localStorage.setItem('nombreUsuario', respuesta.data.nombreCompleto);
      navigate('/productos');
    } catch (err) {
      setError('Correo o contraseña incorrectos');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-primary-dark)',
      }}
    >
      <div
        style={{
          width: '380px',
          background: 'var(--color-surface)',
          borderRadius: '12px',
          padding: 'var(--space-7) var(--space-6)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '15px',
              fontWeight: 700,
              color: 'var(--color-primary)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: 'var(--space-2)',
            }}
          >
            Control de inventario
          </div>
          <h1 style={{ fontSize: '24px' }}>Iniciar sesión</h1>
        </div>

        <form onSubmit={manejarSubmit}>
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: 'var(--space-1)' }}>
              Correo
            </label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
              autoFocus
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--color-border)',
              }}
            />
          </div>

          <div style={{ marginBottom: 'var(--space-5)' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: 'var(--space-1)' }}>
              Contraseña
            </label>
            <input
              type="password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--color-border)',
              }}
            />
          </div>

          {error && (
            <div
              style={{
                background: 'var(--color-critico-bg)',
                color: 'var(--color-critico)',
                padding: '10px 12px',
                borderRadius: 'var(--radius)',
                fontSize: '13px',
                marginBottom: 'var(--space-4)',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 'var(--radius)',
              border: 'none',
              background: 'var(--color-primary)',
              color: 'white',
              fontWeight: 600,
              fontSize: '14px',
              opacity: cargando ? 0.7 : 1,
            }}
          >
            {cargando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;