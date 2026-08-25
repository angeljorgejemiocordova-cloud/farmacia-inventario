using System.ComponentModel.DataAnnotations;
using FarmaciaInventario.Api.Enums;

namespace FarmaciaInventario.Api.Models
{
    public class Usuario
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        // NULL significa que el usuario tiene acceso a todas las sucursales (administrador)
        public Guid? SucursalId { get; set; }
        public Sucursal? Sucursal { get; set; }

        [Required]
        [MaxLength(150)]
        public string NombreCompleto { get; set; } = string.Empty;

        [Required]
        [MaxLength(150)]
        public string Correo { get; set; } = string.Empty;

        [Required]
        public string ContrasenaHash { get; set; } = string.Empty;

        public RolUsuario Rol { get; set; } = RolUsuario.Auxiliar;

        public bool Activo { get; set; } = true;

        public DateTime? UltimoAcceso { get; set; }

        public DateTime CreadoEn { get; set; } = DateTime.UtcNow;

        public DateTime ActualizadoEn { get; set; } = DateTime.UtcNow;
    }
}