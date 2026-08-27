import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import EscanerCodigoBarras from '../components/EscanerCodigoBarras';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Layout from '../components/Layout';

ffunction NuevoProducto() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({
    nombre: searchParams.get('nombre') || '',
    principioActivo: searchParams.get('principioActivo') || '',
    presentacion: searchParams.get('presentacion') || '',
    unidadMedida: '',
    laboratorio: searchParams.get('laboratorio') || '',
    codigoBarras: searchParams.get('codigoBarras') || '',
    precioVenta: '',
    requiereReceta: searchParams.get('requiereReceta') === 'true',
  });
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [escaneando, setEscaneando] = useState(false);
  const [buscandoOrigen, setBuscandoOrigen] = useState(false);
  const [avisoEscaneo, setAvisoEscaneo] = useState('');

  const manejarCodigoDetectado = async (codigo) => {
    setEscaneando(false);
    setAvisoEscaneo('');
    setBuscandoOrigen(true);

    try {
      const respuesta = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5013/api/v1'}/productos/buscar-externo/${codigo}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      if (respuesta.ok) {
        const datos = await respuesta.json();
        setForm({
          ...form,
          codigoBarras: codigo,
          nombre: datos.nombre || form.nombre,
          laboratorio: datos.marca || form.laboratorio,
        });
        setAvisoEscaneo(`✓ Identificado: ${datos.nombre}${datos.marca ? ' -- ' + datos.marca : ''}`);
      } else {
        setForm({ ...form, codigoBarras: codigo });
        setAvisoEscaneo('No se encontró información de este código -- completa los datos manualmente');
      }
    } catch {
      setForm({ ...form, codigoBarras: codigo });
      setAvisoEscaneo('No se pudo consultar el origen del producto -- completa los datos manualmente');
    } finally {
      setBuscandoOrigen(false);
    }
  };
  const actualizar = (campo, valor) => setForm({ ...form, [campo]: valor });

  const manejarSubmit = async (evento) => {
    evento.preventDefault();
    setError('');
    setEnviando(true);

    try {
            const respuesta = await api.post('/productos', {
        ...form,
        precioVenta: parseFloat(form.precioVenta) || 0,
        codigoBarras: form.codigoBarras || null,
      });
      // Encadena directo a crear su primer lote, sin tener que buscarlo de nuevo
      navigate(`/lotes/nuevo?productoId=${respuesta.data.id}&productoNombre=${encodeURIComponent(respuesta.data.nombre)}`);
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo crear el producto');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Layout titulo="Nuevo producto">
      <div
        style={{
          background: 'var(--color-surface)',
          borderRadius: '12px',
          border: '1px solid var(--color-border)',
          padding: 'var(--space-6)',
          maxWidth: '560px',
        }}
      >
        <form onSubmit={manejarSubmit}>
          <Campo etiqueta="Nombre">
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => actualizar('nombre', e.target.value)}
              required
              autoFocus
              style={estiloInput}
            />
          </Campo>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Campo etiqueta="Principio activo">
              <input
                type="text"
                value={form.principioActivo}
                onChange={(e) => actualizar('principioActivo', e.target.value)}
                style={estiloInput}
              />
            </Campo>
            <Campo etiqueta="Laboratorio">
              <input
                type="text"
                value={form.laboratorio}
                onChange={(e) => actualizar('laboratorio', e.target.value)}
                style={estiloInput}
              />
            </Campo>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <Campo etiqueta="Presentación">
              <input
                type="text"
                value={form.presentacion}
                onChange={(e) => actualizar('presentacion', e.target.value)}
                placeholder="Ej: Caja x 20 tabletas"
                style={estiloInput}
              />
            </Campo>
            <Campo etiqueta="Unidad de medida">
              <input
                type="text"
                value={form.unidadMedida}
                onChange={(e) => actualizar('unidadMedida', e.target.value)}
                placeholder="Ej: caja"
                required
                style={estiloInput}
              />
            </Campo>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                        <Campo etiqueta="Código de barras (opcional)">
                            <input
                type="text"
                value={form.codigoBarras}
                onChange={(e) => actualizar('codigoBarras', e.target.value)}
                style={estiloInput}
              />
                            {form.codigoBarras && (
                <p className="mono" style={{ fontSize: '13px', fontWeight: 600, marginTop: '4px', wordBreak: 'break-all' }}>
                  Código capturado: {form.codigoBarras}
                </p>
              )}
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
            <Campo etiqueta="Precio de venta (Bs)">
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.precioVenta}
                onChange={(e) => actualizar('precioVenta', e.target.value)}
                required
                style={estiloInput}
              />
            </Campo>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
            <input
              type="checkbox"
              id="requiereReceta"
              checked={form.requiereReceta}
              onChange={(e) => actualizar('requiereReceta', e.target.checked)}
            />
            <label htmlFor="requiereReceta" style={{ fontSize: '14px' }}>Requiere receta médica</label>
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
              {enviando ? 'Guardando...' : 'Guardar producto'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/productos')}
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

export default NuevoProducto;