const ETIQUETAS = {
  vencido: 'Vencido',
  critico: 'Crítico',
  advertencia: 'Por vencer',
  normal: 'Vigente',
};

function EstadoChip({ nivel }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 10px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: 600,
        fontFamily: 'var(--font-body)',
        color: `var(--color-${nivel})`,
        background: `var(--color-${nivel}-bg)`,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: `var(--color-${nivel})`,
        }}
      />
      {ETIQUETAS[nivel] || nivel}
    </span>
  );
}

export default EstadoChip;