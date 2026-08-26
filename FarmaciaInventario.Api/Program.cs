using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using FarmaciaInventario.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// ---- Base de datos ----
var connectionString = Environment.GetEnvironmentVariable("DATABASE_URL")
    ?? builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<FarmaciaInventario.Api.Data.FarmaciaDbContext>(options =>
    options.UseNpgsql(connectionString));

// ---- Servicios propios ----
builder.Services.AddScoped<TokenService>();
builder.Services.AddHttpClient();

// ---- CORS: permite que el frontend (localhost:5173) llame a esta API ----
builder.Services.AddCors(options =>
{
        options.AddPolicy("FrontendDev", policy =>
    {
        var origenesPermitidos = new List<string> { "http://localhost:5173" };
        var origenProduccion = Environment.GetEnvironmentVariable("FRONTEND_URL");
        if (!string.IsNullOrEmpty(origenProduccion))
        {
            origenesPermitidos.Add(origenProduccion);
        }

        policy.WithOrigins(origenesPermitidos.ToArray())
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// ---- Autenticación JWT ----
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    var jwtKey = Environment.GetEnvironmentVariable("JWT_KEY") ?? builder.Configuration["Jwt:Key"]!;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidateAudience = false,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});

builder.Services.AddAuthorization();

// ---- Controladores ----
builder.Services.AddControllers();
builder.Services.AddOpenApi();

// ---- Swagger, con soporte para pegar el token JWT ----
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "Pega aquí SOLO el token (sin la palabra 'Bearer' delante)",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });

    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new List<string>()
        }
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// IMPORTANTE: UseCors debe ir ANTES de UseAuthentication/UseAuthorization
app.UseCors("FrontendDev");

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();