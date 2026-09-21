using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;

namespace WowCompanion.Api.Blizzard;

/// <summary>
/// Holds one OAuth client-credentials token and renews it shortly before it expires.
/// Returns null rather than throwing: a missing token is a card that says "no data",
/// never a broken page.
/// </summary>
public sealed class BlizzardTokenProvider
{
    private const string TokenUrl = "https://oauth.battle.net/token";

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly BlizzardOptions _options;
    private readonly ILogger<BlizzardTokenProvider> _logger;
    private readonly SemaphoreSlim _gate = new(1, 1);

    private string? _token;
    private DateTimeOffset _expiresAt = DateTimeOffset.MinValue;

    public BlizzardTokenProvider(
        IHttpClientFactory httpClientFactory,
        IOptions<BlizzardOptions> options,
        ILogger<BlizzardTokenProvider> logger)
    {
        _httpClientFactory = httpClientFactory;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<string?> GetTokenAsync(CancellationToken cancellationToken)
    {
        if (!_options.IsConfigured)
        {
            return null;
        }

        if (IsFresh())
        {
            return _token;
        }

        await _gate.WaitAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            if (IsFresh())
            {
                return _token;
            }

            using var request = new HttpRequestMessage(HttpMethod.Post, TokenUrl);
            var credentials = Convert.ToBase64String(
                Encoding.UTF8.GetBytes($"{_options.ClientId}:{_options.ClientSecret}"));
            request.Headers.Authorization = new AuthenticationHeaderValue("Basic", credentials);
            request.Content = new FormUrlEncodedContent(
                new[] { new KeyValuePair<string, string>("grant_type", "client_credentials") });

            var http = _httpClientFactory.CreateClient(BlizzardOptions.HttpClientName);
            using var response = await http.SendAsync(request, cancellationToken).ConfigureAwait(false);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "Blizzard token request failed with status {Status}",
                    (int)response.StatusCode);
                return null;
            }

            var payload = await response.Content
                .ReadFromJsonAsync<TokenResponse>(cancellationToken)
                .ConfigureAwait(false);

            if (payload is null || string.IsNullOrEmpty(payload.AccessToken))
            {
                return null;
            }

            _token = payload.AccessToken;
            // Renew a minute early so a request never travels with a token that expires mid-flight.
            _expiresAt = DateTimeOffset.UtcNow.AddSeconds(Math.Max(60, payload.ExpiresIn - 60));
            return _token;
        }
        catch (HttpRequestException exception)
        {
            _logger.LogWarning(exception, "Could not reach the Blizzard token endpoint");
            return null;
        }
        finally
        {
            _gate.Release();
        }
    }

    private bool IsFresh() => _token is not null && DateTimeOffset.UtcNow < _expiresAt;

    private sealed class TokenResponse
    {
        [JsonPropertyName("access_token")]
        public string AccessToken { get; set; } = string.Empty;

        [JsonPropertyName("expires_in")]
        public int ExpiresIn { get; set; }
    }
}
