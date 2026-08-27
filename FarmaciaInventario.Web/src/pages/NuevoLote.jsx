import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import Layout from '../components/Layout';

function NuevoLote() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productoIdPrellenado = searchParams.get('productoId');
  const productoNombrePrellenado = searchParams.get('productoNombre');
  const [productos, setProductos] = useState([]);
  const [sucursales, setSucursales] = useState([]);

    const [form, setForm] = useState({
    productoId: productoIdPrellenado || '',
    sucursalId: '',
    numeroLote: '',
    fechaIngreso: new Date().toISOString().slice(0, 10),
    fechaCaducidad: '',
    cantidadInicial: '',
    costoUnitario: '',
  });
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/productos'), api.get('/sucursales')])
      .then(([respProductos, respSucursales]) => {
        setProductos(respProductos.data);
        setSucursales(respSucursales.data);
      })
      .catch(() => setError('No se pudieron cargar productos o sucursales'));
  }, []);

  const actualizar = (campo, valor) => setForm({ ...form, [campo]: valor });

  const manejarSubmit = async (evento) => {
    evento.preventDefault();
    setError('');
    setEnviando(true);

    try {
      await api.post('/lotes', {
        ...form,
        proveedorId: null,
        cantidadInicial: parseInt(form.cantidadInicial, 10),
        cantidadActual: 0,
        costoUnitario: parseFloat(form.costoUnitario) || 0,
      });
      navigate('/lotes');
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo crear el lote');
    } finally {
      setEnviando(false);
    }
  };

    return (
    <Layout titulo="Nuevo lote">
      <div
        style={{
          background: 'var(--color-surface)',
          borderRadius: '12px',
          border: '1px solid var(--color-border)',
          padding: 'var(--space-6)',
          maxWidth: '560px',
        }}
      >
        {productoNombrePrellenado && (
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
            ✓ Producto "{productoNombrePrellenado}" creado -- ahora registra su primer lote
          </div>
        )}
        <form onSubmit={manejarSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Campo etiqueta="Producto">
              <select
                value={form.productoId}
                onChange={(e) => actualizar('productoId', e.target.value)}
                required
                style={estiloInput}
              >
                <option value="">Selecciona un producto</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </Campo>
            <Campo etiqueta="Sucursal">
              <select
                value={form.sucursalId}
                onChange={(e) => actualizar('sucursalId', e.target.value)}
                required
                style={estiloInput}
              >
                <option value="">Selecciona una sucursal</option>
                {sucursales.map((s) => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </Campo>
          </div>

          <Campo etiqueta="Número de lote">
            <input
              type="text"
              value={form.numeroLote}
              onChange={(e) => actualizar('numeroLote', e.target.value)}
              required
              style={estiloInput}
            />
          </Campo>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Campo etiqueta="Fecha de ingreso">
              <input
                type="date"
                value={form.fechaIngreso}
                onChange={(e) => actualizar('fechaIngreso', e.target.value)}
                required
                style={estiloInput}
              />
            </Campo>
            <Campo etiqueta="Fecha de caducidad">
              <input
                type="date"
                value={form.fechaCaducidad}
                onChange={(e) => actualizar('fechaCaducidad', e.target.value)}
                required
                style={estiloInput}
              />
            </Campo>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Campo etiqueta="Cantidad">
              <input
                type="number"
                min="1"
                value={form.cantidadInicial}
                onChange={(e) => actualizar('cantidadInicial', e.target.value)}
                required
                style={estiloInput}
              />
            </Campo>
            <Campo etiqueta="Costo unitario (Bs)">
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.costoUnitario}
                onChange={(e) => actualizar('costoUnitario', e.target.value)}
                required
                style={estiloInput}
              />
            </Campo>
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

          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
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
                opacity: enviando ? 0.7 : 1,
              }}
            >
              {enviando ? 'Guardando...' : 'Guardar lote'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/lotes')}
              style={{
                padding: '10px 20px',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--color-border)',
                background: 'white',
                fontSize: '14px',
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
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

export default NuevoLote;