using ArkaSoftwarePro.Src.Core.Domain.SoftwareAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Software.Queries.SearchSoftware;
using Framework.Src.Core.Contracts.Data.Commands;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.Contracts.Software.SoftwareRepositoryContracts.Commands;

public interface ISoftwareCommandRepository : ICommandRepository<SoftwareProduct, long>
{
    Task<SoftwareProduct?> GetBySlugAsync(string slug, CancellationToken cancellationToken = default);
    Task<SoftwareProduct?> GetWithTeacherAsync(long id, CancellationToken cancellationToken = default);
    Task<List<SoftwareProduct>> GetByTeacherIdAsync(long teacherId, CancellationToken cancellationToken = default);
    Task<PagedData<SoftwareListItemQri>> SearchPublicAsync(SearchSoftwareQuery query, long? viewerUserId, CancellationToken cancellationToken = default);
    Task<bool> HasUserLikedAsync(long softwareId, long userId, CancellationToken cancellationToken = default);
    Task AddLikeAsync(SoftwareProductLike like, CancellationToken cancellationToken = default);
    Task RemoveLikeAsync(long softwareId, long userId, CancellationToken cancellationToken = default);
    Task<List<string>> GetCategoryPathAsync(long? categoryId, CancellationToken cancellationToken = default);
}
