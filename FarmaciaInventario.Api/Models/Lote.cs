using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using FarmaciaInventario.Api.Enums;

namespace FarmaciaInventario.Api.Models
{
    public class Lote
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid ProductoId { get; set; }
        public Producto? Producto { get; set; }

        [Required]
        public Guid SucursalId { get; set; }
        public Sucursal? Sucursal { get; set; }

        public Guid? ProveedorId { get; set; }
        public Proveedor? Proveedor { get; set; }

        [Required]
        [MaxLength(100)]
        public string NumeroLote { get; set; } = string.Empty;

        [Required]
        public DateOnly FechaIngreso { get; set; } = DateOnly.FromDateTime(DateTime.UtcNow);

        [Required]
        public DateOnly FechaCaducidad { get; set; }

        [Required]
        public int CantidadInicial { get; set; }

        [Required]
        public int CantidadActual { get; set; }

        [Column(TypeName = "numeric(10,2)")]
        public decimal CostoUnitario { get; set; } = 0;

        public EstadoLote Estado { get; set; } = EstadoLote.Activo;

        public DateTime CreadoEn { get; set; } = DateTime.UtcNow;

        public DateTime ActualizadoEn { get; set; } = DateTime.UtcNow;

        // Propiedad calculada, no se guarda en la base de datos:
        // útil para el frontend sin tener que calcularlo cada vez
        [NotMapped]
        public int DiasParaCaducar => FechaCaducidad.DayNumber - DateOnly.FromDateTime(DateTime.UtcNow).DayNumber;
    }
}