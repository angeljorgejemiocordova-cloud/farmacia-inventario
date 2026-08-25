using System.ComponentModel.DataAnnotations;

namespace FarmaciaInventario.Api.Models
{
    public class StockConfig
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid ProductoId { get; set; }
        public Producto? Producto { get; set; }

        [Required]
        public Guid SucursalId { get; set; }
        public Sucursal? Sucursal { get; set; }

        public int StockMinimo { get; set; } = 0;

        public int StockMaximo { get; set; } = 0;

        [MaxLength(100)]
        public string? Ubicacion { get; set; }
    }
}