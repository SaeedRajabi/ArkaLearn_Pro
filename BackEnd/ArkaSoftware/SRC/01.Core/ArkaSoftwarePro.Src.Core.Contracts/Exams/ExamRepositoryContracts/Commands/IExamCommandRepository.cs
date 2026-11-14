using ArkaSoftwarePro.Src.Core.Domain.ExamAggregate.Entities;
using Framework.Src.Core.Contracts.Data.Commands;

namespace ArkaSoftwarePro.Src.Core.Contracts.Exams.ExamRepositoryContracts.Commands;

public interface IExamCommandRepository : ICommandRepository<Exam, long>
{
    Task<Exam?> GetByIdWithDetailsAsync(long examId);
    Task<bool> IsOwnedByTeacherAsync(long examId, long teacherId);
}
