import { useState, useEffect } from 'react';
import api from '../services/api';
import Layout from '../components/Layout';
import EstadoChip from '../components/EstadoChip';

function Alertas() {
  const [alertas, setAlertas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState('todos');

  useEffect(() => {
    cargarAlertas();
  }, []);

  const cargarAlertas = async () => {
    setCargando(true);
    try {
      const respuesta = await api.get('/alertas/caducidad');
      setAlertas(respuesta.data);
    } catch (err) {
      setError('No se pudieron cargar las alertas');
    } finally {
      setCargando(false);
    }
  };

  const alertasFiltradas =
    filtro === 'todos' ? alertas : alertas.filter((a) => a.nivelAlerta === filtro);

  const conteos = {
    vencido: alertas.filter((a) => a.nivelAlerta === 'vencido').length,
    critico: alertas.filter((a) => a.nivelAlerta === 'critico').length,
    advertencia: alertas.filter((a) => a.nivelAlerta === 'advertencia').length,
  };

  return (
    <Layout titulo="Alertas de caducidad">
      <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
        <TarjetaResumen
          etiqueta="Vencidos"
          valor={conteos.vencido}
          nivel="vencido"
          activo={filtro === 'vencido'}
          onClick={() => setFiltro(filtro === 'vencido' ? 'todos' : 'vencido')}
        />
        <TarjetaResumen
          etiqueta="Críticos"
          valor={conteos.critico}
          nivel="critico"
          activo={filtro === 'critico'}
          onClick={() => setFiltro(filtro === 'critico' ? 'todos' : 'critico')}
        />
        <TarjetaResumen
          etiqueta="Por vencer"
          valor={conteos.advertencia}
          nivel="advertencia"
          activo={filtro === 'advertencia'}
          onClick={() => setFiltro(filtro === 'advertencia' ? 'todos' : 'advertencia')}
        />
      </div>

      <div
        style={{
          background: 'var(--color-surface)',
          borderRadius: '12px',
          border: '1px solid var(--color-border)',
          overflow: 'hidden',
        }}
      >
        {cargando && (
          <p style={{ padding: 'var(--space-5)', color: 'var(--color-text-secondary)' }}>Cargando alertas…</p>
        )}

        {error && <p style={{ padding: 'var(--space-5)', color: 'var(--color-critico)' }}>{error}</p>}

        {!cargando && !error && alertasFiltradas.length === 0 && (
          <div style={{ padding: 'var(--space-7)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            {alertas.length === 0
              ? 'Sin alertas activas -- todo el inventario está en buen estado.'
              : 'Sin resultados para este filtro.'}
          </div>
        )}

        {!cargando && alertasFiltradas.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--color-bg)' }}>
                <th style={celdaEncabezado}>Producto</th>
                <th style={celdaEncabezado}>Sucursal</th>
                <th style={celdaEncabezado}>Lote</th>
                <th style={{ ...celdaEncabezado, textAlign: 'right' }}>Cantidad</th>
                <th style={celdaEncabezado}>Caducidad</th>
                <th style={{ ...celdaEncabezado, textAlign: 'right' }}>Días</th>
                <th style={celdaEncabezado}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {alertasFiltradas.map((alerta) => (
                <tr key={alerta.loteId} style={{ borderTop: '1px solid var(--color-border)' }}>
                  <td style={celda}>{alerta.productoNombre}</td>
                  <td style={celda}>{alerta.sucursalNombre}</td>
                  <td style={celda} className="mono">{alerta.numeroLote}</td>
                  <td style={{ ...celda, textAlign: 'right' }} className="mono">
                    {alerta.cantidadActual}
                  </td>
                  <td style={celda} className="mono">{alerta.fechaCaducidad}</td>
                  <td style={{ ...celda, textAlign: 'right' }} className="mono">
                    {alerta.diasRestantes}
                  </td>
                  <td style={celda}>
                    <EstadoChip nivel={alerta.nivelAlerta} />
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

function TarjetaResumen({ etiqueta, valor, nivel, activo, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        textAlign: 'left',
        padding: 'var(--space-4) var(--space-5)',
        borderRadius: '12px',
        border: activo ? `2px solid var(--color-${nivel})` : '1px solid var(--color-border)',
        background: 'var(--color-surface)',
      }}
    >
      <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-1)' }}>
        {etiqueta}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700, color: `var(--color-${nivel})` }}>
        {valor}
      </div>
    </button>
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

export default Alertas;