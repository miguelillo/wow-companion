namespace WowCompanion.Api.Endpoints;

public static class HealthEndpoints
{
    /// <summary>
    /// Liveness probe for the reverse proxy and for docker-compose. Everything the API
    /// serves lives under /api/ so the proxy can route by prefix without rewriting paths.
    /// </summary>
    public static IEndpointRouteBuilder MapHealthEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/health", () => Results.Json(new
        {
            status = "ok",
            utc = DateTimeOffset.UtcNow
        }));

        return app;
    }
}
