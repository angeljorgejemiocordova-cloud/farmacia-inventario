import { useState, useEffect } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import EstadoChip from '../components/EstadoChip';
import { Link } from 'react-router-dom';

// Misma lógica de clasificación que usa el backend, para que el color
// del chip coincida exactamente con lo que dirían las alertas del sistema.
function calcularNivel(diasParaCaducar) {
  if (diasParaCaducar < 0) return 'vencido';
  if (diasParaCaducar <= 30) return 'critico';
  if (diasParaCaducar <= 90) return 'advertencia';
  return 'normal';
}

function Lotes() {
  const [lotes, setLotes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarLotes();
  }, []);

  const cargarLotes = async () => {
    setCargando(true);
    try {
      const respuesta = await api.get('/lotes');
      setLotes(respuesta.data);
    } catch (err) {
      setError('No se pudieron cargar los lotes');
    } finally {
      setCargando(false);
    }
  };

  return (
    <Layout titulo="Lotes">
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
            {lotes.length} {lotes.length === 1 ? 'lote activo' : 'lotes activos'}
          </span>
          <Link
            to="/lotes/nuevo"
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
            + Nuevo lote
          </Link>
        </div>

        {cargando && (
          <p style={{ padding: 'var(--space-5)', color: 'var(--color-text-secondary)' }}>Cargando lotes…</p>
        )}

        {error && <p style={{ padding: 'var(--space-5)', color: 'var(--color-critico)' }}>{error}</p>}

        {!cargando && !error && lotes.length === 0 && (
          <div style={{ padding: 'var(--space-7)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            No hay lotes registrados todavía.
          </div>
        )}

        {!cargando && lotes.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--color-bg)' }}>
                <th style={celdaEncabezado}>Producto</th>
                <th style={celdaEncabezado}>Sucursal</th>
                <th style={celdaEncabezado}>Lote</th>
                <th style={{ ...celdaEncabezado, textAlign: 'right' }}>Cantidad</th>
                <th style={celdaEncabezado}>Caducidad</th>
                <th style={celdaEncabezado}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {lotes.map((lote) => {
                const nivel = calcularNivel(lote.diasParaCaducar);
                return (
                  <tr key={lote.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                    <td style={celda}>{lote.producto?.nombre}</td>
                    <td style={celda}>{lote.sucursal?.nombre}</td>
                    <td style={celda} className="mono">{lote.numeroLote}</td>
                    <td style={{ ...celda, textAlign: 'right' }} className="mono">
                      {lote.cantidadActual}
                    </td>
                    <td style={celda} className="mono">{lote.fechaCaducidad}</td>
                    <td style={celda}>
                      <EstadoChip nivel={nivel} />
                    </td>
                  </tr>
                );
              })}
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

export default Lotes;