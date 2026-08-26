import { useState, useEffect } from 'react';
import EscanerCodigoBarras from '../components/EscanerCodigoBarras';
import api from '../services/api';
import Layout from '../components/Layout';

function RegistrarSalida() {
  const [productos, setProductos] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [productoId, setProductoId] = useState('');
  const [sucursalId, setSucursalId] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState('');
  const [referencia, setReferencia] = useState('');

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState(null);
  const [escaneando, setEscaneando] = useState(false);
  const [avisoEscaneo, setAvisoEscaneo] = useState('');

  const manejarCodigoDetectado = async (codigo) => {
    setEscaneando(false);
    setAvisoEscaneo('');
    try {
      const respuesta = await api.get(`/productos/buscar-codigo/${codigo}`);
      setProductoId(respuesta.data.id);
      setAvisoEscaneo(`✓ ${respuesta.data.nombre} seleccionado`);
    } catch {
      setAvisoEscaneo('Código no reconocido -- selecciona el producto manualmente');
    }
  };

  useEffect(() => {
    cargarListas();
  }, []);

  const cargarListas = async () => {
    try {
      const [respProductos, respSucursales] = await Promise.all([
        api.get('/productos'),
        api.get('/sucursales'),
      ]);
      setProductos(respProductos.data);
      setSucursales(respSucursales.data);
    } catch (err) {
      setError('No se pudieron cargar productos o sucursales');
    }
  };

  const manejarSubmit = async (evento) => {
    evento.preventDefault();
    setError('');
    setResultado(null);
    setEnviando(true);

    try {
      const respuesta = await api.post('/movimientos/salida', {
        productoId,
        sucursalId,
        cantidad: parseInt(cantidad, 10),
        motivo: motivo || null,
        referencia: referencia || null,
      });
      setResultado(respuesta.data);
      setCantidad('');
      setReferencia('');
    } catch (err) {
      const mensaje = err.response?.data?.mensaje || 'No se pudo registrar la salida';
      const disponible = err.response?.data?.stockDisponible;
      setError(disponible !== undefined ? `${mensaje} (disponible: ${disponible})` : mensaje);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Layout titulo="Registrar salida">
      <div className="layout-2col">
        <div
          style={{
            background: 'var(--color-surface)',
            borderRadius: '12px',
            border: '1px solid var(--color-border)',
            padding: 'var(--space-5)',
          }}
        >
          <form onSubmit={manejarSubmit}>            <Campo etiqueta="Producto">
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <select
                  value={productoId}
                  onChange={(e) => setProductoId(e.target.value)}
                  required
                  style={{ ...estiloInput, flex: 1 }}
                >
                  <option value="">Selecciona un producto</option>
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setEscaneando(true)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--color-border)',
                    background: 'white',
                    fontSize: '18px',
                  }}
                  title="Escanear código de barras"
                >
                  📷
                </button>
              </div>
              {avisoEscaneo && (
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                  {avisoEscaneo}
                </p>
              )}
            </Campo>

            {escaneando && (
              <EscanerCodigoBarras
                onDetectado={manejarCodigoDetectado}
                onCerrar={() => setEscaneando(false)}
              />
            )}

            <Campo etiqueta="Sucursal">
              <select
                value={sucursalId}
                onChange={(e) => setSucursalId(e.target.value)}
                required
                style={estiloInput}
              >
                <option value="">Selecciona una sucursal</option>
                {sucursales.map((s) => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </Campo>

            <Campo etiqueta="Cantidad">
              <input
                type="number"
                min="1"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                required
                style={estiloInput}
              />
            </Campo>

            <Campo etiqueta="Motivo (opcional)">
              <input
                type="text"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ej: Venta mostrador"
                style={estiloInput}
              />
            </Campo>

            <Campo etiqueta="Referencia (opcional)">
              <input
                type="text"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                placeholder="Ej: N° de venta"
                style={estiloInput}
              />
            </Campo>

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
              disabled={enviando}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 'var(--radius)',
                border: 'none',
                background: 'var(--color-primary)',
                color: 'white',
                fontWeight: 600,
                fontSize: '14px',
                opacity: enviando ? 0.7 : 1,
              }}
            >
              {enviando ? 'Registrando...' : 'Registrar salida'}
            </button>
          </form>
        </div>

        <div
          style={{
            background: 'var(--color-surface)',
            borderRadius: '12px',
            border: '1px solid var(--color-border)',
            padding: 'var(--space-5)',
            minHeight: '200px',
          }}
        >
          <h3 style={{ fontSize: '15px', marginBottom: 'var(--space-4)' }}>Detalle de la salida</h3>

          {!resultado && (
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Al registrar una salida, aquí verás de qué lote (o lotes) se descontó el stock,
              priorizando siempre el que caduca primero.
            </p>
          )}

          {resultado && (
            <div>
              <div
                style={{
                  background: 'var(--color-normal-bg)',
                  color: 'var(--color-normal)',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius)',
                  fontSize: '13px',
                  fontWeight: 600,
                  marginBottom: 'var(--space-4)',
                }}
              >
                {resultado.cantidadTotalSolicitada} unidades descontadas correctamente
              </div>

              {resultado.lotesAfectados.map((lote) => (
                <div
                  key={lote.loteId}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: 'var(--space-3) 0',
                    borderTop: '1px solid var(--color-border)',
                    fontSize: '13px',
                  }}
                >
                  <div>
                    <div className="mono" style={{ fontWeight: 600 }}>{lote.numeroLote}</div>
                    <div style={{ color: 'var(--color-text-secondary)' }} className="mono">
                      Vence: {lote.fechaCaducidad}
                    </div>
                  </div>
                  <div className="mono" style={{ fontWeight: 600 }}>
                    -{lote.cantidadDescontada}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function Campo({ etiqueta, children }) {
  return (
    <div style={{ marginBottom: 'var(--space-4)' }}>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: 'var(--space-1)' }}>
        {etiqueta}
      </label>
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

export default RegistrarSalida;