using System.ComponentModel.DataAnnotations;

namespace FarmaciaInventario.Api.Models
{
    public class Proveedor
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [MaxLength(150)]
        public string Nombre { get; set; } = string.Empty;

        [MaxLength(150)]
        public string? Contacto { get; set; }

        [MaxLength(30)]
        public string? Telefono { get; set; }

        [MaxLength(150)]
        public string? Correo { get; set; }

        [MaxLength(255)]
        public string? Direccion { get; set; }

        public bool Activo { get; set; } = true;

        public DateTime CreadoEn { get; set; } = DateTime.UtcNow;
    }
}