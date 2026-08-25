using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FarmaciaInventario.Api.Data;
using FarmaciaInventario.Api.Models;
using FarmaciaInventario.Api.Enums;

namespace FarmaciaInventario.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/v1/[controller]")]
    public class LotesController : ControllerBase
    {
        private readonly FarmaciaDbContext _context;

        public LotesController(FarmaciaDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Lote>>> GetLotes(
            [FromQuery] Guid? sucursalId,
            [FromQuery] Guid? productoId)
        {
            var query = _context.Lotes
                .Include(l => l.Producto)
                .Include(l => l.Sucursal)
                .Where(l => l.Estado == EstadoLote.Activo);

            if (sucursalId.HasValue)
                query = query.Where(l => l.SucursalId == sucursalId.Value);

            if (productoId.HasValue)
                query = query.Where(l => l.ProductoId == productoId.Value);

            var lotes = await query.OrderBy(l => l.FechaCaducidad).ToListAsync();
            return Ok(lotes);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Lote>> GetLote(Guid id)
        {
            var lote = await _context.Lotes
                .Include(l => l.Producto)
                .Include(l => l.Sucursal)
                .Include(l => l.Proveedor)
                .FirstOrDefaultAsync(l => l.Id == id);

            if (lote == null)
            {
                return NotFound(new { mensaje = "Lote no encontrado" });
            }

            return Ok(lote);
        }

        [HttpPost]
        public async Task<ActionResult<Lote>> CrearLote(Lote lote)
        {
            var productoExiste = await _context.Productos.AnyAsync(p => p.Id == lote.ProductoId);
            if (!productoExiste)
            {
                return BadRequest(new { mensaje = "El producto especificado no existe" });
            }

            var sucursalExiste = await _context.Sucursales.AnyAsync(s => s.Id == lote.SucursalId);
            if (!sucursalExiste)
            {
                return BadRequest(new { mensaje = "La sucursal especificada no existe" });
            }

            if (lote.FechaCaducidad <= lote.FechaIngreso)
            {
                return BadRequest(new { mensaje = "La fecha de caducidad debe ser posterior a la fecha de ingreso" });
            }

            lote.Id = Guid.NewGuid();
            lote.CantidadActual = lote.CantidadInicial;
            lote.Estado = EstadoLote.Activo;
            lote.CreadoEn = DateTime.UtcNow;
            lote.ActualizadoEn = DateTime.UtcNow;

            _context.Lotes.Add(lote);

            var movimientoInicial = new Movimiento
            {
                Id = Guid.NewGuid(),
                LoteId = lote.Id,
                Tipo = TipoMovimiento.Entrada,
                Cantidad = lote.CantidadInicial,
                Motivo = "Registro inicial de lote",
                Fecha = DateTime.UtcNow
            };
            _context.Movimientos.Add(movimientoInicial);

            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetLote), new { id = lote.Id }, lote);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> ActualizarLote(Guid id, Lote lote)
        {
            if (id != lote.Id)
            {
                return BadRequest(new { mensaje = "El id de la ruta no coincide con el del lote" });
            }

            var existente = await _context.Lotes.FindAsync(id);
            if (existente == null)
            {
                return NotFound(new { mensaje = "Lote no encontrado" });
            }

            existente.NumeroLote = lote.NumeroLote;
            existente.FechaCaducidad = lote.FechaCaducidad;
            existente.CostoUnitario = lote.CostoUnitario;
            existente.ProveedorId = lote.ProveedorId;
            existente.ActualizadoEn = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}