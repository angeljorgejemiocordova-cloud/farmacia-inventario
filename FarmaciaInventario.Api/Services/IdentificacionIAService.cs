using System.Text;
using System.Text.Json;

namespace FarmaciaInventario.Api.Services
{
    public record ProductoIdentificado(
        string? Nombre,
        string? PrincipioActivo,
        string? Concentracion,
        string? FormaFarmaceutica,
        string? Laboratorio,
        string? Presentacion,
        string? CategoriaTerapeutica,
        bool RequiereRecetaSugerido,
        string? FechaCaducidadDetectada
    );

    public class IdentificacionIAService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;

        public IdentificacionIAService(IHttpClientFactory httpClientFactory, IConfiguration configuration)
        {
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
        }

        public async Task<ProductoIdentificado?> IdentificarDesdeImagenAsync(string imagenBase64)
        {
            var apiKey = Environment.GetEnvironmentVariable("GEMINI_API_KEY")
                ?? _configuration["Gemini:ApiKey"];

            if (string.IsNullOrEmpty(apiKey))
            {
                throw new InvalidOperationException("No se configuró la clave de API de Gemini");
            }

            var cliente = _httpClientFactory.CreateClient();
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={apiKey}";

            // Instrucciones estrictas: SOLO extraer texto impreso visible en el empaque.
            // Nunca sugerir dosis, usos clínicos, ni ningún consejo médico.
            var prompt = @"Eres un asistente que solo lee texto IMPRESO en el empaque de un producto
farmacéutico a partir de una foto. Tu única tarea es transcribir la información que ya está
escrita en la caja -- no debes sugerir dosis, indicaciones de uso, ni ningún consejo médico.

Devuelve EXCLUSIVAMENTE un JSON válido (sin texto adicional, sin markdown) con esta forma exacta:
{
  ""nombre"": ""nombre comercial del producto tal como aparece impreso"",
  ""principioActivo"": ""principio(s) activo(s) impreso(s), o null si no es visible"",
  ""concentracion"": ""ej. 30 mg, o null"",
  ""formaFarmaceutica"": ""ej. tabletas, jarabe, ampolla, o null"",
  ""laboratorio"": ""marca o fabricante impreso, o null"",
  ""presentacion"": ""ej. Caja x 10 tabletas, o null"",
  ""categoriaTerapeutica"": ""ej. Analgésico, Antibiótico -- solo si está impreso explícitamente, si no, null"",
  ""requiereRecetaSugerido"": true o false (según si la caja indica 'venta bajo receta' o similar; false si no hay indicación),
  ""fechaCaducidadDetectada"": ""formato YYYY-MM-DD si se ve una fecha de vencimiento impresa, o null""
}

Si no puedes leer la imagen con claridad, usa null en los campos que no puedas confirmar.
No inventes información que no esté impresa literalmente en el empaque.";

            var cuerpoSolicitud = new
            {
                contents = new object[]
                {
                    new
                    {
                        parts = new object[]
                        {
                            new { text = prompt },
                            new
                            {
                                inline_data = new
                                {
                                    mime_type = "image/jpeg",
                                    data = imagenBase64
                                }
                            }
                        }
                    }
                },
                generationConfig = new
                {
                    temperature = 0.1, // baja temperatura: queremos lectura fiel, no creatividad
                    responseMimeType = "application/json"
                }
            };

            var json = JsonSerializer.Serialize(cuerpoSolicitud);
            var contenido = new StringContent(json, Encoding.UTF8, "application/json");

            var respuesta = await cliente.PostAsync(url, contenido);
            var textoRespuesta = await respuesta.Content.ReadAsStringAsync();

            if (!respuesta.IsSuccessStatusCode)
            {
                throw new Exception($"Error consultando Gemini: {textoRespuesta}");
            }

            using var documento = JsonDocument.Parse(textoRespuesta);
            var textoGenerado = documento.RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString();

            if (string.IsNullOrEmpty(textoGenerado))
            {
                return null;
            }

            return JsonSerializer.Deserialize<ProductoIdentificado>(
                textoGenerado,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
            );
        }
    }
}