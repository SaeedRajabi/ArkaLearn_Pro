using System.Text.Json;
using ArkaSoftwarePro.Src.Core.Contracts.Seminars.SeminarRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.CanUserEnterSeminar;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.GetAllCommentsBySeminarId;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.GetSeminarById;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.GetAllSeminarRegistrations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.GetMyRegisteredSeminars;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.GetSeminarRegistrations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.SearchSeminars;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.SearchUserSeminars;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.GetMyFavoriteSeminarIds;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.GetMyFavoriteSeminars;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Common;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Seminars;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.DateTimes;
using Framework.Src.Infrastructure.Data.MSSQL.Queries.QueryRepositories;
using Framework.Src.Utilities.OutService.Extensions;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Repositories
{
    public class SeminarQueryRepository(ArkaSoftwareQueryDbContext dbContext)
        : BaseQueryRepository<ArkaSoftwareQueryDbContext>(dbContext), ISeminarQueriesRepository
    {
        public async Task<SeminarQri> GetSeminarByIdExecuteAsync(GetSeminarByIdQuery query)
        {
            var seminar = await _dbContext.Seminars
                .AsNoTracking()
                .Include(x => x.Room)
                    .ThenInclude(r => r!.User)
                        .ThenInclude(u => u.Teacher)
                            .ThenInclude(t => t!.TeacherEducations)
                .Include(x => x.Tags)
                .Include(x => x.Registrations)
                .FirstOrDefaultAsync(x => x.Id == query.SeminarId);
            if (seminar == null)
                return null!;

            var tagNames = seminar.Tags.Select(t => t.TagName).ToList();
            var tagsJson = tagNames.Count > 0 ? JsonSerializer.Serialize(tagNames) : null;

            var roomUser = seminar.Room?.User;
            var fullName = roomUser != null
                ? $"{roomUser.FirstName ?? ""} {roomUser.LastName ?? ""}".Trim()
                : null;
            var teacher = roomUser?.Teacher;
            var instructorBio = teacher?.LongDescription;
            var instructorTitle = teacher?.TeacherEducations?.FirstOrDefault()?.NameOfInstitutionOrUniversity;

            var utcNow = DateTime.UtcNow;
            var isExpired = utcNow > seminar.EndTime;
            var canRegister = seminar.IsPublic
                && seminar.Status is 1 or 2
                && !isExpired
                && (seminar.Registrations?.Count ?? 0) < seminar.Capacity;

            return new SeminarQri
            {
                Id = seminar.Id,
                Title = seminar.Title ?? "",
                Description = seminar.Description ?? "",
                StartTime = seminar.StartTime,
                EndTime = seminar.EndTime,
                Capacity = seminar.Capacity,
                RegisteredCount = seminar.Registrations?.Count ?? 0,
                Price = seminar.Price ?? 0,
                IsFree = seminar.IsFree,
                Status = seminar.Status,
                EntryLink = seminar.EntryLink,
                ThumbnailUrl = seminar.ThumbnailUrl,
                SeoTitle = seminar.SeoTitle,
                MetaDescription = seminar.MetaDescription,
                OgImageUrl = seminar.OgImageUrl,
                VideoUrl = seminar.VideoUrl,
                RecordingVideoUrl = null,
                IsPublic = seminar.IsPublic,
                IsExpired = isExpired,
                CanRegister = canRegister,
                HasRecording = !string.IsNullOrWhiteSpace(seminar.RecordingVideoUrl),
                TagsJson = tagsJson,
                Prerequisites = seminar.Prerequisites,
                FaqsJson = seminar.FaqsJson,
                RoomId = seminar.RoomId,
                RoomTitle = seminar.Room?.Title,
                RoomLink = seminar.Room?.ClassRoomLink,
                InstructorName = fullName,
                InstructorAvatarUrl = roomUser?.ProfileImage,
                InstructorTitle = instructorTitle,
                InstructorBio = instructorBio
            };
        }

        public async Task<PagedData<SearchSeminarQri>?> SearchSeminarExecuteAsync(SearchSeminarByInputValueQuery query)
        {
            var q = _dbContext.Seminars
                .AsNoTracking()
                .Include(x => x.Registrations)
                .Include(x => x.Room)
                .Where(x => true);

            if (!string.IsNullOrWhiteSpace(query.InputValue))
                q = q.Where(x => (x.Title != null && x.Title.Contains(query.InputValue)) || (x.Description != null && x.Description.Contains(query.InputValue)));
            if (query.Status.HasValue)
                q = q.Where(x => x.Status == query.Status.Value);
            if (query.OnlyClientVisible)
            {
                // Client catalog: public seminars that are not draft/cancelled (include upcoming, live, and archived with recording).
                q = q.Where(x => x.IsPublic && x.Status != 0 && x.Status != 4);
            }
            if (query.From.HasValue)
                q = q.Where(x => x.StartTime >= query.From.Value);
            if (query.To.HasValue)
                q = q.Where(x => x.EndTime <= query.To.Value);

            var ordered = q.OrderBy(x => x.StartTime);
            var result = new PagedData<SearchSeminarQri?>();
            if (query.NeedTotalCount)
                result.TotalCount = await ordered.CountAsync();

            var list = await ordered
                .Skip(query.SkipCount)
                .Take(query.PageSize)
                .Select(x => new SearchSeminarQri
                {
                    Id = x.Id,
                    Title = x.Title ?? "",
                    Description = x.Description,
                    StartTime = x.StartTime,
                    EndTime = x.EndTime,
                    Capacity = x.Capacity,
                    RegisteredCount = x.Registrations.Count,
                    Price = x.Price ?? 0,
                    IsFree = x.IsFree,
                    Status = x.Status,
                    IsPublic = x.IsPublic,
                    ThumbnailUrl = x.ThumbnailUrl,
                    RoomId = x.RoomId,
                    RoomTitle = x.Room != null ? x.Room.Title : null
                })
                .ToListAsync();
            result.QueryResult = list!;
            return result!;
        }

        public async Task<PagedData<SearchSeminarQri>?> SearchUserSeminarsExecuteAsync(SearchUserSeminarsQuery query)
        {
            if (query.TeacherUserId <= 0)
                return new PagedData<SearchSeminarQri?> { QueryResult = [], TotalCount = 0 };

            var q = _dbContext.Seminars
                .AsNoTracking()
                .Include(x => x.Registrations)
                .Include(x => x.Room)
                .Where(x => x.RoomId != null && x.Room != null && x.Room.UserId == query.TeacherUserId);

            var ordered = q.OrderByDescending(x => x.StartTime);
            var result = new PagedData<SearchSeminarQri?>();
            if (query.NeedTotalCount)
                result.TotalCount = await ordered.CountAsync();

            var list = await ordered
                .Skip(query.SkipCount)
                .Take(query.PageSize)
                .Select(x => new SearchSeminarQri
                {
                    Id = x.Id,
                    Title = x.Title ?? "",
                    Description = x.Description,
                    StartTime = x.StartTime,
                    EndTime = x.EndTime,
                    Capacity = x.Capacity,
                    RegisteredCount = x.Registrations.Count,
                    Price = x.Price ?? 0,
                    IsFree = x.IsFree,
                    Status = x.Status,
                    IsPublic = x.IsPublic,
                    ThumbnailUrl = x.ThumbnailUrl,
                    RoomId = x.RoomId,
                    RoomTitle = x.Room != null ? x.Room.Title : null
                })
                .ToListAsync();

            result.QueryResult = list!;
            return result!;
        }

        public async Task<PagedData<SeminarRegistrationQri>> GetSeminarRegistrationsAsync(GetSeminarRegistrationsQuery query)
        {
            var seminar = await _dbContext.Seminars
                .AsNoTracking()
                .Include(x => x.Registrations)
                .ThenInclude(x => x.User)
                .FirstOrDefaultAsync(x => x.Id == query.SeminarId);

            var regs = seminar?.Registrations ?? new List<SeminarRegistrationQueryModel>();
            var result = new PagedData<SeminarRegistrationQri>();
            result.TotalCount = regs.Count;
            var list = regs
                .Skip(query.SkipCount)
                .Take(query.PageSize)
                .Select(r => new SeminarRegistrationQri
                {
                    Id = r.Id,
                    UserId = r.UserId,
                    UserFullName = r.User != null ? $"{r.User.FirstName} {r.User.LastName}" : null,
                    UserName = r.User != null ? r.User.UserName : null,
                    Email = r.User != null ? r.User.Email : null,
                    HasPaid = r.HasPaid,
                    RegisteredAt = r.RegisteredAt.ToPersianDateTimeString("yyyy/MM/dd - HH:mm")
                })
                .ToList();
            result.QueryResult = list;
            return result;
        }

        public async Task<PagedData<SeminarRegistrationWithSeminarQri>> GetAllSeminarRegistrationsAsync(GetAllSeminarRegistrationsQuery query)
        {
            var q = _dbContext.Seminars
                .AsNoTracking()
                .Include(x => x.Registrations)
                .ThenInclude(x => x.User)
                .Where(s => query.SeminarId == 0 || s.Id == query.SeminarId)
                .SelectMany(s => s.Registrations.Select(r => new
                {
                    RegistrationId = r.Id,  // تغییر نام Id به RegistrationId
                    UserId = r.UserId,
                    User = r.User,
                    HasPaid = r.HasPaid,
                    RegisteredAt = r.RegisteredAt,
                    SeminarId = s.Id,  // تغییر نام Id به SeminarId
                    SeminarTitle = s.Title
                }))
                .OrderByDescending(x => x.RegisteredAt);

            var result = new PagedData<SeminarRegistrationWithSeminarQri>();

            if (query.NeedTotalCount)
                result.TotalCount = await q.CountAsync();

            // داده‌ها را از پایگاه داده دریافت می‌کنیم و عملیات ToString() را بعد از آن انجام می‌دهیم.
            var list = await q.Skip(query.SkipCount).Take(query.PageSize).ToListAsync();

            result.QueryResult = list.Select(r => new SeminarRegistrationWithSeminarQri
            {
                Id = r.RegistrationId,  // تغییر نام RegistrationId به Id
                UserId = r.UserId,
                UserFullName = r.User != null ? (r.User.FirstName + " " + r.User.LastName).Trim() : null,
                UserName = r.User != null ? r.User.UserName : null,
                Email = r.User != null ? r.User.Email : null,
                SeminarId = r.SeminarId,  // تغییر نام SeminarId
                SeminarTitle = r.SeminarTitle,  // تغییر نام SeminarTitle
                HasPaid = r.HasPaid,
                RegisteredAt = r.RegisteredAt.ToString("yyyy/MM/dd - HH:mm")
            }).ToList();

            result.PageNumber = query.PageNumber;
            result.PageSize = query.PageSize;

            if (!query.NeedTotalCount)
                result.TotalCount = list.Count;

            return result;
        }

        public async Task<List<MyRegisteredSeminarQri>> GetMyRegisteredSeminarsAsync(GetMyRegisteredSeminarsQuery query)
        {
            var userEmail = await _dbContext.Users
                .AsNoTracking()
                .Where(u => u.Id == query.UserId)
                .Select(u => u.Email ?? "")
                .FirstOrDefaultAsync() ?? "";

            var seminars = await _dbContext.Seminars
                .AsNoTracking()
                .Where(s => s.Registrations.Any(r => r.UserId == query.UserId))
                .Include(s => s.Registrations)
                .Include(s => s.Room)
                    .ThenInclude(r => r!.RoomUsers)
                .ToListAsync();

            var list = new List<MyRegisteredSeminarQri>();
            foreach (var seminar in seminars)
            {
                var userRegs = seminar.Registrations.Where(r => r.UserId == query.UserId).ToList();
                var roomUserName = seminar.Room?.RoomUsers?
                    .FirstOrDefault(ru => string.Equals(ru.UserName, userEmail, StringComparison.OrdinalIgnoreCase))?.UserName ?? userEmail;
                foreach (var reg in userRegs)
                {
                    list.Add(new MyRegisteredSeminarQri
                    {
                        SeminarId = seminar.Id,
                        SeminarTitle = seminar.Title,
                        StartTime = seminar.StartTime,
                        EndTime = seminar.EndTime,
                        RoomLink = seminar.Room?.ClassRoomLink,
                        RoomUserName = roomUserName,
                        RegisteredAt = reg.RegisteredAt.ToString("yyyy/MM/dd - HH:mm"),
                        HasPaid = reg.HasPaid
                    });
                }
            }

            return list.OrderByDescending(x => x.StartTime).ToList();
        }

        public async Task<PagedData<GetAllCommentsBySeminarIdQri>> GetAllSeminarCommentsByIdAsync(GetAllCommentsBySeminarIdQuery query)
        {
            var seminar = await _dbContext.Seminars
                .Include(x => x.Comments)
                .ThenInclude(x => x.User)
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == query.SeminarId);

            var comments = seminar?.Comments ?? new List<ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Seminars.SeminarCommentQueryModel>();
            if (query.OnlyApproved == true)
                comments = comments.Where(x => x.IsApproved).ToList();

            var items = comments
                .Select(c => new GetAllCommentsBySeminarIdQri
                {
                    Id = c.Id,
                    Author = c.User != null ? new SeminarCommentAuthorQri
                    {
                        Id = c.User.Id,
                        AvatarUrl = c.User.ProfileImage ?? "",
                        FullName = $"{c.User.FirstName} {c.User.LastName}",
                        UserName = c.User.UserName ?? ""
                    } : null,
                    Text = c.CommentText ?? "",
                    Likes = c.Likes,
                    ParentId = c.ParentId,
                    Rating = c.Rating,
                    IsApproved = c.IsApproved,
                    TimeStamp = c.CreateAt.ToPersianDateTimeString("yyyy/MM/dd - HH:mm")
                }).ToList();

            var dict = items.ToDictionary(x => x.Id);
            var roots = new List<GetAllCommentsBySeminarIdQri>();
            foreach (var node in items)
            {
                if (node.ParentId == null)
                {
                    roots.Add(node);
                    continue;
                }
                if (dict.TryGetValue(node.ParentId.Value, out var parent))
                    parent.Replies.Add(node);
                else
                    roots.Add(node);
            }
            var result = new PagedData<GetAllCommentsBySeminarIdQri>();
            result.QueryResult = roots.Where(c => c.ParentId == null).Skip(query.SkipCount).Take(query.PageSize).ToList();
            result.TotalCount = roots.Count;
            return result;
        }

        public async Task<CanUserEnterSeminarQri> CanUserEnterSeminarAsync(CanUserEnterSeminarQuery query)
        {
            var seminar = await _dbContext.Seminars
                .AsNoTracking()
                .Include(x => x.Registrations)
                .Include(x => x.Room)
                .FirstOrDefaultAsync(x => x.Id == query.SeminarId);

            if (seminar == null)
                return new CanUserEnterSeminarQri { CanEnter = false, Reason = "Seminar not found." };

            if (seminar.RoomId == null || seminar.Room == null)
                return new CanUserEnterSeminarQri { CanEnter = false, Reason = "No online room is assigned to this seminar." };

            var now = seminar.EndTime.Kind == DateTimeKind.Utc ? DateTime.UtcNow : DateTime.Now;
            if (now > seminar.EndTime)
                return new CanUserEnterSeminarQri { CanEnter = false, Reason = "This seminar and its online room have expired." };

            var reg = seminar.Registrations.FirstOrDefault(r => r.UserId == query.UserId);
            if (reg == null)
                return new CanUserEnterSeminarQri { CanEnter = false, Reason = "You are not registered for this seminar." };
            if (!seminar.IsFree && !reg.HasPaid)
                return new CanUserEnterSeminarQri { CanEnter = false, Reason = "Payment required." };

            return new CanUserEnterSeminarQri
            {
                CanEnter = true,
                EntryLink = seminar.Room.ClassRoomLink
            };
        }

        public async Task<List<long>> GetMyFavoriteSeminarIdsAsync(GetMyFavoriteSeminarIdsQuery query)
        {
            if (query.UserId <= 0)
                return new List<long>();

            return await _dbContext.FavoriteSeminars
                .AsNoTracking()
                .Where(x => x.UserId == query.UserId)
                .Select(x => x.SeminarId)
                .ToListAsync();
        }

        public async Task<List<GetMyFavoriteSeminarQri>> GetMyFavoriteSeminarsAsync(GetMyFavoriteSeminarsQuery query)
        {
            if (query.UserId <= 0)
                return new List<GetMyFavoriteSeminarQri>();

            var result = await _dbContext.FavoriteSeminars
                .AsNoTracking()
                .Where(x => x.UserId == query.UserId)
                .OrderByDescending(x => x.CreatedAt)
                .Select(x => x.Seminar!)
                .Select(x => new GetMyFavoriteSeminarQri
                {
                    Id = x.Id,
                    Title = x.Title ?? "",
                    Description = x.Description,
                    StartTime = x.StartTime,
                    EndTime = x.EndTime,
                    Capacity = x.Capacity,
                    RegisteredCount = x.Registrations.Count,
                    Price = x.Price ?? 0,
                    IsFree = x.IsFree,
                    Status = x.Status,
                    ThumbnailUrl = x.ThumbnailUrl,
                    RoomId = x.RoomId,
                    RoomTitle = x.Room != null ? x.Room.Title : null
                })
                .ToListAsync();

            return result;
        }
    }
}
