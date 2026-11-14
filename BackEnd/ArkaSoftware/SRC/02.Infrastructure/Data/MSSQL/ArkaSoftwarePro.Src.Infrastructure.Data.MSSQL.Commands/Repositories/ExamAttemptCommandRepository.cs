using ArkaSoftwarePro.Src.Core.Contracts.Exams.ExamRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.ExamAttemptAggregate.Entities;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories;

public class ExamAttemptCommandRepository(ArkaSoftwareCommandDbContext dbContext)
    : BaseCommandRepository<ExamAttempt, ArkaSoftwareCommandDbContext>(dbContext), IExamAttemptCommandRepository
{
    public async Task<ExamAttempt?> GetByIdWithAnswersAsync(long attemptId)
    {
        return await _dbContext.ExamAttempts
            .Include(x => x.Answers)
            .FirstOrDefaultAsync(x => x.Id == attemptId && !x.IsDelete);
    }

    public async Task<ExamAttempt?> GetByExamAndStudentAsync(long examId, long studentId)
    {
        return await _dbContext.ExamAttempts
            .Include(x => x.Answers)
            .FirstOrDefaultAsync(x => x.ExamId == examId && x.StudentId == studentId && !x.IsDelete);
    }

    public async Task<bool> ExistsForExamAndStudentAsync(long examId, long studentId)
    {
        return await _dbContext.ExamAttempts
            .AsNoTracking()
            .AnyAsync(x => x.ExamId == examId && x.StudentId == studentId && !x.IsDelete);
    }
}
