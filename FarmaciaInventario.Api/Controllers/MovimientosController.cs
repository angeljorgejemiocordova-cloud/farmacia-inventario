using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FarmaciaInventario.Api.Data;
using FarmaciaInventario.Api.Models;
using FarmaciaInventario.Api.Enums;

namespace FarmaciaInventario.Api.Controllers
{
    public record SalidaRequest(
        Guid ProductoId,
        Guid SucursalId,
        int Cantidad,
        string? Motivo,
        string? Referencia
    );

    public record DetalleLoteAfectado(Guid LoteId, string NumeroLote, DateOnly FechaCaducidad, int CantidadDescontada);
    public record SalidaResponse(int CantidadTotalSolicitada, List<DetalleLoteAfectado> LotesAfectados);

    [Authorize]
    [ApiController]
    [Route("api/v1/movimientos")]
    public class MovimientosController : ControllerBase
    {
        private readonly FarmaciaDbContext _context;

        public MovimientosController(FarmaciaDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Movimiento>>> GetMovimientos(
            [FromQuery] Guid? loteId,
            [FromQuery] DateTime? desde,
            [FromQuery] DateTime? hasta)
        {
            var query = _context.Movimientos.AsQueryable();

            if (loteId.HasValue)
                query = query.Where(m => m.LoteId == loteId.Value);

            if (desde.HasValue)
                query = query.Where(m => m.Fecha >= desde.Value);

            if (hasta.HasValue)
                query = query.Where(m => m.Fecha <= hasta.Value);

            var movimientos = await query.OrderByDescending(m => m.Fecha).ToListAsync();
            return Ok(movimientos);
        }

        [HttpPost("salida")]
        public async Task<ActionResult<SalidaResponse>> RegistrarSalida(SalidaRequest request)
        {
            if (request.Cantidad <= 0)
            {
                return BadRequest(new { mensaje = "La cantidad debe ser mayor a cero" });
            }

            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var lotesDisponibles = await _context.Lotes
                    .Where(l => l.ProductoId == request.ProductoId
                             && l.SucursalId == request.SucursalId
                             && l.Estado == EstadoLote.Activo
                             && l.CantidadActual > 0)
                    .OrderBy(l => l.FechaCaducidad)
                    .ToListAsync();

                var stockTotalDisponible = lotesDisponibles.Sum(l => l.CantidadActual);

                if (stockTotalDisponible < request.Cantidad)
                {
                    return BadRequest(new
                    {
                        mensaje = "Stock insuficiente para completar la salida",
                        stockDisponible = stockTotalDisponible,
                        cantidadSolicitada = request.Cantidad
                    });
                }

                var cantidadRestante = request.Cantidad;
                var lotesAfectados = new List<DetalleLoteAfectado>();

                foreach (var lote in lotesDisponibles)
                {
                    if (cantidadRestante <= 0) break;

                    var cantidadADescontar = Math.Min(lote.CantidadActual, cantidadRestante);

                    lote.CantidadActual -= cantidadADescontar;
                    lote.ActualizadoEn = DateTime.UtcNow;

                    if (lote.CantidadActual == 0)
                    {
                        lote.Estado = EstadoLote.Agotado;
                    }

                    var movimiento = new Movimiento
                    {
                        Id = Guid.NewGuid(),
                        LoteId = lote.Id,
                        Tipo = TipoMovimiento.Salida,
                        Cantidad = cantidadADescontar,
                        Motivo = request.Motivo ?? "Salida de stock",
                        Referencia = request.Referencia,
                        Fecha = DateTime.UtcNow
                    };
                    _context.Movimientos.Add(movimiento);

                    lotesAfectados.Add(new DetalleLoteAfectado(
                        lote.Id, lote.NumeroLote, lote.FechaCaducidad, cantidadADescontar));

                    cantidadRestante -= cantidadADescontar;
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new SalidaResponse(request.Cantidad, lotesAfectados));
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
    }
}