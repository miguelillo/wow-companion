namespace WowCompanion.Api.Blizzard;

/// <summary>
/// Credentials and namespace for the Blizzard Game Data API.
/// </summary>
/// <remarks>
/// The namespace is configuration, not a constant, because Blizzard has not published one
/// for World of Warcraft: Forever yet. Until it does, point <see cref="DynamicNamespace"/>
/// at a Classic flavour to exercise the pipeline, and revisit it when the real one lands.
/// Realm status lives in the dynamic namespace, not the static one.
/// </remarks>
public sealed class BlizzardOptions
{
    public const string SectionName = "Blizzard";

    /// <summary>Name of the shared HttpClient registration used for every Blizzard call.</summary>
    public const string HttpClientName = "blizzard";

    public string ClientId { get; set; } = string.Empty;

    public string ClientSecret { get; set; } = string.Empty;

    public string Region { get; set; } = "eu";

    public string DynamicNamespace { get; set; } = "dynamic-classic1x-eu";

    public string Locale { get; set; } = "es_ES";

    /// <summary>How long a successful answer is served before we ask Blizzard again.</summary>
    public int CacheMinutes { get; set; } = 5;

    /// <summary>Upper bound on connected realms fetched in one pass, so one call cannot run away.</summary>
    public int MaxConnectedRealms { get; set; } = 120;

    /// <summary>Without credentials the endpoint reports no data instead of failing loudly.</summary>
    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(ClientId) && !string.IsNullOrWhiteSpace(ClientSecret);

    public string ApiBaseUrl => $"https://{Region}.api.blizzard.com/";
}
