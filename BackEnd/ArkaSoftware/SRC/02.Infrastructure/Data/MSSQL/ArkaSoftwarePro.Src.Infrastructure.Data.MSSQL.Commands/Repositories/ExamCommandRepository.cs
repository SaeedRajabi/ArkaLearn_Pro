using ArkaSoftwarePro.Src.Core.Contracts.Exams.ExamRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.ExamAggregate.Entities;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories;

public class ExamCommandRepository(ArkaSoftwareCommandDbContext dbContext)
    : BaseCommandRepository<Exam, ArkaSoftwareCommandDbContext>(dbContext), IExamCommandRepository
{
    public async Task<Exam?> GetByIdWithDetailsAsync(long examId)
    {
        return await _dbContext.Exams
            .Include(x => x.Questions)
                .ThenInclude(q => q.Options)
            .Include(x => x.Assignments)
            .FirstOrDefaultAsync(x => x.Id == examId && !x.IsDelete);
    }

    public async Task<bool> IsOwnedByTeacherAsync(long examId, long teacherId)
    {
        return await _dbContext.Exams
            .AsNoTracking()
            .AnyAsync(x => x.Id == examId && x.TeacherId == teacherId && !x.IsDelete);
    }
}
