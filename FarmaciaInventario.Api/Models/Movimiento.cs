using System.ComponentModel.DataAnnotations;
using FarmaciaInventario.Api.Enums;

namespace FarmaciaInventario.Api.Models
{
    public class Movimiento
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid LoteId { get; set; }
        public Lote? Lote { get; set; }

        public Guid? UsuarioId { get; set; }
        public Usuario? Usuario { get; set; }

        [Required]
        public TipoMovimiento Tipo { get; set; }

        [Required]
        public int Cantidad { get; set; }

        [MaxLength(255)]
        public string? Motivo { get; set; }

        [MaxLength(100)]
        public string? Referencia { get; set; }

        public DateTime Fecha { get; set; } = DateTime.UtcNow;
    }
}