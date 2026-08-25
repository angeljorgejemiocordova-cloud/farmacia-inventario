using System.ComponentModel.DataAnnotations;

namespace FarmaciaInventario.Api.Models
{
    public class Sucursal
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [MaxLength(150)]
        public string Nombre { get; set; } = string.Empty;

        [MaxLength(255)]
        public string? Direccion { get; set; }

        [MaxLength(30)]
        public string? Telefono { get; set; }

        public bool Activa { get; set; } = true;

        public DateTime CreadoEn { get; set; } = DateTime.UtcNow;

        public DateTime ActualizadoEn { get; set; } = DateTime.UtcNow;
    }
}