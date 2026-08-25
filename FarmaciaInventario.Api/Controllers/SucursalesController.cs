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
    public class SucursalesController : ControllerBase
    {
        private readonly FarmaciaDbContext _context;

        public SucursalesController(FarmaciaDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Sucursal>>> GetSucursales()
        {
            var sucursales = await _context.Sucursales
                .Where(s => s.Activa)
                .OrderBy(s => s.Nombre)
                .ToListAsync();

            return Ok(sucursales);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Sucursal>> GetSucursal(Guid id)
        {
            var sucursal = await _context.Sucursales.FindAsync(id);

            if (sucursal == null)
            {
                return NotFound(new { mensaje = "Sucursal no encontrada" });
            }

            return Ok(sucursal);
        }

        [HttpPost]
        public async Task<ActionResult<Sucursal>> CrearSucursal(Sucursal sucursal)
        {
            sucursal.Id = Guid.NewGuid();
            sucursal.CreadoEn = DateTime.UtcNow;
            sucursal.ActualizadoEn = DateTime.UtcNow;

            _context.Sucursales.Add(sucursal);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetSucursal), new { id = sucursal.Id }, sucursal);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> ActualizarSucursal(Guid id, Sucursal sucursal)
        {
            if (id != sucursal.Id)
            {
                return BadRequest(new { mensaje = "El id de la ruta no coincide con el de la sucursal" });
            }

            var existente = await _context.Sucursales.FindAsync(id);
            if (existente == null)
            {
                return NotFound(new { mensaje = "Sucursal no encontrada" });
            }

            existente.Nombre = sucursal.Nombre;
            existente.Direccion = sucursal.Direccion;
            existente.Telefono = sucursal.Telefono;
            existente.ActualizadoEn = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DesactivarSucursal(Guid id)
        {
            var sucursal = await _context.Sucursales.FindAsync(id);
            if (sucursal == null)
            {
                return NotFound(new { mensaje = "Sucursal no encontrada" });
            }

            sucursal.Activa = false;
            sucursal.ActualizadoEn = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}