using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FarmaciaInventario.Api.Data;
using FarmaciaInventario.Api.Models;

namespace FarmaciaInventario.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/v1/[controller]")]
    public class ProveedoresController : ControllerBase
    {
        private readonly FarmaciaDbContext _context;

        public ProveedoresController(FarmaciaDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Proveedor>>> GetProveedores()
        {
            var proveedores = await _context.Proveedores
                .Where(p => p.Activo)
                .OrderBy(p => p.Nombre)
                .ToListAsync();

            return Ok(proveedores);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Proveedor>> GetProveedor(Guid id)
        {
            var proveedor = await _context.Proveedores.FindAsync(id);
            if (proveedor == null) return NotFound(new { mensaje = "Proveedor no encontrado" });
            return Ok(proveedor);
        }

        [HttpPost]
        public async Task<ActionResult<Proveedor>> CrearProveedor(Proveedor proveedor)
        {
            proveedor.Id = Guid.NewGuid();
            proveedor.CreadoEn = DateTime.UtcNow;
            proveedor.Activo = true;

            _context.Proveedores.Add(proveedor);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetProveedor), new { id = proveedor.Id }, proveedor);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> ActualizarProveedor(Guid id, Proveedor proveedor)
        {
            var existente = await _context.Proveedores.FindAsync(id);
            if (existente == null) return NotFound(new { mensaje = "Proveedor no encontrado" });

            existente.Nombre = proveedor.Nombre;
            existente.Contacto = proveedor.Contacto;
            existente.Telefono = proveedor.Telefono;
            existente.Correo = proveedor.Correo;
            existente.Direccion = proveedor.Direccion;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DesactivarProveedor(Guid id)
        {
            var proveedor = await _context.Proveedores.FindAsync(id);
            if (proveedor == null) return NotFound(new { mensaje = "Proveedor no encontrado" });

            proveedor.Activo = false;
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}