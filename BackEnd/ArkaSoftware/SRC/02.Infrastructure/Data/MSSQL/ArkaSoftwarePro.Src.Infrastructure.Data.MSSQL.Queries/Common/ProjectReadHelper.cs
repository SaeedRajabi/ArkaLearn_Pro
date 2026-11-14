using System.Text.Json;
using System.Text.RegularExpressions;
using ArkaSoftwarePro.Src.Core.RequestResponse.Projects.Queries.GetProjectById;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Common;

internal static class ProjectReadHelper
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    public static List<string> ParseStringList(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return new List<string>();

        try
        {
            return JsonSerializer.Deserialize<List<string>>(json) ?? new List<string>();
        }
        catch
        {
            return SplitLooseList(json).ToList();
        }
    }

    public static List<ProjectGalleryItemQri> ParseGallery(string? galleryJson)
    {
        if (string.IsNullOrWhiteSpace(galleryJson))
            return new List<ProjectGalleryItemQri>();

        try
        {
            var items = JsonSerializer.Deserialize<List<ProjectGalleryItemQri>>(galleryJson, JsonOptions)
                ?? new List<ProjectGalleryItemQri>();
            return items.Where(x => !string.IsNullOrWhiteSpace(x.ImageUrl)).OrderBy(x => x.SortOrder).ToList();
        }
        catch
        {
            return new List<ProjectGalleryItemQri>();
        }
    }

    private static IEnumerable<string> SplitLooseList(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return Array.Empty<string>();

        return Regex
            .Split(value, @"[\r\n;؛,،]+")
            .Select(x => x.Trim())
            .Where(x => x.Length > 0);
    }
}
