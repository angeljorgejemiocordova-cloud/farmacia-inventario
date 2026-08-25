using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FarmaciaInventario.Api.Models
{
    public class Producto
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid? CategoriaId { get; set; }
        public Categoria? Categoria { get; set; }

        [MaxLength(50)]
        public string? CodigoBarras { get; set; }

        [Required]
        [MaxLength(200)]
        public string Nombre { get; set; } = string.Empty;

        [MaxLength(200)]
        public string? PrincipioActivo { get; set; }

        [MaxLength(100)]
        public string? Presentacion { get; set; }

        [Required]
        [MaxLength(30)]
        public string UnidadMedida { get; set; } = string.Empty;

        [MaxLength(150)]
        public string? Laboratorio { get; set; }

        public bool RequiereReceta { get; set; } = false;

        [Column(TypeName = "numeric(10,2)")]
        public decimal PrecioVenta { get; set; } = 0;

        public bool Activo { get; set; } = true;

        public DateTime CreadoEn { get; set; } = DateTime.UtcNow;

        public DateTime ActualizadoEn { get; set; } = DateTime.UtcNow;
    }
}