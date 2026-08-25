import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Layout from '../components/Layout';
import EstadoChip from '../components/EstadoChip';

function Dashboard() {
  const [resumen, setResumen] = useState(null);
  const [valorizado, setValorizado] = useState(null);
  const [alertasUrgentes, setAlertasUrgentes] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [respResumen, respValorizado, respAlertas] = await Promise.all([
        api.get('/alertas/resumen'),
        api.get('/reportes/inventario-valorizado'),
        api.get('/alertas/caducidad'),
      ]);
      setResumen(respResumen.data);
      setValorizado(respValorizado.data);
      // Solo las 5 más urgentes -- vencidos y críticos primero
      const ordenadas = [...respAlertas.data].sort((a, b) => a.diasRestantes - b.diasRestantes);
      setAlertasUrgentes(ordenadas.slice(0, 5));
    } finally {
      setCargando(false);
    }
  };

  if (cargando) {
    return (
      <Layout titulo="Inicio">
        <p style={{ color: 'var(--color-text-secondary)' }}>Cargando resumen…</p>
      </Layout>
    );
  }

  return (
    <Layout titulo="Inicio">
      {/* ---- Tarjetas de resumen ---- */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-5)',
        }}
      >
        <Tarjeta etiqueta="Lotes vencidos" valor={resumen.lotesVencidos} nivel="vencido" />
        <Tarjeta etiqueta="Lotes críticos" valor={resumen.lotesCriticos} nivel="critico" />
        <Tarjeta etiqueta="Por vencer" valor={resumen.lotesAdvertencia} nivel="advertencia" />
        <Tarjeta etiqueta="Bajo stock mínimo" valor={resumen.productosBajoMinimo} nivel="critico" />
        <div
          style={{
            padding: 'var(--space-4) var(--space-5)',
            borderRadius: '12px',
            border: '1px solid var(--color-border)',
            background: 'var(--color-primary-dark)',
            color: 'white',
          }}
        >
          <div style={{ fontSize: '13px', opacity: 0.85, marginBottom: 'var(--space-1)' }}>
            Valor del inventario
          </div>
          <div className="mono" style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700 }}>
            Bs {valorizado.valorTotalInventario.toFixed(2)}
          </div>
        </div>
      </div>

      {/* ---- Tabla de lotes más urgentes ---- */}
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
          <h3 style={{ fontSize: '15px' }}>Lotes que requieren atención</h3>
          <Link to="/alertas" style={{ fontSize: '13px', color: 'var(--color-primary)', fontWeight: 600 }}>
            Ver todas →
          </Link>
        </div>

        {alertasUrgentes.length === 0 && (
          <div style={{ padding: 'var(--space-7)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            Sin alertas activas -- todo el inventario está en buen estado.
          </div>
        )}

        {alertasUrgentes.length > 0 && (
          <table className="tabla-responsiva" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--color-bg)' }}>
                <th style={celdaEncabezado}>Producto</th>
                <th style={celdaEncabezado}>Lote</th>
                <th style={{ ...celdaEncabezado, textAlign: 'right' }}>Días</th>
                <th style={celdaEncabezado}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {alertasUrgentes.map((a) => (
                <tr key={a.loteId} style={{ borderTop: '1px solid var(--color-border)' }}>
                  <td style={celda} data-etiqueta="Producto">{a.productoNombre}</td>
                  <td style={celda} className="mono" data-etiqueta="Lote">{a.numeroLote}</td>
                  <td style={{ ...celda, textAlign: 'right' }} className="mono" data-etiqueta="Días">{a.diasRestantes}</td>
                  <td style={celda} data-etiqueta="Estado">
                    <EstadoChip nivel={a.nivelAlerta} />
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

function Tarjeta({ etiqueta, valor, nivel }) {
  return (
    <div
      style={{
        padding: 'var(--space-4) var(--space-5)',
        borderRadius: '12px',
        border: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
      }}
    >
      <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' }}>
        {etiqueta}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: `var(--color-${nivel})` }}>
        {valor}
      </div>
    </div>
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

export default Dashboard;