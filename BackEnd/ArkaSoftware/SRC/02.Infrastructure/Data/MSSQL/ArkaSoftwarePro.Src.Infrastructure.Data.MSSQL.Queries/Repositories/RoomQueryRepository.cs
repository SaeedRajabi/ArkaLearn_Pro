using ArkaSoftwarePro.Src.Core.Contracts.Rooms.RoomRepositoriesContract.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Messages.Queries.GetAllMessageInRoom;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Queries.GetAllRoomsWithOwnerId;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Queries.GetAllRoomUsersWithRoomId;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Queries.GetRoomBySlug;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Queries.GetRoomFilesByRoomId;
using ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Queries.GetRoomWithRoomId;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Infrastructure.Data.MSSQL.Queries.QueryRepositories;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Repositories
{
    public class RoomQueryRepository(ArkaSoftwareQueryDbContext dbContext)
        : BaseQueryRepository<ArkaSoftwareQueryDbContext>(dbContext), IRoomQueryRepository
    {
        public async Task<PagedData<GetAllRoomsByOwnerIdQri>?> GetAllOwnerRoomExecuteAsync(GetAllRoomsByOwnerIdQuery query)
        {
            PagedData<GetAllRoomsByOwnerIdQri> result = new();
            var queryResult = _dbContext.Rooms
                 .AsNoTracking()
                 .Include(x => x.RoomUsers)
                 .Where(x => x.UserId == query.UserId)
                 .OrderByDescending(x => x.RoomId);

            if (query.NeedTotalCount)
            {
                result.TotalCount = queryResult.Count();
            }

            var roomTitle = (query.RoomTitle ?? string.Empty).ToLower();
            result.QueryResult = await queryResult.Where(x => x.Title!.ToLower().Contains(roomTitle))
                .Skip(query.SkipCount)
                .Take(query.PageSize)
                .Select(x => new GetAllRoomsByOwnerIdQri
                {
                    Title = x.Title!,
                    RoomId = x.RoomId,
                    Slug = x.Slug,
                    Status = x.Status.ToString(),
                    ServiceName = "Not Service"
                }).ToListAsync();
            return result!;
        }

        public async Task<PagedData<GetAllRoomUserByRoomIdQri>?> GetAllRoomUserByRoomIdExecuteAsync(GetAllRoomUserByRoomIdQuery query)
        {
            var result = new PagedData<GetAllRoomUserByRoomIdQri>();

            // Only catalog-assigned students (managed seats), not legacy/guest room users.
            var roomUsersQuery = _dbContext.Rooms
                .AsNoTracking()
                .Where(x => x.RoomId == query.RoomId)
                .SelectMany(x => x.RoomUsers)
                .Where(ru => ru.ManagedRoomStudentId != null);

            // If InputValue Exist Set Filter
            if (!string.IsNullOrWhiteSpace(query.InputValue))
            {
                var lowerInput = query.InputValue.ToLower();
                roomUsersQuery = roomUsersQuery.Where(x =>
                    x.UserName.ToLower().Contains(lowerInput) ||
                    (x.FirstName + " " + x.LastName).ToLower().Contains(lowerInput));
            }

            // Calculate Total Count If Need
            if (query.NeedTotalCount)
            {
                result.TotalCount = await roomUsersQuery.CountAsync();
            }

            // Sorted Configure
            if (!string.IsNullOrEmpty(query.SortBy) && query.SortBy.ToLower() == "username")
            {
                roomUsersQuery = query.SortAscending
                    ? roomUsersQuery.OrderBy(x => x.UserName)
                    : roomUsersQuery.OrderByDescending(x => x.UserName);
            }
            else
            {
                roomUsersQuery = roomUsersQuery
                    .OrderByDescending(x => x.IsOnline)
                    .ThenBy(x => x.UserName);
            }

            result.QueryResult = await roomUsersQuery
                .Skip(query.SkipCount)
                .Take(query.PageSize)
                .Select(x => new GetAllRoomUserByRoomIdQri
                {
                    RoomUserId = x.UserId,
                    UserId = x.UserId,
                    ManagedRoomStudentId = x.ManagedRoomStudentId!.Value,
                    FullName = x.FirstName + " " + x.LastName,
                    UserName = x.UserName,
                    CreateAt = x.CreateAt.ToString("yyyy/MM/dd - HH:mm"),
                    IsOnline = x.IsOnline,
                    IsBlocked = x.IsBlocked
                })
                .ToListAsync();

            return result;
        }

        public async Task<GetRoomByRoomIdQri?> GetRoomByRoomIdExecuteAsync(GetRoomByRoomIdQuery query)
        {
            return await _dbContext.Rooms
                .AsNoTracking()
                .Where(x => x.RoomId == query.RoomId)
                .Select(x => new GetRoomByRoomIdQri
                {
                    RoomId = x.RoomId,
                    Title = x.Title,
                    Slug = x.Slug,
                    Capacity = x.Capacity,
                    ClassRoomLink = x.ClassRoomLink,
                    FirstAdminInput = x.FirstAdminInput,
                    TeacherEntersFirst = x.TeacherEntersFirst,
                    GuestQuantity = x.GuestQuantity,
                    IsGuest = x.IsGuest,
                    MaxSessionTime = x.MaxSessionTime,
                    Status = x.Status,
                    DefaultMediaFileId = x.DefaultMediaFileId,
                    DefaultSlideFileId = x.DefaultSlideFileId,
                    UserId = x.UserId,
                    HasLinkedSeminar = _dbContext.Seminars.Any(s => s.RoomId == x.RoomId),
                    LinkedSeminarId = _dbContext.Seminars
                        .Where(s => s.RoomId == x.RoomId)
                        .OrderByDescending(s => s.StartTime)
                        .Select(s => (long?)s.Id)
                        .FirstOrDefault(),
                    AssignedRoomUserIds = x.RoomUsers
                        .Where(ru => ru.ManagedRoomStudentId != null)
                        .Select(ru => ru.UserId)
                        .ToList(),
                    AssignedManagedRoomStudentIds = x.RoomUsers
                        .Where(ru => ru.ManagedRoomStudentId != null)
                        .Select(ru => ru.ManagedRoomStudentId!.Value)
                        .ToList(),
                    ManagedSeatSummaries = x.RoomUsers
                        .Where(ru => ru.ManagedRoomStudentId != null)
                        .Select(ru => new RoomManagedSeatSummary
                        {
                            RoomUserId = ru.UserId,
                            ManagedRoomStudentId = ru.ManagedRoomStudentId!.Value,
                            IsBlocked = ru.IsBlocked
                        })
                        .ToList()
                }).SingleOrDefaultAsync();
        }

        public async Task<GetRoomByRoomIdQri?> GetRoomBySlugExecuteAsync(GetRoomBySlugQuery query)
        {
            if (string.IsNullOrWhiteSpace(query.Slug)) return null;
            var slug = query.Slug.Trim().ToLowerInvariant();
            return await _dbContext.Rooms
                .AsNoTracking()
                .Where(x => x.Slug == slug)
                .Select(x => new GetRoomByRoomIdQri
                {
                    RoomId = x.RoomId,
                    Title = x.Title,
                    Slug = x.Slug,
                    Capacity = x.Capacity,
                    ClassRoomLink = x.ClassRoomLink,
                    FirstAdminInput = x.FirstAdminInput,
                    TeacherEntersFirst = x.TeacherEntersFirst,
                    GuestQuantity = x.GuestQuantity,
                    IsGuest = x.IsGuest,
                    MaxSessionTime = x.MaxSessionTime,
                    Status = x.Status,
                    DefaultMediaFileId = x.DefaultMediaFileId,
                    DefaultSlideFileId = x.DefaultSlideFileId,
                    UserId = x.UserId,
                    HasLinkedSeminar = _dbContext.Seminars.Any(s => s.RoomId == x.RoomId),
                    LinkedSeminarId = _dbContext.Seminars
                        .Where(s => s.RoomId == x.RoomId)
                        .OrderByDescending(s => s.StartTime)
                        .Select(s => (long?)s.Id)
                        .FirstOrDefault(),
                    AssignedRoomUserIds = x.RoomUsers
                        .Where(ru => ru.ManagedRoomStudentId != null)
                        .Select(ru => ru.UserId)
                        .ToList(),
                    AssignedManagedRoomStudentIds = x.RoomUsers
                        .Where(ru => ru.ManagedRoomStudentId != null)
                        .Select(ru => ru.ManagedRoomStudentId!.Value)
                        .ToList(),
                    ManagedSeatSummaries = x.RoomUsers
                        .Where(ru => ru.ManagedRoomStudentId != null)
                        .Select(ru => new RoomManagedSeatSummary
                        {
                            RoomUserId = ru.UserId,
                            ManagedRoomStudentId = ru.ManagedRoomStudentId!.Value,
                            IsBlocked = ru.IsBlocked
                        })
                        .ToList()
                }).SingleOrDefaultAsync();
        }

        public async Task<List<GetRoomFilesByRoomIdQri>> GetRoomFilesByRoomIdExecuteAsync(GetRoomFilesByRoomIdQuery query)
        {
            return await _dbContext.RoomFiles
                .AsNoTracking()
                .Where(x => x.RoomId == query.RoomId)
                .OrderBy(x => x.FileType)
                .ThenBy(x => x.Title)
                .ThenBy(x => x.FileName)
                .Select(x => new GetRoomFilesByRoomIdQri
                {
                    Id = x.Id,
                    RoomId = x.RoomId,
                    FileType = x.FileType,
                    Title = x.Title,
                    Description = x.Description,
                    FileName = x.FileName,
                    FileUrl = x.FileUrl,
                    FileSize = x.FileSize,
                    UploadedByUserId = x.UploadedByUserId
                }).ToListAsync();
        }

        public async Task<PagedData<GetAllMessageWithRoomIdQri>> GetAllMessageWithRoomId(GetAllMessageWithRoomIdQuery query)
        {
            var result = new PagedData<GetAllMessageWithRoomIdQri>();
            var messages = _dbContext.Rooms.AsNoTracking()
                .Where(r => r.RoomId == query.RoomId).SelectMany(r => r.Messages);
            var roomUsers = _dbContext.Rooms.Where(r => r.RoomId == query.RoomId).SelectMany(r => r.RoomUsers);
            var rows = messages.Select(m => new
            {
                m.MessageId, m.SenderId, m.MessageText, m.SendAt,
                UserName = roomUsers.Where(u => u.UserId.ToString() == m.SenderId).Select(u => u.UserName).FirstOrDefault()
                    ?? _dbContext.Users.Where(u => u.Id.ToString() == m.SenderId).Select(u => u.UserName).FirstOrDefault()
                    ?? "ناشناس"
            });
            if (!string.IsNullOrWhiteSpace(query.InputValue))
            {
                var keyword = query.InputValue.Trim().ToLowerInvariant();
                rows = rows.Where(m => m.UserName.ToLower().Contains(keyword) || m.MessageText.ToLower().Contains(keyword));
            }
            if (query.NeedTotalCount) result.TotalCount = await rows.CountAsync();
            var pageSize = Math.Clamp(query.PageSize, 1, 100);
            var pageNumber = Math.Clamp(query.PageNumber, 1, int.MaxValue / pageSize);
            var page = await rows.OrderBy(m => m.SendAt).ThenBy(m => m.MessageId)
                .Skip((pageNumber - 1) * pageSize).Take(pageSize).ToListAsync();
            result.QueryResult = page.Select(m => new GetAllMessageWithRoomIdQri
            {
                SenderId = m.SenderId, MessageText = m.MessageText,
                SendAt = m.SendAt.ToString("yyyy/MM/dd - HH:mm"), UserName = m.UserName
            }).ToList();
            return result;
        }
    }
}
