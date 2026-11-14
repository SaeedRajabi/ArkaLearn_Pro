namespace ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.ValueOBJs;

/// <summary>
/// Builds canonical online-room entry URLs: {dashboardOrigin}/room/{slug}
/// </summary>
public static class RoomEntryLinkBuilder
{
    public static string Build(string dashboardOrigin, string slug)
    {
        var origin = NormalizeOrigin(dashboardOrigin);
        var roomSlug = (slug ?? string.Empty).Trim().Trim('/').ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(origin))
            throw new ArgumentException("Dashboard origin is required.", nameof(dashboardOrigin));
        if (string.IsNullOrWhiteSpace(roomSlug))
            throw new ArgumentException("Room slug is required.", nameof(slug));

        return $"{origin}/room/{roomSlug}";
    }

    public static string Normalize(string? storedLink, string? slug, string fallbackDashboardOrigin)
    {
        if (!string.IsNullOrWhiteSpace(slug))
            return Build(ResolveOrigin(storedLink, fallbackDashboardOrigin), slug);

        if (string.IsNullOrWhiteSpace(storedLink))
            return fallbackDashboardOrigin.TrimEnd('/');

        var trimmed = storedLink.Trim();
        if (ContainsRoomSegment(trimmed))
            return trimmed;

        var origin = ResolveOrigin(trimmed, fallbackDashboardOrigin);
        var segment = ExtractTrailingSegment(trimmed);
        if (!string.IsNullOrWhiteSpace(segment) && !IsReservedSegment(segment))
            return Build(origin, segment);

        return trimmed;
    }

    public static string NormalizeOrigin(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;

        var origin = value.Trim();
        if (Uri.TryCreate(origin, UriKind.Absolute, out var absolute))
            origin = absolute.GetLeftPart(UriPartial.Authority);

        while (origin.EndsWith("/room", StringComparison.OrdinalIgnoreCase))
            origin = origin[..^5];

        return origin.TrimEnd('/');
    }

    private static string ResolveOrigin(string? linkOrOrigin, string fallback)
    {
        if (string.IsNullOrWhiteSpace(linkOrOrigin))
            return NormalizeOrigin(fallback);

        var trimmed = linkOrOrigin.Trim();
        if (Uri.TryCreate(trimmed, UriKind.Absolute, out var absolute))
            return NormalizeOrigin(absolute.GetLeftPart(UriPartial.Authority));

        return NormalizeOrigin(fallback);
    }

    private static bool ContainsRoomSegment(string link) =>
        link.Contains("/room/", StringComparison.OrdinalIgnoreCase) ||
        link.EndsWith("/room", StringComparison.OrdinalIgnoreCase);

    private static string? ExtractTrailingSegment(string link)
    {
        if (Uri.TryCreate(link, UriKind.Absolute, out var uri))
        {
            var path = uri.AbsolutePath.Trim('/');
            if (string.IsNullOrWhiteSpace(path))
                return null;
            var parts = path.Split('/', StringSplitOptions.RemoveEmptyEntries);
            return parts.Length > 0 ? parts[^1] : null;
        }

        var relative = link.Trim().TrimStart('/');
        if (string.IsNullOrWhiteSpace(relative))
            return null;
        var segments = relative.Split('/', StringSplitOptions.RemoveEmptyEntries);
        return segments.Length > 0 ? segments[^1] : null;
    }

    private static bool IsReservedSegment(string segment)
    {
        var lower = segment.ToLowerInvariant();
        return lower is "dashboard" or "login" or "room" or "svc" or "api" or "mono-administrator";
    }
}
