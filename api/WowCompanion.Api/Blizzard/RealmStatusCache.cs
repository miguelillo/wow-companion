using Microsoft.Extensions.Options;
using WowCompanion.Api.Contracts;

namespace WowCompanion.Api.Blizzard;

/// <summary>
/// Serves one cached answer for a few minutes, and keeps serving the last good one when
/// Blizzard is unreachable. A few minutes stale beats a hole on the page, and it keeps us
/// well inside Blizzard's rate limits however much traffic the site gets.
/// </summary>
public sealed class RealmStatusCache
{
    private readonly RealmStatusClient _client;
    private readonly BlizzardOptions _options;
    private readonly SemaphoreSlim _gate = new(1, 1);

    private RealmStatusResponse? _cached;
    private DateTimeOffset _fetchedAt = DateTimeOffset.MinValue;

    public RealmStatusCache(RealmStatusClient client, IOptions<BlizzardOptions> options)
    {
        _client = client;
        _options = options.Value;
    }

    public async Task<RealmStatusResponse?> GetAsync(CancellationToken cancellationToken)
    {
        if (IsFresh())
        {
            return _cached;
        }

        await _gate.WaitAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            if (IsFresh())
            {
                return _cached;
            }

            var fresh = await _client.FetchAsync(cancellationToken).ConfigureAwait(false);
            if (fresh is not null)
            {
                _cached = fresh;
                _fetchedAt = DateTimeOffset.UtcNow;
            }

            return _cached;
        }
        finally
        {
            _gate.Release();
        }
    }

    private bool IsFresh()
    {
        var ttl = TimeSpan.FromMinutes(Math.Max(1, _options.CacheMinutes));
        return _cached is not null && DateTimeOffset.UtcNow - _fetchedAt < ttl;
    }
}
