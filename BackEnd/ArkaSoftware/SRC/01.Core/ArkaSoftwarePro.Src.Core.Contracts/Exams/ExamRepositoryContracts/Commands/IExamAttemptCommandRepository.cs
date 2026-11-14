using ArkaSoftwarePro.Src.Core.Domain.ExamAttemptAggregate.Entities;
using Framework.Src.Core.Contracts.Data.Commands;

namespace ArkaSoftwarePro.Src.Core.Contracts.Exams.ExamRepositoryContracts.Commands;

public interface IExamAttemptCommandRepository : ICommandRepository<ExamAttempt, long>
{
    Task<ExamAttempt?> GetByIdWithAnswersAsync(long attemptId);
    Task<ExamAttempt?> GetByExamAndStudentAsync(long examId, long studentId);
    Task<bool> ExistsForExamAndStudentAsync(long examId, long studentId);
}
