using ArkaSoftwarePro.Src.Core.RequestResponse.UserFiles.Queries.GetUserFiles;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Common;
using Framework.Src.Core.Contracts.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.UserFiles;

public class GetUserFilesQueryHandler : IQueryHandler<GetUserFilesQuery, List<GetUserFilesQri>>
{
    private readonly ArkaSoftwareCMPOutServices _outer;
    private readonly ArkaSoftwareQueryDbContext _dbContext;

    public GetUserFilesQueryHandler(ArkaSoftwareCMPOutServices outer, ArkaSoftwareQueryDbContext dbContext)
    {
        _outer = outer;
        _dbContext = dbContext;
    }

    public async Task<QueryResult<List<GetUserFilesQri>>> Handle(GetUserFilesQuery query)
    {
        var ownerIds = (query.OwnerUserIds ?? new List<long>())
            .Where(id => id > 0)
            .Distinct()
            .ToList();
        if (ownerIds.Count == 0 && query.UserId > 0)
            ownerIds.Add(query.UserId);

        var baseQuery = _dbContext.UserFiles
            .AsNoTracking()
            .Where(x => ownerIds.Contains(x.UserId));

        baseQuery = query.ParentId.HasValue
            ? baseQuery.Where(x => x.ParentId == query.ParentId)
            : baseQuery.Where(x => x.ParentId == null);

        var items = await baseQuery
            .OrderByDescending(x => x.IsFolder)
            .ThenBy(x => x.Name)
            .Select(x => new GetUserFilesQri
            {
                Id = x.Id,
                UserId = x.UserId,
                ParentId = x.ParentId,
                Name = x.Name,
                IsFolder = x.IsFolder,
                FileUrl = x.FileUrl,
                FileSize = x.FileSize,
                CreatedAt = x.CreatedAt
            })
            .ToListAsync();

        return new QueryResult<List<GetUserFilesQri>>
        {
            _data = items,
            Status = ApplicationServiceStatus.Ok
        };
    }
}