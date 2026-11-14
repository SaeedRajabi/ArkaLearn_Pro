using ArkaSoftwarePro.Src.Core.Domain.SeminarAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Contracts.Seminars.SeminarRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.TagAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.TagAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories
{
    public class SeminarCommandRepository(ArkaSoftwareCommandDbContext dbContext)
        : BaseCommandRepository<Seminar, ArkaSoftwareCommandDbContext>(dbContext), ISeminarCommandRepository
    {
        public async Task SyncTagsAsync(long seminarId, IReadOnlyCollection<string> tagNames)
        {
            var normalizedNames = NormalizeTagNames(tagNames);
            var existingSeminarTags = await _dbContext.Tags
                .Where(x => EF.Property<long?>(x, "SeminarId") == seminarId)
                .ToListAsync();

            foreach (var tag in existingSeminarTags)
                _dbContext.Entry(tag).Property("SeminarId").CurrentValue = null;

            foreach (var name in normalizedNames)
            {
                var tag = await ResolveReusableTagAsync(name, "SeminarId", seminarId);
                _dbContext.Entry(tag).Property("SeminarId").CurrentValue = seminarId;
            }
        }

        public async Task<SeminarRoomAccessGate> GetRoomAccessGateAsync(long roomId, string userNameOrEmail)
        {
            var key = (userNameOrEmail ?? string.Empty).Trim();
            var normalizedKey = key.ToLowerInvariant();

            long? userId = null;
            if (!string.IsNullOrWhiteSpace(normalizedKey))
            {
                var users = await _dbContext.Users.AsNoTracking().ToListAsync();
                userId = users
                    .Where(x =>
                        string.Equals(x.UserName.Value, normalizedKey, StringComparison.OrdinalIgnoreCase) ||
                        string.Equals(x.Email.Value, normalizedKey, StringComparison.OrdinalIgnoreCase))
                    .Select(x => (long?)x.Id)
                    .FirstOrDefault();
            }

            var seminars = await _dbContext.Seminars
                .AsNoTracking()
                .Include(x => x.Registrations)
                .Where(x => x.RoomId == roomId)
                .OrderByDescending(x => x.StartTime)
                .ToListAsync();

            if (seminars.Count == 0)
            {
                return new SeminarRoomAccessGate(
                    HasLinkedSeminar: false,
                    HasRegisteredSeminar: false,
                    HasPaid: false,
                    IsFree: false,
                    SeminarId: null,
                    StartTime: null,
                    EndTime: null);
            }

            if (!userId.HasValue)
            {
                var linked = seminars[0];
                return new SeminarRoomAccessGate(
                    HasLinkedSeminar: true,
                    HasRegisteredSeminar: false,
                    HasPaid: false,
                    IsFree: linked.IsFree,
                    SeminarId: linked.Id,
                    StartTime: linked.StartTime,
                    EndTime: linked.EndTime);
            }

            var registeredSeminar = seminars
                .Select(seminar => new
                {
                    Seminar = seminar,
                    Registration = seminar.Registrations.FirstOrDefault(x => x.UserId == userId.Value)
                })
                .Where(x => x.Registration != null)
                .OrderByDescending(x => x.Seminar.EndTime >= DateTime.UtcNow)
                .ThenByDescending(x => x.Seminar.StartTime)
                .FirstOrDefault();

            if (registeredSeminar == null)
            {
                var linked = seminars[0];
                return new SeminarRoomAccessGate(
                    HasLinkedSeminar: true,
                    HasRegisteredSeminar: false,
                    HasPaid: false,
                    IsFree: linked.IsFree,
                    SeminarId: linked.Id,
                    StartTime: linked.StartTime,
                    EndTime: linked.EndTime);
            }

            return new SeminarRoomAccessGate(
                HasLinkedSeminar: true,
                HasRegisteredSeminar: true,
                HasPaid: registeredSeminar.Registration!.HasPaid,
                IsFree: registeredSeminar.Seminar.IsFree,
                SeminarId: registeredSeminar.Seminar.Id,
                StartTime: registeredSeminar.Seminar.StartTime,
                EndTime: registeredSeminar.Seminar.EndTime);
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

        public async Task<List<Seminar>> GetTeacherSeminarsWithRegistrationsAsync(long teacherUserId)
        {
            return await _dbContext.Seminars
                .Include(x => x.Registrations)
                .Include(x => x.Room)
                .Where(x => x.RoomId != null && x.Room != null && x.Room.UserId == teacherUserId)
                .ToListAsync();
        }
    }
}
