using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FarmaciaInventario.Api.Data;
using FarmaciaInventario.Api.Models;
using FarmaciaInventario.Api.Enums;
using FarmaciaInventario.Api.Services;

namespace FarmaciaInventario.Api.Controllers
{
    public record RegistroRequest(
        string NombreCompleto,
        string Correo,
        string Contrasena,
        RolUsuario Rol,
        Guid? SucursalId
    );

    public record LoginRequest(string Correo, string Contrasena);

    public record AuthResponse(string Token, string NombreCompleto, string Rol);

    [ApiController]
    [Route("api/v1/auth")]
    public class AuthController : ControllerBase
    {
        private readonly FarmaciaDbContext _context;
        private readonly TokenService _tokenService;

        public AuthController(FarmaciaDbContext context, TokenService tokenService)
        {
            _context = context;
            _tokenService = tokenService;
        }

        // POST: api/v1/auth/registro
        [HttpPost("registro")]
        public async Task<ActionResult<AuthResponse>> Registro(RegistroRequest request)
        {
            var correoExiste = await _context.Usuarios.AnyAsync(u => u.Correo == request.Correo);
            if (correoExiste)
            {
                return BadRequest(new { mensaje = "Ya existe un usuario con ese correo" });
            }

            var usuario = new Usuario
            {
                Id = Guid.NewGuid(),
                NombreCompleto = request.NombreCompleto,
                Correo = request.Correo,
                ContrasenaHash = BCrypt.Net.BCrypt.HashPassword(request.Contrasena),
                Rol = request.Rol,
                SucursalId = request.SucursalId,
                Activo = true,
                CreadoEn = DateTime.UtcNow,
                ActualizadoEn = DateTime.UtcNow
            };

            _context.Usuarios.Add(usuario);
            await _context.SaveChangesAsync();

            var token = _tokenService.GenerarToken(usuario);
            return Ok(new AuthResponse(token, usuario.NombreCompleto, usuario.Rol.ToString()));
        }

        // POST: api/v1/auth/login
        [HttpPost("login")]
        public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
        {
            var usuario = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.Correo == request.Correo && u.Activo);

            if (usuario == null || !BCrypt.Net.BCrypt.Verify(request.Contrasena, usuario.ContrasenaHash))
            {
                return Unauthorized(new { mensaje = "Correo o contraseña incorrectos" });
            }

            usuario.UltimoAcceso = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var token = _tokenService.GenerarToken(usuario);
            return Ok(new AuthResponse(token, usuario.NombreCompleto, usuario.Rol.ToString()));
        }
    }
}