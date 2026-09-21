using System.Collections.Concurrent;
using System.Globalization;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;
using WowCompanion.Api.Contracts;

namespace WowCompanion.Api.Blizzard;

/// <summary>
/// Reads realm status from the connected-realm endpoints and flattens it into our own
/// contract. Every failure path returns null; the cache decides what to serve instead.
/// </summary>
public sealed class RealmStatusClient
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly BlizzardTokenProvider _tokens;
    private readonly BlizzardOptions _options;
    private readonly ILogger<RealmStatusClient> _logger;

    public RealmStatusClient(
        IHttpClientFactory httpClientFactory,
        BlizzardTokenProvider tokens,
        IOptions<BlizzardOptions> options,
        ILogger<RealmStatusClient> logger)
    {
        _httpClientFactory = httpClientFactory;
        _tokens = tokens;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<RealmStatusResponse?> FetchAsync(CancellationToken cancellationToken)
    {
        var accessToken = await _tokens.GetTokenAsync(cancellationToken).ConfigureAwait(false);
        if (accessToken is null)
        {
            return null;
        }

        var indexUrl = $"{_options.ApiBaseUrl}data/wow/connected-realm/index" +
                       $"?namespace={Uri.EscapeDataString(_options.DynamicNamespace)}" +
                       $"&locale={Uri.EscapeDataString(_options.Locale)}";

        var index = await GetJsonAsync<ConnectedRealmIndex>(indexUrl, accessToken, cancellationToken)
            .ConfigureAwait(false);

        if (index?.ConnectedRealms is null || index.ConnectedRealms.Count == 0)
        {
            return null;
        }

        var hrefs = new List<string>();
        foreach (var reference in index.ConnectedRealms)
        {
            var href = reference.Href;
            if (string.IsNullOrWhiteSpace(href))
            {
                continue;
            }

            hrefs.Add(href);
            if (hrefs.Count >= Math.Max(1, _options.MaxConnectedRealms))
            {
                break;
            }
        }

        if (hrefs.Count == 0)
        {
            return null;
        }

        var entries = new ConcurrentBag<RealmStatusEntry>();
        var parallelOptions = new ParallelOptions
        {
            // Bounded on purpose: a realm list is dozens of calls and we refresh it rarely.
            MaxDegreeOfParallelism = 8,
            CancellationToken = cancellationToken,
        };

        await Parallel.ForEachAsync(hrefs, parallelOptions, async (href, itemCancellation) =>
        {
            var detail = await GetJsonAsync<ConnectedRealm>(href, accessToken, itemCancellation)
                .ConfigureAwait(false);

            if (detail?.Realms is null)
            {
                return;
            }

            var online = string.Equals(detail.Status?.Type, "UP", StringComparison.OrdinalIgnoreCase);
            var population = NormalisePopulation(detail.Population?.Type);

            foreach (var realm in detail.Realms)
            {
                var name = realm.Name;
                var slug = realm.Slug;
                if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(slug))
                {
                    continue;
                }

                var regionName = realm.Region?.Name;
                var region = string.IsNullOrWhiteSpace(regionName)
                    ? _options.Region.ToUpperInvariant()
                    : regionName;

                entries.Add(new RealmStatusEntry(name, slug, region, online, population, detail.HasQueue));
            }
        }).ConfigureAwait(false);

        if (entries.IsEmpty)
        {
            return null;
        }

        var realms = entries
            .OrderBy(entry => entry.Name, StringComparer.OrdinalIgnoreCase)
            .ToList();

        var updatedAt = DateTime.UtcNow.ToString("yyyy-MM-dd'T'HH:mm:ss'Z'", CultureInfo.InvariantCulture);
        return new RealmStatusResponse(updatedAt, realms);
    }

    /// <summary>Blizzard reports population in upper case, and omits it on some realms.</summary>
    private static string? NormalisePopulation(string? type)
    {
        if (string.IsNullOrWhiteSpace(type))
        {
            return null;
        }

        return type.ToUpperInvariant() switch
        {
            "LOW" => "low",
            "MEDIUM" => "medium",
            "HIGH" => "high",
            "FULL" => "full",
            _ => null,
        };
    }

    private async Task<T?> GetJsonAsync<T>(string url, string accessToken, CancellationToken cancellationToken)
        where T : class
    {
        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            var http = _httpClientFactory.CreateClient(BlizzardOptions.HttpClientName);
            using var response = await http.SendAsync(request, cancellationToken).ConfigureAwait(false);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "Blizzard returned {Status} for {Url}",
                    (int)response.StatusCode,
                    url);
                return null;
            }

            return await response.Content
                .ReadFromJsonAsync<T>(cancellationToken)
                .ConfigureAwait(false);
        }
        catch (HttpRequestException exception)
        {
            _logger.LogWarning(exception, "Could not reach {Url}", url);
            return null;
        }
        catch (TaskCanceledException exception) when (!cancellationToken.IsCancellationRequested)
        {
            _logger.LogWarning(exception, "Timed out reading {Url}", url);
            return null;
        }
    }

    private sealed class ConnectedRealmIndex
    {
        [JsonPropertyName("connected_realms")]
        public List<HrefReference>? ConnectedRealms { get; set; }
    }

    private sealed class HrefReference
    {
        [JsonPropertyName("href")]
        public string? Href { get; set; }
    }

    private sealed class ConnectedRealm
    {
        [JsonPropertyName("has_queue")]
        public bool HasQueue { get; set; }

        [JsonPropertyName("status")]
        public TypedName? Status { get; set; }

        [JsonPropertyName("population")]
        public TypedName? Population { get; set; }

        [JsonPropertyName("realms")]
        public List<Realm>? Realms { get; set; }
    }

    private sealed class TypedName
    {
        [JsonPropertyName("type")]
        public string? Type { get; set; }
    }

    private sealed class Realm
    {
        [JsonPropertyName("name")]
        public string? Name { get; set; }

        [JsonPropertyName("slug")]
        public string? Slug { get; set; }

        [JsonPropertyName("region")]
        public NamedReference? Region { get; set; }
    }

    private sealed class NamedReference
    {
        [JsonPropertyName("name")]
        public string? Name { get; set; }
    }
}
