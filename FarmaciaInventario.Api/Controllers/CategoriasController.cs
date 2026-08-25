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
    public class CategoriasController : ControllerBase
    {
        private readonly FarmaciaDbContext _context;

        public CategoriasController(FarmaciaDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Categoria>>> GetCategorias()
        {
            var categorias = await _context.Categorias.OrderBy(c => c.Nombre).ToListAsync();
            return Ok(categorias);
        }

        [HttpPost]
        public async Task<ActionResult<Categoria>> CrearCategoria(Categoria categoria)
        {
            categoria.Id = Guid.NewGuid();
            _context.Categorias.Add(categoria);
            await _context.SaveChangesAsync();
            return Ok(categoria);
        }
    }
}