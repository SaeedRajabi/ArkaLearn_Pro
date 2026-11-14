using ArkaSoftwarePro.Src.Core.Contracts.Projects.ProjectRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.ProjectAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.TagAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.TagAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories;

public class ProjectCommandRepository(ArkaSoftwareCommandDbContext dbContext)
    : BaseCommandRepository<Project, ArkaSoftwareCommandDbContext>(dbContext), IProjectCommandRepository
{
    public async Task SyncTagsAsync(long projectId, IReadOnlyCollection<string> tagNames)
    {
        var normalizedNames = NormalizeTagNames(tagNames);
        var existingProjectTags = await _dbContext.Tags
            .Where(x => EF.Property<long?>(x, "ProjectId") == projectId)
            .ToListAsync();

        foreach (var tag in existingProjectTags)
            _dbContext.Entry(tag).Property("ProjectId").CurrentValue = null;

        foreach (var name in normalizedNames)
        {
            var tag = await ResolveReusableTagAsync(name, "ProjectId", projectId);
            _dbContext.Entry(tag).Property("ProjectId").CurrentValue = projectId;
        }
    }

    private async Task<Tag> ResolveReusableTagAsync(string tagName, string ownerPropertyName, long ownerId)
    {
        var tags = await _dbContext.Tags.ToListAsync();
        var tag = tags.FirstOrDefault(x =>
            string.Equals(x.TagName.Value, tagName, StringComparison.OrdinalIgnoreCase) &&
            (_dbContext.Entry(x).Property<long?>(ownerPropertyName).CurrentValue == null ||
             _dbContext.Entry(x).Property<long?>(ownerPropertyName).CurrentValue == ownerId));

        if (tag != null)
            return tag;

        tag = new Tag(new TagName(tagName));
        await _dbContext.Tags.AddAsync(tag);
        return tag;
    }

    private static List<string> NormalizeTagNames(IEnumerable<string?> tagNames)
    {
        return tagNames
            .Select(x => (x ?? string.Empty).Trim().TrimStart('#'))
            .Where(x => x.Length >= 2)
            .Select(x => x.Length > 100 ? x[..100].Trim() : x)
            .Where(x => x.Length >= 2)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }
}
