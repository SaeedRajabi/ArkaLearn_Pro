using ArkaSoftwarePro.Src.Core.Contracts.Services;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Services;

public class EntityTitleUniquenessChecker(ArkaSoftwareCommandDbContext dbContext) : IEntityTitleUniquenessChecker
{
    public Task<bool> SeminarTitleExistsAsync(string title, long? excludeId = null, CancellationToken cancellationToken = default) =>
        TitleExistsAsync(
            dbContext.Seminars.AsNoTracking(),
            excludeId,
            s => s.Title!.Value,
            title,
            cancellationToken);

    public Task<bool> ArticleTitleExistsAsync(string title, long? excludeId = null, CancellationToken cancellationToken = default) =>
        TitleExistsAsync(
            dbContext.Articles.AsNoTracking(),
            excludeId,
            a => a.Title!.Value,
            title,
            cancellationToken);

    public Task<bool> CourseTitleExistsAsync(string title, long? excludeId = null, CancellationToken cancellationToken = default) =>
        TitleExistsAsync(
            dbContext.Courses.AsNoTracking(),
            excludeId,
            c => c.Title!.Value,
            title,
            cancellationToken);

    public Task<bool> CategoryTitleExistsAsync(string title, long? excludeId = null, CancellationToken cancellationToken = default) =>
        TitleExistsAsync(
            dbContext.Categories.AsNoTracking(),
            excludeId,
            c => c.Title!.Value,
            title,
            cancellationToken);

    public Task<bool> RoomTitleExistsAsync(string title, long? excludeId = null, CancellationToken cancellationToken = default) =>
        TitleExistsAsync(
            dbContext.Rooms.AsNoTracking(),
            excludeId,
            r => r.Title!.Value,
            title,
            cancellationToken);

    public Task<bool> ProjectTitleExistsAsync(string title, long? excludeId = null, CancellationToken cancellationToken = default) =>
        TitleExistsAsync(
            dbContext.Projects.AsNoTracking(),
            excludeId,
            p => p.Title!.Value,
            title,
            cancellationToken);

    private static async Task<bool> TitleExistsAsync<T>(
        IQueryable<T> query,
        long? excludeId,
        System.Linq.Expressions.Expression<Func<T, string>> titleSelector,
        string title,
        CancellationToken cancellationToken)
    {
        var normalized = (title ?? string.Empty).Trim();
        if (normalized.Length == 0)
            return false;

        if (excludeId.HasValue)
            query = query.Where(e => EF.Property<long>(e, "Id") != excludeId.Value);

        var titles = await query.Select(titleSelector).ToListAsync(cancellationToken);
        return titles.Any(t => string.Equals(t?.Trim(), normalized, StringComparison.OrdinalIgnoreCase));
    }
}
