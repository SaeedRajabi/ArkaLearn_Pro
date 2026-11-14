using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Common;

public static class CategoryPathHelper
{
    public static async Task<Dictionary<long, (string Title, long? ParentId)>> LoadLookupAsync(
        ArkaSoftwareQueryDbContext dbContext,
        CancellationToken cancellationToken = default)
    {
        var rows = await dbContext.Categories
            .AsNoTracking()
            .Select(c => new { c.Id, c.Title, c.ParentId })
            .ToListAsync(cancellationToken);

        return rows.ToDictionary(x => x.Id, x => (x.Title, x.ParentId));
    }

    public static List<string> BuildPath(
        long? categoryId,
        IReadOnlyDictionary<long, (string Title, long? ParentId)> lookup)
    {
        if (!categoryId.HasValue || categoryId.Value <= 0 || lookup.Count == 0)
            return [];

        var path = new List<string>();
        var current = categoryId.Value;
        var visited = new HashSet<long>();

        while (lookup.TryGetValue(current, out var node))
        {
            if (!visited.Add(current))
                break;

            if (!string.IsNullOrWhiteSpace(node.Title))
                path.Insert(0, node.Title.Trim());

            if (!node.ParentId.HasValue)
                break;

            current = node.ParentId.Value;
        }

        return path;
    }
}
