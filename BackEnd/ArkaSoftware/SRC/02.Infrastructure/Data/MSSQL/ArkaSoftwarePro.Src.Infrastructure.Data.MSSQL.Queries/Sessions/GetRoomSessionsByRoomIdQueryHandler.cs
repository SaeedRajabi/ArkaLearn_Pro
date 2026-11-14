using ArkaSoftwarePro.Src.Core.RequestResponse.Sessions.Queries.GetRoomSessionsByRoomId;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Common;
using Framework.Src.Core.Contracts.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Sessions;

public class GetRoomSessionsByRoomIdQueryHandler : IQueryHandler<GetRoomSessionsByRoomIdQuery, PagedData<GetRoomSessionsByRoomIdQri>>
{
    private readonly ArkaSoftwareCMPOutServices _outer;
    private readonly ArkaSoftwareQueryDbContext _dbContext;
    protected readonly QueryResult<PagedData<GetRoomSessionsByRoomIdQri>> result = new();

    public GetRoomSessionsByRoomIdQueryHandler(ArkaSoftwareCMPOutServices outer, ArkaSoftwareQueryDbContext dbContext)
    {
        _outer = outer;
        _dbContext = dbContext;
    }

    public async Task<QueryResult<PagedData<GetRoomSessionsByRoomIdQri>>> Handle(GetRoomSessionsByRoomIdQuery query)
    {
        var queryable = _dbContext.RoomSessions
            .AsNoTracking()
            .Where(x => x.RoomId == query.RoomId)
            .OrderByDescending(x => x.StartTime);

        var totalCount = await queryable.CountAsync();

        var items = await queryable
            .Skip(query.SkipCount)
            .Take(query.PageSize)
            .Select(x => new GetRoomSessionsByRoomIdQri
            {
                Id = x.Id,
                RoomId = x.RoomId,
                StartTime = x.StartTime,
                EndTime = x.EndTime,
                Duration = x.EndTime.HasValue ? x.EndTime.Value - x.StartTime : null,
                Status = x.Status,
                StartedByUserId = x.StartedByUserId,
                IsIgnored = x.IsIgnored
            })
            .ToListAsync();

        result._data = new PagedData<GetRoomSessionsByRoomIdQri>
        {
            QueryResult = items,
            PageNumber = query.PageNumber,
            PageSize = query.PageSize,
            TotalCount = totalCount
        };
        result.Status = ApplicationServiceStatus.Ok;
        return result;
    }
}