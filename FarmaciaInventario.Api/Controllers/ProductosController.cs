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
    public class ProductosController : ControllerBase
    {
        private readonly FarmaciaDbContext _context;

        public ProductosController(FarmaciaDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Producto>>> GetProductos([FromQuery] string? search)
        {
            var query = _context.Productos.Where(p => p.Activo);

            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(p => p.Nombre.Contains(search));
            }

            var productos = await query.OrderBy(p => p.Nombre).ToListAsync();
            return Ok(productos);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Producto>> GetProducto(Guid id)
        {
            var producto = await _context.Productos.FindAsync(id);

            if (producto == null)
            {
                return NotFound(new { mensaje = "Producto no encontrado" });
            }

            return Ok(producto);
        }
// GET: api/v1/productos/buscar-codigo/{codigo}
[HttpGet("buscar-codigo/{codigo}")]
public async Task<ActionResult<Producto>> BuscarPorCodigoBarras(string codigo)
{
    var producto = await _context.Productos
        .FirstOrDefaultAsync(p => p.CodigoBarras == codigo && p.Activo);

    if (producto == null)
    {
        return NotFound(new { mensaje = "No existe un producto con ese código de barras" });
    }

    return Ok(producto);
}

        [HttpPost]
        public async Task<ActionResult<Producto>> CrearProducto(Producto producto)
        {
            producto.Id = Guid.NewGuid();
            producto.CreadoEn = DateTime.UtcNow;
            producto.ActualizadoEn = DateTime.UtcNow;

            _context.Productos.Add(producto);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetProducto), new { id = producto.Id }, producto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> ActualizarProducto(Guid id, Producto producto)
        {
            if (id != producto.Id)
            {
                return BadRequest(new { mensaje = "El id de la ruta no coincide con el del producto" });
            }

            var existente = await _context.Productos.FindAsync(id);
            if (existente == null)
            {
                return NotFound(new { mensaje = "Producto no encontrado" });
            }

            existente.Nombre = producto.Nombre;
            existente.PrincipioActivo = producto.PrincipioActivo;
            existente.Presentacion = producto.Presentacion;
            existente.UnidadMedida = producto.UnidadMedida;
            existente.Laboratorio = producto.Laboratorio;
            existente.RequiereReceta = producto.RequiereReceta;
            existente.PrecioVenta = producto.PrecioVenta;
            existente.CategoriaId = producto.CategoriaId;
            existente.CodigoBarras = producto.CodigoBarras;
            existente.ActualizadoEn = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DesactivarProducto(Guid id)
        {
            var producto = await _context.Productos.FindAsync(id);
            if (producto == null)
            {
                return NotFound(new { mensaje = "Producto no encontrado" });
            }

            producto.Activo = false;
            producto.ActualizadoEn = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}