using ArkaSoftwarePro.Src.Core.RequestResponse.ManagedRoomStudents.Queries.GetManagedRoomStudentsPaged;
using Framework.Src.Core.Contracts.Data.Queries;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.Contracts.ManagedRoomStudents.ManagedRoomStudentRepositoryContracts.Queries;

public interface IManagedRoomStudentQueryRepository : IQueryRepository
{
    Task<PagedData<GetManagedRoomStudentsPagedQri>?> SearchPagedAsync(GetManagedRoomStudentsPagedQuery query);
    Task<bool> IsInTeacherScopeAsync(long teacherUserId, long managedStudentId, CancellationToken cancellationToken = default);
    Task<ManagedStudentPortalContact?> FindPortalContactByManagedStudentIdAsync(
        long managedStudentId,
        CancellationToken cancellationToken = default);
    Task<List<long>> GetTeacherUserIdsForManagedStudentAsync(
        long managedStudentId,
        CancellationToken cancellationToken = default);
}

public sealed class ManagedStudentPortalContact
{
    public long UserId { get; init; }
    public string? PhoneNumber { get; init; }
}
