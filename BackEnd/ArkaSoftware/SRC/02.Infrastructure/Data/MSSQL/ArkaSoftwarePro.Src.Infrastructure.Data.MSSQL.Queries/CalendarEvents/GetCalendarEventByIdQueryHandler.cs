using ArkaSoftwarePro.Src.Core.RequestResponse.CalendarEvents.Queries.GetCalendarEventById;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Common;
using Framework.Src.Core.Contracts.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.CalendarEvents;

public class GetCalendarEventByIdQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ArkaSoftwareQueryDbContext queryDbContext)
    : IQueryHandler<GetCalendarEventByIdQuery, CalendarEventDetailQri>
{
    public async Task<QueryResult<CalendarEventDetailQri>> Handle(GetCalendarEventByIdQuery query)
    {
        var calendarEvent = await queryDbContext.CalendarEvents
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == query.EventId && !x.IsDelete);

        if (calendarEvent is null)
        {
            return new QueryResult<CalendarEventDetailQri>
            {
                _data = null!,
                Status = ApplicationServiceStatus.NotFound,
            };
        }

        var participants = await queryDbContext.CalendarEventParticipants
            .AsNoTracking()
            .Where(x => x.CalendarEventId == query.EventId)
            .ToListAsync();

        var userIds = participants.Select(x => x.UserId).Distinct().ToList();
        var users = await queryDbContext.Users
            .AsNoTracking()
            .Where(u => userIds.Contains(u.Id))
            .Select(u => new
            {
                u.Id,
                u.FirstName,
                u.LastName,
                u.UserName,
                u.Email,
                u.PhoneNumber,
            })
            .ToListAsync();

        var userLookup = users.ToDictionary(
            x => x.Id,
            x =>
            {
                var fullName = string.Join(" ", new[] { x.FirstName, x.LastName }.Where(v => !string.IsNullOrWhiteSpace(v))).Trim();
                return new CalendarEventParticipantDetailQri
                {
                    UserId = x.Id,
                    DisplayName = !string.IsNullOrWhiteSpace(fullName)
                        ? fullName
                        : x.UserName?.Trim() ?? x.Email?.Trim() ?? x.PhoneNumber?.Trim() ?? string.Empty,
                    PhoneNumber = x.PhoneNumber,
                };
            });

        return new QueryResult<CalendarEventDetailQri>
        {
            _data = new CalendarEventDetailQri
            {
                Id = calendarEvent.Id,
                Title = calendarEvent.Title,
                Category = calendarEvent.Category,
                StartUtc = ToUtcIso(calendarEvent.StartUtc),
                EndUtc = ToUtcIso(calendarEvent.EndUtc),
                IsAllDay = calendarEvent.IsAllDay,
                EventUrl = calendarEvent.EventUrl,
                Description = calendarEvent.Description,
                OwnerUserId = calendarEvent.OwnerUserId,
                Participants = participants
                    .Select(p => userLookup.GetValueOrDefault(p.UserId, new CalendarEventParticipantDetailQri
                    {
                        UserId = p.UserId,
                        DisplayName = string.Empty,
                    }))
                    .ToList(),
            },
            Status = ApplicationServiceStatus.Ok,
        };
    }

    private static string ToUtcIso(DateTime value) =>
        DateTime.SpecifyKind(value, DateTimeKind.Utc).ToString("O");
}
