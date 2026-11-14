using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace ArkaSoftwarePro.Src.Core.Domain.Common;

public static class SlugHelper
{
    private static readonly Regex InvalidChars = new(@"[^\p{L}\p{N}]+", RegexOptions.Compiled);

    public static string Generate(string title, long? uniqueSuffix = null)
    {
        var normalized = title.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(normalized))
            normalized = "book";

        var slug = InvalidChars.Replace(normalized, "-").Trim('-');
        while (slug.Contains("--", StringComparison.Ordinal))
            slug = slug.Replace("--", "-", StringComparison.Ordinal);

        if (string.IsNullOrWhiteSpace(slug))
            slug = "book";

        if (uniqueSuffix is > 0)
            slug = $"{slug}-{uniqueSuffix}";

        return slug.Length > 180 ? slug[..180].Trim('-') : slug;
    }
}
