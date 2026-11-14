namespace ArkaSoftwarePro.Src.Core.ApplicationService.PaymentsServices;

internal static class PaymentQueryString
{
    public static string AddQueryString(string url, IDictionary<string, string?> values)
        => url + (url.Contains('?') ? "&" : "?") + string.Join("&", values.Where(pair => pair.Value != null)
            .Select(pair => Uri.EscapeDataString(pair.Key) + "=" + Uri.EscapeDataString(pair.Value!)));

    public static Dictionary<string, string> ParseQuery(string query)
    {
        var values = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var segment in query.TrimStart('?').Split('&', StringSplitOptions.RemoveEmptyEntries))
        {
            var parts = segment.Split('=', 2);
            var key = System.Net.WebUtility.UrlDecode(parts[0]);
            var value = parts.Length > 1 ? System.Net.WebUtility.UrlDecode(parts[1]) : string.Empty;
            values[key] = values.TryGetValue(key, out var previous) ? previous + "," + value : value;
        }
        return values;
    }
}
