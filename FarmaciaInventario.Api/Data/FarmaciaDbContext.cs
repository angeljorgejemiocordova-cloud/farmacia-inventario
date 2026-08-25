using Microsoft.EntityFrameworkCore;
using FarmaciaInventario.Api.Models;

namespace FarmaciaInventario.Api.Data
{
    public class FarmaciaDbContext : DbContext
    {
        public FarmaciaDbContext(DbContextOptions<FarmaciaDbContext> options) : base(options) { }

        public DbSet<Sucursal> Sucursales => Set<Sucursal>();
        public DbSet<Usuario> Usuarios => Set<Usuario>();
        public DbSet<Proveedor> Proveedores => Set<Proveedor>();
        public DbSet<Categoria> Categorias => Set<Categoria>();
        public DbSet<Producto> Productos => Set<Producto>();
        public DbSet<Lote> Lotes => Set<Lote>();
        public DbSet<Movimiento> Movimientos => Set<Movimiento>();
        public DbSet<StockConfig> StockConfigs => Set<StockConfig>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ---- Usuarios ----
            modelBuilder.Entity<Usuario>()
                .HasIndex(u => u.Correo)
                .IsUnique();

            modelBuilder.Entity<Usuario>()
                .HasOne(u => u.Sucursal)
                .WithMany()
                .HasForeignKey(u => u.SucursalId)
                .OnDelete(DeleteBehavior.SetNull);

            // ---- Productos ----
            modelBuilder.Entity<Producto>()
                .HasIndex(p => p.CodigoBarras)
                .IsUnique();

            modelBuilder.Entity<Producto>()
                .HasOne(p => p.Categoria)
                .WithMany()
                .HasForeignKey(p => p.CategoriaId)
                .OnDelete(DeleteBehavior.SetNull);

            // ---- StockConfig ----
            modelBuilder.Entity<StockConfig>()
                .HasIndex(sc => new { sc.ProductoId, sc.SucursalId })
                .IsUnique();

            modelBuilder.Entity<StockConfig>()
                .HasOne(sc => sc.Producto)
                .WithMany()
                .HasForeignKey(sc => sc.ProductoId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<StockConfig>()
                .HasOne(sc => sc.Sucursal)
                .WithMany()
                .HasForeignKey(sc => sc.SucursalId)
                .OnDelete(DeleteBehavior.Cascade);

            // ---- Lotes ----
            modelBuilder.Entity<Lote>()
                .HasOne(l => l.Producto)
                .WithMany()
                .HasForeignKey(l => l.ProductoId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Lote>()
                .HasOne(l => l.Sucursal)
                .WithMany()
                .HasForeignKey(l => l.SucursalId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Lote>()
                .HasOne(l => l.Proveedor)
                .WithMany()
                .HasForeignKey(l => l.ProveedorId)
                .OnDelete(DeleteBehavior.SetNull);

            // Índices clave para las alertas de caducidad y el cálculo de stock
            modelBuilder.Entity<Lote>()
                .HasIndex(l => l.FechaCaducidad);

            modelBuilder.Entity<Lote>()
                .HasIndex(l => new { l.ProductoId, l.SucursalId });

            // ---- Movimientos ----
            modelBuilder.Entity<Movimiento>()
                .HasOne(m => m.Lote)
                .WithMany()
                .HasForeignKey(m => m.LoteId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Movimiento>()
                .HasOne(m => m.Usuario)
                .WithMany()
                .HasForeignKey(m => m.UsuarioId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Movimiento>()
                .HasIndex(m => m.Fecha);
        }
    }
}