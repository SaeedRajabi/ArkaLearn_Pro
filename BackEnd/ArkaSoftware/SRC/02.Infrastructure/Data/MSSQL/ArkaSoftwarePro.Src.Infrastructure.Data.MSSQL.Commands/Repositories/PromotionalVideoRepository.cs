using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories;

public class PromotionalVideoRepository(ArkaSoftwareCommandDbContext dbContext) : IPromotionalVideoRepository
{
    public Task CommitAsync() => dbContext.SaveChangesAsync();

    public Task<TeacherPromotionalVideo?> GetVideoByIdAsync(long videoId) =>
        dbContext.Set<TeacherPromotionalVideo>()
            .FirstOrDefaultAsync(v => v.Id == videoId);

    public Task<TeacherPromotionalVideo?> GetVideoWithTeacherAsync(long videoId) =>
        dbContext.Set<TeacherPromotionalVideo>()
            .Include(v => v.Teacher!)
                .ThenInclude(t => t!.Advertisement)
            .FirstOrDefaultAsync(v => v.Id == videoId);

    public Task<bool> HasUserLikedAsync(long videoId, long userId) =>
        dbContext.Set<TeacherPromotionalVideoLike>()
            .AnyAsync(x => x.VideoId == videoId && x.UserId == userId);

    public async Task AddLikeAsync(TeacherPromotionalVideoLike like) =>
        await dbContext.Set<TeacherPromotionalVideoLike>().AddAsync(like);

    public async Task RemoveLikeAsync(long videoId, long userId)
    {
        var like = await dbContext.Set<TeacherPromotionalVideoLike>()
            .FirstOrDefaultAsync(x => x.VideoId == videoId && x.UserId == userId);
        if (like != null)
            dbContext.Set<TeacherPromotionalVideoLike>().Remove(like);
    }

    public async Task<TeacherPromotionalVideoComment> AddCommentAsync(TeacherPromotionalVideoComment comment)
    {
        await dbContext.Set<TeacherPromotionalVideoComment>().AddAsync(comment);
        return comment;
    }

    public Task<List<TeacherPromotionalVideoComment>> GetCommentsByVideoIdAsync(long videoId) =>
        dbContext.Set<TeacherPromotionalVideoComment>()
            .Where(c => c.VideoId == videoId)
            .OrderByDescending(c => c.Id)
            .ToListAsync();

    public Task<int> GetCommentCountAsync(long videoId) =>
        dbContext.Set<TeacherPromotionalVideoComment>()
            .CountAsync(c => c.VideoId == videoId);

    public Task<List<TeacherPromotionalVideo>> GetAllVideosForAdminEditAsync(CancellationToken cancellationToken = default) =>
        dbContext.Set<TeacherPromotionalVideo>()
            .AsNoTracking()
            .Include(v => v.Teacher!)
                .ThenInclude(t => t!.User)
            .OrderBy(v => v.SortOrder)
            .ThenByDescending(v => v.Id)
            .ToListAsync(cancellationToken);
}
