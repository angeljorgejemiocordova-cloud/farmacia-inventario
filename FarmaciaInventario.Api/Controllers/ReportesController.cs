using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FarmaciaInventario.Api.Data;
using FarmaciaInventario.Api.Enums;

namespace FarmaciaInventario.Api.Controllers
{
    public record MovimientoKardex(
        DateTime Fecha,
        string TipoMovimiento,
        int Cantidad,
        string NumeroLote,
        string? Motivo,
        string? Referencia,
        string? Usuario
    );

    public record ValorProducto(
        Guid ProductoId,
        string ProductoNombre,
        int CantidadTotal,
        decimal ValorTotal
    );

    public record InventarioValorizadoResponse(
        decimal ValorTotalInventario,
        List<ValorProducto> Detalle
    );

    public record StockPorSucursal(Guid SucursalId, string SucursalNombre, int StockTotal);

    public record ComparativoProducto(
        Guid ProductoId,
        string ProductoNombre,
        List<StockPorSucursal> StockPorSucursal
    );

    [Authorize]
    [ApiController]
    [Route("api/v1/reportes")]
    public class ReportesController : ControllerBase
    {
        private readonly FarmaciaDbContext _context;

        public ReportesController(FarmaciaDbContext context)
        {
            _context = context;
        }

        [HttpGet("kardex/{productoId}")]
        public async Task<ActionResult<IEnumerable<MovimientoKardex>>> GetKardex(
            Guid productoId, [FromQuery] Guid? sucursalId)
        {
            var query = _context.Movimientos
                .Include(m => m.Lote)
                .Include(m => m.Usuario)
                .Where(m => m.Lote!.ProductoId == productoId);

            if (sucursalId.HasValue)
                query = query.Where(m => m.Lote!.SucursalId == sucursalId.Value);

            var movimientos = await query
                .OrderByDescending(m => m.Fecha)
                .Select(m => new MovimientoKardex(
                    m.Fecha,
                    m.Tipo.ToString(),
                    m.Cantidad,
                    m.Lote!.NumeroLote,
                    m.Motivo,
                    m.Referencia,
                    m.Usuario != null ? m.Usuario.NombreCompleto : null
                ))
                .ToListAsync();

            return Ok(movimientos);
        }

        [HttpGet("inventario-valorizado")]
        public async Task<ActionResult<InventarioValorizadoResponse>> GetInventarioValorizado(
            [FromQuery] Guid? sucursalId)
        {
            var query = _context.Lotes
                .Include(l => l.Producto)
                .Where(l => l.Estado == EstadoLote.Activo && l.CantidadActual > 0);

            if (sucursalId.HasValue)
                query = query.Where(l => l.SucursalId == sucursalId.Value);

            var lotes = await query.ToListAsync();

            var detalle = lotes
                .GroupBy(l => new { l.ProductoId, Nombre = l.Producto!.Nombre })
                .Select(g => new ValorProducto(
                    g.Key.ProductoId,
                    g.Key.Nombre,
                    g.Sum(l => l.CantidadActual),
                    g.Sum(l => l.CantidadActual * l.CostoUnitario)
                ))
                .OrderByDescending(v => v.ValorTotal)
                .ToList();

            var valorTotal = detalle.Sum(d => d.ValorTotal);

            return Ok(new InventarioValorizadoResponse(valorTotal, detalle));
        }

        [HttpGet("comparativo-sucursales")]
        public async Task<ActionResult<IEnumerable<ComparativoProducto>>> GetComparativoSucursales()
        {
            var lotes = await _context.Lotes
                .Include(l => l.Producto)
                .Include(l => l.Sucursal)
                .Where(l => l.Estado == EstadoLote.Activo && l.CantidadActual > 0)
                .ToListAsync();

            var comparativo = lotes
                .GroupBy(l => new { l.ProductoId, Nombre = l.Producto!.Nombre })
                .Select(g => new ComparativoProducto(
                    g.Key.ProductoId,
                    g.Key.Nombre,
                    g.GroupBy(l => new { l.SucursalId, SNombre = l.Sucursal!.Nombre })
                     .Select(sg => new StockPorSucursal(
                         sg.Key.SucursalId, sg.Key.SNombre, sg.Sum(l => l.CantidadActual)))
                     .OrderByDescending(s => s.StockTotal)
                     .ToList()
                ))
                .OrderBy(c => c.ProductoNombre)
                .ToList();

            return Ok(comparativo);
        }
    }
}