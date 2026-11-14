using ArkaSoftwarePro.Src.Core.Contracts.IPBlacklist.IPBlacklistRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Users.SecurityTokenContracts;
using Microsoft.Extensions.Caching.Memory;

namespace ArkaSoftwarePro.Src.Endpoints.API.Middleware;

/// <summary>
/// Rejects requests from permanently blacklisted IP addresses.
/// The lookup is cached briefly per IP: it runs on every request, and hitting the
/// database each time amplifies connection-pool pressure (the same pool every other
/// query uses).
/// </summary>
public sealed class IpBlockedMiddleware(
    RequestDelegate next,
    ILogger<IpBlockedMiddleware> logger)
{
    private static readonly string[] AllowedPathPrefixes =
    [
        "/api/service/security",
        "/swagger",
        "/health",
        "/favicon.ico",
        "/_next",
        "/assets",
        "/static",
    ];

    private static readonly TimeSpan BlacklistCacheDuration = TimeSpan.FromSeconds(30);

    public async Task InvokeAsync(
        HttpContext context,
        IIPBlacklistQueryRepository ipBlacklistQueryRepository,
        IUserDeviceInfoService userInfoService,
        IMemoryCache memoryCache)
    {
        var path = context.Request.Path.Value ?? string.Empty;
        if (IsAllowedPath(path))
        {
            await next(context);
            return;
        }

        var ip = userInfoService.GetUserInfo().IpAddress;
        var isBlocked = false;
        if (!string.IsNullOrWhiteSpace(ip))
        {
            try
            {
                isBlocked = await memoryCache.GetOrCreateAsync($"ip-blacklist:{ip}", entry =>
                {
                    entry.AbsoluteExpirationRelativeToNow = BlacklistCacheDuration;
                    return ipBlacklistQueryRepository.IsIpBlockedAsync(ip, context.RequestAborted);
                });
            }
            catch (Exception ex)
            {
                // Fail-open: transient SQL/network issues must not take down all API requests
                // (e.g. book uploads) because the IP blacklist check could not run.
                logger.LogWarning(ex, "IP blacklist check failed for {IpAddress}; allowing request", ip);
            }
        }

        if (isBlocked)
        {
            logger.LogInformation("Blocked IP access denied for {IpAddress}", ip);
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new { message = "IP_BLOCKED", code = "IP_BLOCKED" });
            return;
        }

        await next(context);
    }

    private static bool IsAllowedPath(string path)
    {
        var normalized = path.Trim().ToLowerInvariant();
        foreach (var prefix in AllowedPathPrefixes)
        {
            if (normalized.StartsWith(prefix, StringComparison.Ordinal))
                return true;
        }

        return false;
    }
}

public static class IpBlockedMiddlewareExtensions
{
    public static IApplicationBuilder UseIpBlockedGuard(this IApplicationBuilder app)
        => app.UseMiddleware<IpBlockedMiddleware>();
}
