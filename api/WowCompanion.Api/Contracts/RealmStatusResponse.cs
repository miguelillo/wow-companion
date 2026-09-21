namespace WowCompanion.Api.Contracts;

/// <summary>
/// What the browser receives from /api/realm-status. The web validates this shape before
/// drawing the card, so the property names here are part of the contract.
/// </summary>
/// <param name="UpdatedAt">
/// ISO 8601 in UTC with a trailing Z. Formatted as a string on purpose: the web parses it
/// with a schema that rejects a numeric offset.
/// </param>
public sealed record RealmStatusResponse(string UpdatedAt, IReadOnlyList<RealmStatusEntry> Realms);

/// <param name="Population">"low", "medium", "high", "full", or null when Blizzard omits it.</param>
public sealed record RealmStatusEntry(
    string Name,
    string Slug,
    string Region,
    bool Online,
    string? Population,
    bool HasQueue);
