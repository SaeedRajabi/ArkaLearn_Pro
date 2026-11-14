namespace ArkaSoftwarePro.Src.Core.Contracts.Services;

public interface IEntityTitleUniquenessChecker
{
    Task<bool> SeminarTitleExistsAsync(string title, long? excludeId = null, CancellationToken cancellationToken = default);
    Task<bool> ArticleTitleExistsAsync(string title, long? excludeId = null, CancellationToken cancellationToken = default);
    Task<bool> CourseTitleExistsAsync(string title, long? excludeId = null, CancellationToken cancellationToken = default);
    Task<bool> CategoryTitleExistsAsync(string title, long? excludeId = null, CancellationToken cancellationToken = default);
    Task<bool> RoomTitleExistsAsync(string title, long? excludeId = null, CancellationToken cancellationToken = default);
    Task<bool> ProjectTitleExistsAsync(string title, long? excludeId = null, CancellationToken cancellationToken = default);
}
