using WowCompanion.Api.Blizzard;

namespace WowCompanion.Api.Endpoints;

public static class RealmStatusEndpoints
{
    /// <summary>
    /// Realm status for the home page card and the status page. Answers 503 when there is
    /// nothing to report, which is what the browser expects: the card then says so and the
    /// page around it is already drawn.
    /// </summary>
    public static IEndpointRouteBuilder MapRealmStatusEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/realm-status", async (
            RealmStatusCache cache,
            CancellationToken cancellationToken) =>
        {
            var status = await cache.GetAsync(cancellationToken).ConfigureAwait(false);

            return status is null
                ? Results.StatusCode(StatusCodes.Status503ServiceUnavailable)
                : Results.Json(status);
        });

        return app;
    }
}
