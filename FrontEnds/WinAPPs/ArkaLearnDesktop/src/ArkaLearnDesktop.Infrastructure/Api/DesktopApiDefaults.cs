namespace ArkaLearnDesktop.Infrastructure.Api;



internal static class DesktopApiDefaults

{

    public const string ProductionApiBaseUrl = "https://api.arkasoftware.ir/api/Service";

    public const string ProductionClientWebsiteUrl = "https://arkasoftware.ir";



    /// <summary>Legacy alias kept for callers that still reference the old name.</summary>

    public const string DevApiBaseUrl = ProductionApiBaseUrl;



    /// <summary>Legacy alias kept for callers that still reference the old name.</summary>

    public const string DevClientWebsiteUrl = ProductionClientWebsiteUrl;



    public static string NormalizeApiBaseUrl(string? raw)

    {

        if (string.IsNullOrWhiteSpace(raw))

            return ProductionApiBaseUrl;



        raw = raw.Trim().TrimEnd('/');

        if (!Uri.TryCreate(raw, UriKind.Absolute, out var uri)

            || (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))

            return ProductionApiBaseUrl;



        // Installed desktop builds must never call local IIS/Kestrel leftovers

        // (e.g. https://localhost:5001/api/Service from older settings.json).

        if (IsLocalHost(uri.Host))

            return ProductionApiBaseUrl;



        // Old installs pointed API at the marketing site instead of the API host.

        if (IsLegacyWebsiteHost(uri.Host))

            return ProductionApiBaseUrl;



        if (uri.Host.Equals("api.arkasoftware.ir", StringComparison.OrdinalIgnoreCase)

            && !raw.Contains("/api/Service", StringComparison.OrdinalIgnoreCase))

            return ProductionApiBaseUrl;



        return raw;

    }



    public static string ResolveClientWebsiteBaseUrl(string? configured, string apiBaseUrl)

    {

        if (!string.IsNullOrWhiteSpace(configured)

            && Uri.TryCreate(configured.Trim(), UriKind.Absolute, out var configuredUri)

            && (configuredUri.Scheme == Uri.UriSchemeHttp || configuredUri.Scheme == Uri.UriSchemeHttps))

        {

            if (IsLocalHost(configuredUri.Host)

                || configuredUri.Host.Equals("api.arkasoftware.ir", StringComparison.OrdinalIgnoreCase)

                || IsLegacyWebsiteHost(configuredUri.Host))

            {

                // Keep www/apex client site; only rewrite accidental API/local values.

                if (IsLegacyWebsiteHost(configuredUri.Host) && !IsLocalHost(configuredUri.Host))

                    return configuredUri.GetLeftPart(UriPartial.Authority).TrimEnd('/');



                return ProductionClientWebsiteUrl;

            }



            return configuredUri.GetLeftPart(UriPartial.Authority).TrimEnd('/');

        }



        _ = apiBaseUrl;

        return ProductionClientWebsiteUrl;

    }



    private static bool IsLocalHost(string host) =>

        host.Equals("localhost", StringComparison.OrdinalIgnoreCase)

        || host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase)

        || host.Equals("::1", StringComparison.OrdinalIgnoreCase);



    private static bool IsLegacyWebsiteHost(string host) =>

        host.Equals("arkasoftware.ir", StringComparison.OrdinalIgnoreCase)

        || host.Equals("www.arkasoftware.ir", StringComparison.OrdinalIgnoreCase);

}


