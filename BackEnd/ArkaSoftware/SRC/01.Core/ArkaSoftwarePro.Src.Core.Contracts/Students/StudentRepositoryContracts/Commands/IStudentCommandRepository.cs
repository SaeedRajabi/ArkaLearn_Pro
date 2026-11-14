using ArkaSoftwarePro.Src.Core.Domain.StudentAggregate.Entities;
using Framework.Src.Core.Contracts.Data.Commands;

namespace ArkaSoftwarePro.Src.Core.Contracts.Students.StudentRepositoryContracts.Commands
{
    public interface IStudentCommandRepository:ICommandRepository<Student , long>
    {
        Task<Student?> GetByUserIdAsync(long userId, CancellationToken cancellationToken = default);
        Task<Student?> GetByIdAsync(long studentId, CancellationToken cancellationToken = default);
    }
}
