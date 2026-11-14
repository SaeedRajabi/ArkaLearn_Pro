using ArkaSoftwarePro.Src.Core.RequestResponse.Projects.Queries.GetProjectById;
using Newtonsoft.Json;
using System.Text.RegularExpressions;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ProjectsServices;

internal static class ProjectJsonHelper
{
    public static List<string> ParseStringList(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return new List<string>();

        try
        {
            var list = JsonConvert.DeserializeObject<List<string>>(json) ?? new List<string>();
            return list
                .SelectMany(SplitLooseList)
                .Select(x => x.Trim())
                .Where(x => x.Length > 0)
                .Select(x => x.Length > 100 ? x[..100].Trim() : x)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
        }
        catch
        {
            return SplitLooseList(json)
                .Select(x => x.Trim())
                .Where(x => x.Length > 0)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
        }
    }

    public static List<string> ParseTagNames(string? tagsJson) =>
        ParseStringList(tagsJson).Select(x => x.TrimStart('#')).ToList();

    public static List<ProjectGalleryItemQri> ParseGallery(string? galleryJson)
    {
        if (string.IsNullOrWhiteSpace(galleryJson))
            return new List<ProjectGalleryItemQri>();

        try
        {
            var items = JsonConvert.DeserializeObject<List<ProjectGalleryItemQri>>(galleryJson) ?? new List<ProjectGalleryItemQri>();
            return items
                .Where(x => !string.IsNullOrWhiteSpace(x.ImageUrl))
                .OrderBy(x => x.SortOrder)
                .ToList();
        }
        catch
        {
            return new List<ProjectGalleryItemQri>();
        }
    }

    public static string SerializeGallery(IEnumerable<ProjectGalleryItemQri> items) =>
        JsonConvert.SerializeObject(items.OrderBy(x => x.SortOrder).ToList());

    public static string SerializeStringList(IEnumerable<string> items) =>
        JsonConvert.SerializeObject(items.Distinct(StringComparer.OrdinalIgnoreCase).ToList());

    private static IEnumerable<string> SplitLooseList(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return Array.Empty<string>();

        return Regex
            .Split(value, @"[\r\n;؛,،]+")
            .Select(x => x.Trim())
            .Where(x => x.Length > 0);
    }

    public static string ToPublicWebPath(string savedPath)
    {
        if (string.IsNullOrWhiteSpace(savedPath))
            return string.Empty;

        var normalized = savedPath.Replace("\\", "/");
        var webRootIndex = normalized.LastIndexOf("/wwwroot/", StringComparison.OrdinalIgnoreCase);

        if (webRootIndex >= 0)
            normalized = normalized[(webRootIndex + "/wwwroot".Length)..];
        else if (normalized.StartsWith("wwwroot/", StringComparison.OrdinalIgnoreCase))
            normalized = normalized["wwwroot".Length..];

        if (!normalized.StartsWith('/'))
            normalized = "/" + normalized;

        return normalized;
    }
}
