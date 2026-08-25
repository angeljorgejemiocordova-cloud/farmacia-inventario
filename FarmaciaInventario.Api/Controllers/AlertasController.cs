using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FarmaciaInventario.Api.Data;
using FarmaciaInventario.Api.Enums;

namespace FarmaciaInventario.Api.Controllers
{
    public static class UmbralesAlerta
    {
        public const int DiasCritico = 30;
        public const int DiasAdvertencia = 90;
    }

    public record AlertaCaducidad(
        Guid LoteId,
        string NumeroLote,
        Guid ProductoId,
        string ProductoNombre,
        Guid SucursalId,
        string SucursalNombre,
        DateOnly FechaCaducidad,
        int CantidadActual,
        int DiasRestantes,
        string NivelAlerta
    );

    public record AlertaStock(
        Guid ProductoId,
        string ProductoNombre,
        Guid SucursalId,
        string SucursalNombre,
        int StockActual,
        int StockMinimo,
        int StockMaximo,
        string TipoAlerta
    );

    public record ResumenAlertas(
        int LotesVencidos,
        int LotesCriticos,
        int LotesAdvertencia,
        int ProductosBajoMinimo,
        int ProductosSobreMaximo
    );

    [Authorize]
    [ApiController]
    [Route("api/v1/alertas")]
    public class AlertasController : ControllerBase
    {
        private readonly FarmaciaDbContext _context;

        public AlertasController(FarmaciaDbContext context)
        {
            _context = context;
        }

        [HttpGet("caducidad")]
        public async Task<ActionResult<IEnumerable<AlertaCaducidad>>> GetAlertasCaducidad(
            [FromQuery] Guid? sucursalId,
            [FromQuery] string? nivel)
        {
            var hoy = DateOnly.FromDateTime(DateTime.UtcNow);

            var query = _context.Lotes
                .Include(l => l.Producto)
                .Include(l => l.Sucursal)
                .Where(l => l.Estado == EstadoLote.Activo && l.CantidadActual > 0);

            if (sucursalId.HasValue)
                query = query.Where(l => l.SucursalId == sucursalId.Value);

            var lotes = await query.OrderBy(l => l.FechaCaducidad).ToListAsync();

            var alertas = lotes.Select(l =>
            {
                var diasRestantes = l.FechaCaducidad.DayNumber - hoy.DayNumber;
                var nivelCalculado = diasRestantes < 0 ? "vencido"
                    : diasRestantes <= UmbralesAlerta.DiasCritico ? "critico"
                    : diasRestantes <= UmbralesAlerta.DiasAdvertencia ? "advertencia"
                    : "normal";

                return new AlertaCaducidad(
                    l.Id, l.NumeroLote, l.ProductoId, l.Producto!.Nombre,
                    l.SucursalId, l.Sucursal!.Nombre, l.FechaCaducidad,
                    l.CantidadActual, diasRestantes, nivelCalculado);
            })
            .Where(a => a.NivelAlerta != "normal");

            if (!string.IsNullOrWhiteSpace(nivel))
                alertas = alertas.Where(a => a.NivelAlerta == nivel);

            return Ok(alertas.ToList());
        }

        [HttpGet("stock")]
        public async Task<ActionResult<IEnumerable<AlertaStock>>> GetAlertasStock([FromQuery] Guid? sucursalId)
        {
            var stockQuery = _context.Lotes
                .Where(l => l.Estado == EstadoLote.Activo)
                .GroupBy(l => new { l.ProductoId, l.SucursalId })
                .Select(g => new
                {
                    g.Key.ProductoId,
                    g.Key.SucursalId,
                    StockActual = g.Sum(l => l.CantidadActual)
                });

            if (sucursalId.HasValue)
                stockQuery = stockQuery.Where(s => s.SucursalId == sucursalId.Value);

            var stockActual = await stockQuery.ToListAsync();

            var configuraciones = await _context.StockConfigs.ToListAsync();
            var productos = await _context.Productos.ToDictionaryAsync(p => p.Id, p => p.Nombre);
            var sucursales = await _context.Sucursales.ToDictionaryAsync(s => s.Id, s => s.Nombre);

            var alertas = new List<AlertaStock>();

            foreach (var stock in stockActual)
            {
                var config = configuraciones.FirstOrDefault(c =>
                    c.ProductoId == stock.ProductoId && c.SucursalId == stock.SucursalId);

                if (config == null) continue;

                string? tipoAlerta = null;
                if (config.StockMinimo > 0 && stock.StockActual < config.StockMinimo)
                    tipoAlerta = "bajo_minimo";
                else if (config.StockMaximo > 0 && stock.StockActual > config.StockMaximo)
                    tipoAlerta = "sobre_maximo";

                if (tipoAlerta != null)
                {
                    alertas.Add(new AlertaStock(
                        stock.ProductoId, productos.GetValueOrDefault(stock.ProductoId, "?"),
                        stock.SucursalId, sucursales.GetValueOrDefault(stock.SucursalId, "?"),
                        stock.StockActual, config.StockMinimo, config.StockMaximo, tipoAlerta));
                }
            }

            return Ok(alertas);
        }

        [HttpGet("resumen")]
        public async Task<ActionResult<ResumenAlertas>> GetResumen()
        {
            var caducidadResult = await GetAlertasCaducidad(null, null);
            var caducidad = (caducidadResult.Result as OkObjectResult)?.Value as List<AlertaCaducidad> ?? new();

            var stockResult = await GetAlertasStock(null);
            var stock = (stockResult.Result as OkObjectResult)?.Value as List<AlertaStock> ?? new();

            return Ok(new ResumenAlertas(
                LotesVencidos: caducidad.Count(a => a.NivelAlerta == "vencido"),
                LotesCriticos: caducidad.Count(a => a.NivelAlerta == "critico"),
                LotesAdvertencia: caducidad.Count(a => a.NivelAlerta == "advertencia"),
                ProductosBajoMinimo: stock.Count(a => a.TipoAlerta == "bajo_minimo"),
                ProductosSobreMaximo: stock.Count(a => a.TipoAlerta == "sobre_maximo")
            ));
        }
    }
}