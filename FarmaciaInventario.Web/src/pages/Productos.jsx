import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Layout from '../components/Layout';

function Productos() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    setCargando(true);
    try {
      const respuesta = await api.get('/productos');
      setProductos(respuesta.data);
    } catch (err) {
      setError('No se pudieron cargar los productos');
    } finally {
      setCargando(false);
    }
  };

  return (
    <Layout titulo="Productos">
      <div
        style={{
          background: 'var(--color-surface)',
          borderRadius: '12px',
          border: '1px solid var(--color-border)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: 'var(--space-4) var(--space-5)',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            {productos.length} {productos.length === 1 ? 'producto registrado' : 'productos registrados'}
          </span>
          <Link
            to="/productos/nuevo"
            style={{
              padding: '8px 14px',
              borderRadius: 'var(--radius)',
              background: 'var(--color-primary)',
              color: 'white',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            + Nuevo producto
          </Link>
        </div>

        {cargando && (
          <p style={{ padding: 'var(--space-5)', color: 'var(--color-text-secondary)' }}>Cargando productos…</p>
        )}

        {error && <p style={{ padding: 'var(--space-5)', color: 'var(--color-critico)' }}>{error}</p>}

        {!cargando && !error && productos.length === 0 && (
          <div style={{ padding: 'var(--space-7)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            No hay productos registrados todavía.
          </div>
        )}

        {!cargando && productos.length > 0 && (
          <table className="tabla-responsiva" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--color-bg)' }}>
                <th style={celdaEncabezado}>Nombre</th>
                <th style={celdaEncabezado}>Presentación</th>
                <th style={celdaEncabezado}>Laboratorio</th>
                <th style={{ ...celdaEncabezado, textAlign: 'right' }}>Precio</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((producto) => (
                <tr key={producto.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                  <td style={celda} data-etiqueta="Nombre">
                    <div style={{ fontWeight: 600 }}>{producto.nombre}</div>
                    {producto.principioActivo && (
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                        {producto.principioActivo}
                      </div>
                    )}
                  </td>
                  <td style={celda} data-etiqueta="Presentación">{producto.presentacion}</td>
                  <td style={celda} data-etiqueta="Laboratorio">{producto.laboratorio}</td>
                  <td style={{ ...celda, textAlign: 'right' }} className="mono" data-etiqueta="Precio">
                    Bs {producto.precioVenta.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}

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

export default Productos;