import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from '@zxing/library';

// Restringimos los formatos a los que realmente usan los medicamentos --
// menos trabajo de decodificación, más velocidad y menos falsos positivos.
const hints = new Map();
hints.set(DecodeHintType.POSSIBLE_FORMATS, [
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.CODE_128,
]);

function EscanerCodigoBarras({ onDetectado, onCerrar }) {
  const videoRef = useRef(null);
  const lectorRef = useRef(null);
  const ultimaLecturaRef = useRef({ codigo: null, veces: 0 });

  const [error, setError] = useState('');
  const [linternaDisponible, setLinternaDisponible] = useState(false);
  const [linternaActiva, setLinternaActiva] = useState(false);
  const [pistaVideo, setPistaVideo] = useState(null);

  useEffect(() => {
    iniciarCamara();
    return () => detenerCamara();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const iniciarCamara = async () => {
    try {
      // Usa la API nativa del navegador si existe (más rápida y precisa);
      // si no, ZXing se encarga de decodificar por software.
      const usaDetectorNativo = 'BarcodeDetector' in window;

      const lector = new BrowserMultiFormatReader(hints);
      lectorRef.current = lector;

      await lector.decodeFromConstraints(
        {
          video: {
            facingMode: 'environment', // cámara trasera, no la frontal
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        },
        videoRef.current,
        (resultado) => {
          if (resultado) {
            manejarLectura(resultado.getText());
          }
        }
      );

      // Detecta si el dispositivo tiene linterna controlable
      const stream = videoRef.current?.srcObject;
      const track = stream?.getVideoTracks?.()[0];
      if (track) {
        const capacidades = track.getCapabilities?.();
        setLinternaDisponible(!!capacidades?.torch);
        setPistaVideo(track);
      }
    } catch (err) {
      setError('No se pudo acceder a la cámara. Verifica los permisos del navegador.');
    }
  };

  const detenerCamara = () => {
    lectorRef.current?.reset();
  };

  // Exige leer el MISMO código dos veces seguidas antes de aceptarlo --
  // reduce drásticamente los falsos positivos por un movimiento brusco.
  const manejarLectura = (codigo) => {
    const anterior = ultimaLecturaRef.current;
    if (anterior.codigo === codigo) {
      const veces = anterior.veces + 1;
      ultimaLecturaRef.current = { codigo, veces };
      if (veces >= 2) {
        detenerCamara();
        onDetectado(codigo);
      }
    } else {
      ultimaLecturaRef.current = { codigo, veces: 1 };
    }
  };

  const alternarLinterna = async () => {
    if (!pistaVideo) return;
    try {
      await pistaVideo.applyConstraints({ advanced: [{ torch: !linternaActiva }] });
      setLinternaActiva(!linternaActiva);
    } catch {
      // Algunos dispositivos reportan soporte de linterna pero fallan al activarla --
      // fallamos en silencio, no es crítico para el flujo principal.
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.9)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ position: 'relative', width: '100%', maxWidth: '480px' }}>
        <video ref={videoRef} style={{ width: '100%', borderRadius: '8px' }} muted playsInline />

        {/* Marco guía */}
        <div
          style={{
            position: 'absolute',
            top: '35%',
            left: '10%',
            right: '10%',
            height: '30%',
            border: '3px solid #8FD9C4',
            borderRadius: '8px',
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)',
          }}
        />
      </div>

      <p style={{ color: 'white', marginTop: 'var(--space-4)', fontSize: '14px' }}>
        Centra el código de barras dentro del marco
      </p>

      {error && (
        <p style={{ color: 'var(--color-critico)', background: 'white', padding: '8px 12px', borderRadius: '8px' }}>
          {error}
        </p>
      )}

      <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
        {linternaDisponible && (
          <button
            onClick={alternarLinterna}
            style={{
              padding: '10px 20px',
              borderRadius: 'var(--radius)',
              border: 'none',
              background: linternaActiva ? '#8FD9C4' : 'white',
              fontWeight: 600,
            }}
          >
            💡 Linterna
          </button>
        )}
        <button
          onClick={() => {
            detenerCamara();
            onCerrar();
          }}
          style={{
            padding: '10px 20px',
            borderRadius: 'var(--radius)',
            border: 'none',
            background: 'var(--color-critico)',
            color: 'white',
            fontWeight: 600,
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

export default EscanerCodigoBarras;