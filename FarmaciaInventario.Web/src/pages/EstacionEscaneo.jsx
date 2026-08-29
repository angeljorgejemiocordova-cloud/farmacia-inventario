import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import EscanerCodigoBarras from '../components/EscanerCodigoBarras';
import Layout from '../components/Layout';
import api from '../services/api';

const ETAPA = {
  ESCANEANDO: 'escaneando',
  BUSCANDO: 'buscando',
  ENCONTRADO_CATALOGO: 'encontrado_catalogo',
  OFRECER_IA: 'ofrecer_ia',
  ANALIZANDO_IA: 'analizando_ia',
  RESULTADO_IA: 'resultado_ia',
};

function EstacionEscaneo() {
  const navigate = useNavigate();
  const [etapa, setEtapa] = useState(ETAPA.ESCANEANDO);
  const [codigoActual, setCodigoActual] = useState('');
  const [productoEncontrado, setProductoEncontrado] = useState(null);
  const [datosIA, setDatosIA] = useState(null);
  const [error, setError] = useState('');
  const inputFotoRef = useRef(null);

  const reiniciar = () => {
    setEtapa(ETAPA.ESCANEANDO);
    setCodigoActual('');
    setProductoEncontrado(null);
    setDatosIA(null);
    setError('');
  };

  const manejarCodigoDetectado = async (codigo) => {
    if (navigator.vibrate) navigator.vibrate(80);

    setCodigoActual(codigo);
    setEtapa(ETAPA.BUSCANDO);
    setError('');

    try {
      const respuesta = await api.get(`/productos/buscar-codigo/${codigo}`);
      setProductoEncontrado(respuesta.data.producto);
      setEtapa(ETAPA.ENCONTRADO_CATALOGO);
    } catch (err) {
      setEtapa(ETAPA.OFRECER_IA);
    }
  };

  const abrirCamaraFoto = () => {
    inputFotoRef.current?.click();
  };

    const manejarFotoSeleccionada = async (evento) => {
    const archivo = evento.target.files?.[0];
    if (!archivo) return;

    setEtapa(ETAPA.ANALIZANDO_IA);
    setError('');

    try {
      const base64 = await convertirABase64(archivo);
      const respuesta = await api.post(
        '/productos/identificar-ia',
        { imagenBase64: base64 },
        { timeout: 60000 } // si no responde en 60s, avisamos en vez de colgar para siempre
      );
      setDatosIA(respuesta.data);
      setEtapa(ETAPA.RESULTADO_IA);
        } catch (err) {
      console.error('Error identificando con IA:', err);
      const detalle = err.response?.data?.mensaje || err.message || 'Error desconocido';
      setError(`Detalle técnico: ${detalle}`);
      setEtapa(ETAPA.OFRECER_IA);
    }
  };

  // Comprime la foto antes de enviarla -- las fotos de cámara pueden pesar
  // varios MB, lo que hace la subida lenta o poco confiable en redes móviles.
  // Reducimos a un ancho máximo razonable para lectura de texto (1024px)
  // y calidad JPEG 0.75, suficiente para que la IA lea el empaque con claridad.
  const convertirABase64 = (archivo) => {
    return new Promise((resolve, reject) => {
      const lector = new FileReader();
      lector.onload = () => {
        const imagen = new Image();
        imagen.onload = () => {
          const anchoMaximo = 1024;
          const escala = Math.min(1, anchoMaximo / imagen.width);
          const canvas = document.createElement('canvas');
          canvas.width = imagen.width * escala;
          canvas.height = imagen.height * escala;

          const contexto = canvas.getContext('2d');
          contexto.drawImage(imagen, 0, 0, canvas.width, canvas.height);

          const dataUrlComprimido = canvas.toDataURL('image/jpeg', 0.75);
          resolve(dataUrlComprimido.split(',')[1]);
        };
        imagen.onerror = reject;
        imagen.src = lector.result;
      };
      lector.onerror = reject;
      lector.readAsDataURL(archivo);
    });
  };

  const irACrearProductoConIA = () => {
    const parametros = new URLSearchParams({
      codigoBarras: codigoActual,
      nombre: datosIA.nombre || '',
      principioActivo: datosIA.principioActivo || '',
      presentacion: datosIA.presentacion || '',
      laboratorio: datosIA.laboratorio || '',
      requiereReceta: datosIA.requiereRecetaSugerido ? 'true' : 'false',
    });
    window.location.href = `/productos/nuevo?${parametros.toString()}`;
  };

  return (
    <Layout titulo="Estación de escaneo">
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
                {etapa === ETAPA.ESCANEANDO && (
          <EscanerCodigoBarras
            onDetectado={manejarCodigoDetectado}
            onCerrar={() => navigate('/dashboard')}
          />
        )}

        {etapa === ETAPA.BUSCANDO && (
          <TarjetaEstado icono="🔍" texto="Buscando producto…" />
        )}

        {etapa === ETAPA.ENCONTRADO_CATALOGO && productoEncontrado && (
          <div style={tarjetaEstilo}>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
              Producto identificado
            </p>
            <h3 style={{ marginBottom: 'var(--space-4)' }}>{productoEncontrado.nombre}</h3>
            <BotonPrimario onClick={reiniciar}>Escanear siguiente</BotonPrimario>
          </div>
        )}

        {etapa === ETAPA.OFRECER_IA && (
          <div style={tarjetaEstilo}>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '4px' }} className="mono">
              Código: {codigoActual}
            </p>
            <h3 style={{ marginBottom: 'var(--space-2)' }}>Producto no reconocido</h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
              No está en tu catálogo ni en bases públicas. Toma una foto de la caja y la IA la identificará.
            </p>
            {error && <p style={{ color: 'var(--color-critico)', fontSize: '13px', marginBottom: 'var(--space-3)' }}>{error}</p>}
            <BotonPrimario onClick={abrirCamaraFoto}>📷 Tomar foto para identificar</BotonPrimario>
            <input
              ref={inputFotoRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={manejarFotoSeleccionada}
            />
            <BotonSecundario onClick={reiniciar}>Cancelar</BotonSecundario>
          </div>
        )}

        {etapa === ETAPA.ANALIZANDO_IA && (
          <TarjetaEstado icono="🤖" texto="Analizando la imagen con IA…" />
        )}

        {etapa === ETAPA.RESULTADO_IA && datosIA && (
          <div style={tarjetaEstilo}>
            <p style={{ fontSize: '13px', color: 'var(--color-normal)', fontWeight: 600, marginBottom: 'var(--space-3)' }}>
              ✓ Identificado por IA -- revisa antes de continuar
            </p>
            <CampoResultado etiqueta="Nombre" valor={datosIA.nombre} />
            <CampoResultado etiqueta="Principio activo" valor={datosIA.principioActivo} />
            <CampoResultado etiqueta="Concentración" valor={datosIA.concentracion} />
            <CampoResultado etiqueta="Forma farmacéutica" valor={datosIA.formaFarmaceutica} />
            <CampoResultado etiqueta="Laboratorio" valor={datosIA.laboratorio} />
            <CampoResultado etiqueta="Presentación" valor={datosIA.presentacion} />
            <CampoResultado etiqueta="Categoría" valor={datosIA.categoriaTerapeutica} />
            <div style={{ marginTop: 'var(--space-4)' }}>
              <BotonPrimario onClick={irACrearProductoConIA}>
                Continuar y completar registro
              </BotonPrimario>
              <BotonSecundario onClick={reiniciar}>Descartar y escanear otro</BotonSecundario>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

function TarjetaEstado({ icono, texto }) {
  return (
    <div style={{ ...tarjetaEstilo, textAlign: 'center', padding: 'var(--space-7)' }}>
      <div style={{ fontSize: '40px', marginBottom: 'var(--space-3)' }}>{icono}</div>
      <p style={{ color: 'var(--color-text-secondary)' }}>{texto}</p>
    </div>
  );
}

function CampoResultado({ etiqueta, valor }) {
  return (
    <div style={{ marginBottom: 'var(--space-2)', fontSize: '14px' }}>
      <span style={{ color: 'var(--color-text-secondary)' }}>{etiqueta}: </span>
      <span style={{ fontWeight: 600 }}>{valor || '—'}</span>
    </div>
  );
}

function BotonPrimario({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: '14px',
        borderRadius: 'var(--radius)',
        border: 'none',
        background: 'var(--color-primary)',
        color: 'white',
        fontWeight: 600,
        fontSize: '15px',
        marginBottom: 'var(--space-2)',
      }}
    >
      {children}
    </button>
  );
}

function BotonSecundario({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: '12px',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--color-border)',
        background: 'white',
        fontSize: '14px',
      }}
    >
      {children}
    </button>
  );
}

const tarjetaEstilo = {
  background: 'var(--color-surface)',
  borderRadius: '12px',
  border: '1px solid var(--color-border)',
  padding: 'var(--space-5)',
};

export default EstacionEscaneo;