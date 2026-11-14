namespace ArkaSoftwarePro.Src.Core.Contracts.Services;

public interface IEntityPermanentDeletionService
{
    Task<bool> PermanentlyDeleteArticleAsync(long articleId, CancellationToken cancellationToken = default);
    Task<bool> PermanentlyDeleteSeminarAsync(long seminarId, CancellationToken cancellationToken = default);
    Task<bool> PermanentlyDeleteCourseAsync(long courseId, CancellationToken cancellationToken = default);
    Task<bool> PermanentlyDeleteRoomAsync(long roomId, CancellationToken cancellationToken = default);
    Task<bool> PermanentlyDeleteCategoryAsync(long categoryId, CancellationToken cancellationToken = default);
    Task<bool> PermanentlyDeleteProjectAsync(long projectId, CancellationToken cancellationToken = default);
}
