using ArkaSoftwarePro.Src.Core.Contracts.Students.StudentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UnitOfWorkContracts;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.UnitOfWorks
{
    public class UsersUnitOfWork(
        ArkaSoftwareCommandDbContext dbContext,
        IStudentCommandRepository studentCommandRepository,
        ITeacherCommandRepository teacherCommandRepository,
        IUserCommandRepository userCommandRepository)
        : BaseEntityFrameworkUnitOfWork<ArkaSoftwareCommandDbContext>(dbContext), IUserUnitOfWork
    {
        public IStudentCommandRepository StudentCommandRepository { get; } = studentCommandRepository;
        public ITeacherCommandRepository TeacherCommandRepository { get; } = teacherCommandRepository;
        public IUserCommandRepository UserCommandRepository { get; } = userCommandRepository;
    }
}
