using ArkaSoftwarePro.Src.Core.Domain.SeminarAggregate.Entities;
using Framework.Src.Core.Contracts.Data.Commands;

namespace ArkaSoftwarePro.Src.Core.Contracts.Seminars.SeminarRepositoryContracts.Commands
{
    public interface ISeminarCommandRepository : ICommandRepository<Seminar, long>
    {
        Task<SeminarRoomAccessGate> GetRoomAccessGateAsync(long roomId, string userNameOrEmail);
        Task SyncTagsAsync(long seminarId, IReadOnlyCollection<string> tagNames);
        Task<List<Seminar>> GetTeacherSeminarsWithRegistrationsAsync(long teacherUserId);
    }

    public sealed record SeminarRoomAccessGate(
        bool HasLinkedSeminar,
        bool HasRegisteredSeminar,
        bool HasPaid,
        bool IsFree,
        long? SeminarId,
        DateTime? StartTime,
        DateTime? EndTime);
}
