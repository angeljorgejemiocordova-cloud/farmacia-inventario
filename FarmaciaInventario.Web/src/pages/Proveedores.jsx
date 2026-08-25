import { useState, useEffect } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';

function Proveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mostrarForm, setMostrarForm] = useState(false);

  const [form, setForm] = useState({ nombre: '', contacto: '', telefono: '', correo: '', direccion: '' });
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    cargarProveedores();
  }, []);

  const cargarProveedores = async () => {
    setCargando(true);
    try {
      const respuesta = await api.get('/proveedores');
      setProveedores(respuesta.data);
    } catch (err) {
      setError('No se pudieron cargar los proveedores');
    } finally {
      setCargando(false);
    }
  };

  const actualizar = (campo, valor) => setForm({ ...form, [campo]: valor });

  const manejarSubmit = async (evento) => {
    evento.preventDefault();
    setEnviando(true);
    try {
      await api.post('/proveedores', form);
      setForm({ nombre: '', contacto: '', telefono: '', correo: '', direccion: '' });
      setMostrarForm(false);
      cargarProveedores();
    } catch (err) {
      setError('No se pudo crear el proveedor');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Layout titulo="Proveedores">
      <div
        style={{
          background: 'var(--color-surface)',
          borderRadius: '12px',
          border: '1px solid var(--color-border)',
          padding: 'var(--space-5)',
          marginBottom: 'var(--space-5)',
        }}
      >
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          style={{
            padding: '8px 14px',
            borderRadius: 'var(--radius)',
            background: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          {mostrarForm ? 'Cancelar' : '+ Nuevo proveedor'}
        </button>

        {mostrarForm && (
          <form onSubmit={manejarSubmit} style={{ marginTop: 'var(--space-4)' }}>
            <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <Campo etiqueta="Nombre">
                <input type="text" value={form.nombre} onChange={(e) => actualizar('nombre', e.target.value)} required style={estiloInput} />
              </Campo>
              <Campo etiqueta="Contacto">
                <input type="text" value={form.contacto} onChange={(e) => actualizar('contacto', e.target.value)} style={estiloInput} />
              </Campo>
              <Campo etiqueta="Teléfono">
                <input type="text" value={form.telefono} onChange={(e) => actualizar('telefono', e.target.value)} style={estiloInput} />
              </Campo>
              <Campo etiqueta="Correo">
                <input type="email" value={form.correo} onChange={(e) => actualizar('correo', e.target.value)} style={estiloInput} />
              </Campo>
            </div>
            <Campo etiqueta="Dirección">
              <input type="text" value={form.direccion} onChange={(e) => actualizar('direccion', e.target.value)} style={estiloInput} />
            </Campo>
            <button
              type="submit"
              disabled={enviando}
              style={{
                padding: '10px 20px',
                borderRadius: 'var(--radius)',
                border: 'none',
                background: 'var(--color-primary)',
                color: 'white',
                fontWeight: 600,
                fontSize: '14px',
              }}
            >
              {enviando ? 'Guardando...' : 'Guardar proveedor'}
            </button>
          </form>
        )}
      </div>

      <div
        style={{
          background: 'var(--color-surface)',
          borderRadius: '12px',
          border: '1px solid var(--color-border)',
          overflow: 'hidden',
        }}
      >
        {cargando && <p style={{ padding: 'var(--space-5)', color: 'var(--color-text-secondary)' }}>Cargando…</p>}
        {error && <p style={{ padding: 'var(--space-5)', color: 'var(--color-critico)' }}>{error}</p>}

        {!cargando && proveedores.length === 0 && (
          <div style={{ padding: 'var(--space-7)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            No hay proveedores registrados todavía.
          </div>
        )}

        {!cargando && proveedores.length > 0 && (
          <table className="tabla-responsiva" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--color-bg)' }}>
                <th style={celdaEncabezado}>Nombre</th>
                <th style={celdaEncabezado}>Contacto</th>
                <th style={celdaEncabezado}>Teléfono</th>
                <th style={celdaEncabezado}>Correo</th>
              </tr>
            </thead>
            <tbody>
              {proveedores.map((p) => (
                <tr key={p.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                  <td style={celda} data-etiqueta="Nombre">{p.nombre}</td>
                  <td style={celda} data-etiqueta="Contacto">{p.contacto}</td>
                  <td style={celda} data-etiqueta="Teléfono">{p.telefono}</td>
                  <td style={celda} data-etiqueta="Correo">{p.correo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}

function Campo({ etiqueta, children }) {
  return (
    <div style={{ marginBottom: 'var(--space-4)' }}>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: 'var(--space-1)' }}>{etiqueta}</label>
      {children}
    </div>
  );
}

const estiloInput = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 'var(--radius)',
  border: '1px solid var(--color-border)',
  background: 'white',
};

const celdaEncabezado = {
  textAlign: 'left',
  padding: '10px var(--space-5)',
  fontSize: '12px',
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.03em',
};

const celda = {
  padding: 'var(--space-4) var(--space-5)',
  fontSize: '14px',
};

export default Proveedores;