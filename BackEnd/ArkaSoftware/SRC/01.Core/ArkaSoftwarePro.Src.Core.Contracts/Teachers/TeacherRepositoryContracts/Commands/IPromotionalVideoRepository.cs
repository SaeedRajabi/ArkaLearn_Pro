using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;

namespace ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;

public interface IPromotionalVideoRepository
{
    Task CommitAsync();
    Task<TeacherPromotionalVideo?> GetVideoByIdAsync(long videoId);
    Task<TeacherPromotionalVideo?> GetVideoWithTeacherAsync(long videoId);
    Task<bool> HasUserLikedAsync(long videoId, long userId);
    Task AddLikeAsync(TeacherPromotionalVideoLike like);
    Task RemoveLikeAsync(long videoId, long userId);
    Task<TeacherPromotionalVideoComment> AddCommentAsync(TeacherPromotionalVideoComment comment);
    Task<List<TeacherPromotionalVideoComment>> GetCommentsByVideoIdAsync(long videoId);
    Task<int> GetCommentCountAsync(long videoId);
    Task<List<TeacherPromotionalVideo>> GetAllVideosForAdminEditAsync(CancellationToken cancellationToken = default);
}
