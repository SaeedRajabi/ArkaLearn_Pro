using ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Entities;

namespace ArkaSoftwarePro.Src.Core.Contracts.ManagedRoomStudents.Services;

/// <summary>
/// Removes portal identity rows linked to a catalog managed room student (same credential matching as create flow).
/// Implementations enqueue EF changes only; callers issue SaveChanges.
/// </summary>
public interface IManagedRoomStudentLinkedIdentityRemover
{
    Task RemoveLinkedPortalIdentityAsync(ManagedRoomStudent managed, CancellationToken cancellationToken = default);
}
