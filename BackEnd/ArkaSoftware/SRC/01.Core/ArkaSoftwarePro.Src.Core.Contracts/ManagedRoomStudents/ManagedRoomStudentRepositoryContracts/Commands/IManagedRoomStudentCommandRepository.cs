using ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Entities;
using Framework.Src.Core.Contracts.Data.Commands;

namespace ArkaSoftwarePro.Src.Core.Contracts.ManagedRoomStudents.ManagedRoomStudentRepositoryContracts.Commands;

public interface IManagedRoomStudentCommandRepository : ICommandRepository<ManagedRoomStudent, long>
{
    Task<ManagedRoomStudent?> GetByIdOrDefaultAsync(long id);

    Task<ManagedRoomStudent?> GetByIdIncludingDeletedAsync(long id);

    Task<ManagedRoomStudent?> FindActiveByUserNameOrEmailAsync(string userName, string? email);
}