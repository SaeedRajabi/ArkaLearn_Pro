using ArkaSoftwarePro.Src.Core.RequestResponse.Dashboard.Queries.GetDashboardStats;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Common;
using Framework.Src.Core.Contracts.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Dashboard;

public class GetDashboardStatsQueryHandler : IQueryHandler<GetDashboardStatsQuery, GetDashboardStatsQri>
{
    private readonly ArkaSoftwareCMPOutServices _outer;
    private readonly ArkaSoftwareQueryDbContext _dbContext;
    protected readonly QueryResult<GetDashboardStatsQri> result = new();

    public GetDashboardStatsQueryHandler(ArkaSoftwareCMPOutServices outer, ArkaSoftwareQueryDbContext dbContext)
    {
        _outer = outer;
        _dbContext = dbContext;
    }

    public async Task<QueryResult<GetDashboardStatsQri>> Handle(GetDashboardStatsQuery query)
    {
        var teachers = await _dbContext.Teachers.CountAsync();
        var students = await _dbContext.Students.CountAsync();
        var rooms = await _dbContext.Rooms.CountAsync();
        var activeSessions = await _dbContext.RoomSessions.CountAsync(x => x.Status == "Active");
        var totalSessions = await _dbContext.RoomSessions.CountAsync();
        var courses = await _dbContext.Courses.CountAsync();
        var seminars = await _dbContext.Seminars.CountAsync();

        result._data = new GetDashboardStatsQri
        {
            TotalTeachers = teachers,
            TotalStudents = students,
            TotalRooms = rooms,
            ActiveSessions = activeSessions,
            TotalSessionsHeld = totalSessions,
            TotalCourses = courses,
            TotalSeminars = seminars
        };
        result.Status = ApplicationServiceStatus.Ok;
        return result;
    }
}