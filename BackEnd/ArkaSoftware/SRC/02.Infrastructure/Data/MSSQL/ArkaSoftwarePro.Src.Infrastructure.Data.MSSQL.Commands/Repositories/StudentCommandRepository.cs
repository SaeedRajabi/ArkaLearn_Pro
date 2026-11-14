using ArkaSoftwarePro.Src.Core.Contracts.Students.StudentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.StudentAggregate.Entities;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories
{
    public class StudentCommandRepository(ArkaSoftwareCommandDbContext dbContext)
        : BaseCommandRepository<Student, ArkaSoftwareCommandDbContext>(dbContext), IStudentCommandRepository
    {
        public async Task<Student?> GetByUserIdAsync(long userId, CancellationToken cancellationToken = default)
        {
            return await _dbContext.Students
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.UserId == userId, cancellationToken);
        }

        public async Task<Student?> GetByIdAsync(long studentId, CancellationToken cancellationToken = default)
        {
            return await _dbContext.Students
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.Id == studentId, cancellationToken);
        }
    }
}
