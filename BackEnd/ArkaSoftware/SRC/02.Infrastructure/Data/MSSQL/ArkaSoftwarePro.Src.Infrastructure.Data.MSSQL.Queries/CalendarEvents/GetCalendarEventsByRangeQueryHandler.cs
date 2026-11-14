using ArkaSoftwarePro.Src.Core.RequestResponse.CalendarEvents.Queries.GetCalendarEventsByRange;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Common;
using Framework.Src.Core.Contracts.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.CalendarEvents;

public class GetCalendarEventsByRangeQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ArkaSoftwareQueryDbContext queryDbContext)
    : IQueryHandler<GetCalendarEventsByRangeQuery, List<CalendarEventQri>>
{
    public async Task<QueryResult<List<CalendarEventQri>>> Handle(GetCalendarEventsByRangeQuery query)
    {
        var categories = ParseCategories(query.Categories);

        var events = await queryDbContext.CalendarEvents
            .AsNoTracking()
            .Where(x =>
                !x.IsDelete &&
                x.EndUtc >= query.RangeStartUtc &&
                x.StartUtc <= query.RangeEndUtc &&
                (categories.Count == 0 || categories.Contains(x.Category)))
            .OrderBy(x => x.StartUtc)
            .ToListAsync();

        if (events.Count == 0)
        {
            return new QueryResult<List<CalendarEventQri>>
            {
                _data = [],
                Status = ApplicationServiceStatus.Ok,
            };
        }

        var eventIds = events.Select(x => x.Id).ToList();
        var participants = await queryDbContext.CalendarEventParticipants
            .AsNoTracking()
            .Where(x => eventIds.Contains(x.CalendarEventId))
            .ToListAsync();

        var userIds = participants.Select(x => x.UserId).Distinct().ToList();
        var userNames = await queryDbContext.Users
            .AsNoTracking()
            .Where(u => userIds.Contains(u.Id))
            .Select(u => new { u.Id, u.FirstName, u.LastName, u.UserName, u.Email })
            .ToListAsync();

        var nameLookup = userNames.ToDictionary(
            x => x.Id,
            x =>
            {
                var fullName = string.Join(" ", new[] { x.FirstName, x.LastName }.Where(v => !string.IsNullOrWhiteSpace(v))).Trim();
                return !string.IsNullOrWhiteSpace(fullName)
                    ? fullName
                    : x.UserName?.Trim() ?? x.Email?.Trim() ?? string.Empty;
            });

        var participantLookup = participants
            .GroupBy(x => x.CalendarEventId)
            .ToDictionary(
                g => g.Key,
                g => g.Select(p => new CalendarEventParticipantQri
                {
                    UserId = p.UserId,
                    DisplayName = nameLookup.GetValueOrDefault(p.UserId, string.Empty),
                }).ToList());

        var result = events.Select(x => new CalendarEventQri
        {
            Id = x.Id,
            Title = x.Title,
            Category = x.Category,
            StartUtc = ToUtcIso(x.StartUtc),
            EndUtc = ToUtcIso(x.EndUtc),
            IsAllDay = x.IsAllDay,
            EventUrl = x.EventUrl,
            Description = x.Description,
            OwnerUserId = x.OwnerUserId,
            Participants = participantLookup.GetValueOrDefault(x.Id, []),
        }).ToList();

        return new QueryResult<List<CalendarEventQri>>
        {
            _data = result,
            Status = ApplicationServiceStatus.Ok,
        };
    }

    private static List<int> ParseCategories(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
            return [];

        return raw.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(x => int.TryParse(x, out var value) ? value : (int?)null)
            .Where(x => x.HasValue)
            .Select(x => x!.Value)
            .Distinct()
            .ToList();
    }

    private static string ToUtcIso(DateTime value) =>
        DateTime.SpecifyKind(value, DateTimeKind.Utc).ToString("O");
}
