using System.Text.Json;

namespace ArkaLearnDesktop.Infrastructure.Api;

internal static class ApiJsonHelper
{
    internal static readonly JsonSerializerOptions Options = CreateOptions();

    private static JsonSerializerOptions CreateOptions()
    {
        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
        };
        options.Converters.Add(new LongAsStringJsonConverter());
        options.Converters.Add(new NullableLongAsStringJsonConverter());
        return options;
    }

    public static List<T> ReadList<T>(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return [];

        try
        {
            using var doc = JsonDocument.Parse(raw);
            var element = Unwrap(doc.RootElement);
            if (element.ValueKind == JsonValueKind.Array)
                return JsonSerializer.Deserialize<List<T>>(element.GetRawText(), Options) ?? [];

            if (element.ValueKind == JsonValueKind.Object)
            {
                foreach (var key in new[] { "queryResult", "QueryResult", "items", "Items", "data", "Data" })
                {
                    if (!element.TryGetProperty(key, out var nested)) continue;
                    if (nested.ValueKind == JsonValueKind.Array)
                        return JsonSerializer.Deserialize<List<T>>(nested.GetRawText(), Options) ?? [];
                }
            }
        }
        catch
        {
            // fall through
        }

        try
        {
            return JsonSerializer.Deserialize<List<T>>(raw, Options) ?? [];
        }
        catch
        {
            return [];
        }
    }

    public static T? ReadObject<T>(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return default;

        try
        {
            using var doc = JsonDocument.Parse(raw);
            var element = Unwrap(doc.RootElement);
            return JsonSerializer.Deserialize<T>(element.GetRawText(), Options);
        }
        catch
        {
            try
            {
                return JsonSerializer.Deserialize<T>(raw, Options);
            }
            catch
            {
                return default;
            }
        }
    }

    public static PagedPayload<T> ReadPaged<T>(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return new PagedPayload<T>([], 1, 20, 0);

        try
        {
            using var doc = JsonDocument.Parse(raw);
            var element = Unwrap(doc.RootElement);
            if (element.ValueKind != JsonValueKind.Object)
                return new PagedPayload<T>(ReadList<T>(raw), 1, 20, 0);

            var items = new List<T>();
            foreach (var key in new[] { "queryResult", "QueryResult", "items", "Items" })
            {
                if (!element.TryGetProperty(key, out var nested) || nested.ValueKind != JsonValueKind.Array)
                    continue;
                items = JsonSerializer.Deserialize<List<T>>(nested.GetRawText(), Options) ?? [];
                break;
            }

            var pageNumber = ReadInt(element, "pageNumber", "PageNumber", 1);
            var pageSize = ReadInt(element, "pageSize", "PageSize", 20);
            var totalCount = ReadInt(element, "totalCount", "TotalCount", items.Count);
            return new PagedPayload<T>(items, pageNumber, pageSize, totalCount);
        }
        catch
        {
            return new PagedPayload<T>(ReadList<T>(raw), 1, 20, 0);
        }
    }

    private static int ReadInt(JsonElement element, string camelKey, string pascalKey, int fallback)
    {
        if (element.TryGetProperty(camelKey, out var value) || element.TryGetProperty(pascalKey, out value))
        {
            if (value.ValueKind == JsonValueKind.Number && value.TryGetInt32(out var parsed))
                return parsed;
        }

        return fallback;
    }

    internal sealed record PagedPayload<T>(List<T> Items, int PageNumber, int PageSize, int TotalCount);

    private static JsonElement Unwrap(JsonElement root)
    {
        if (root.ValueKind != JsonValueKind.Object) return root;

        foreach (var key in new[] { "data", "Data", "queryResult", "QueryResult" })
        {
            if (root.TryGetProperty(key, out var nested))
                return nested;
        }

        return root;
    }
}
