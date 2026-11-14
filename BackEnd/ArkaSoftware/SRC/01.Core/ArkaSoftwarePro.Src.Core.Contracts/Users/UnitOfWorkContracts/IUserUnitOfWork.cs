using ArkaSoftwarePro.Src.Core.Contracts.Students.StudentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Commands;
using Framework.Src.Core.Contracts.Data.Commands;

namespace ArkaSoftwarePro.Src.Core.Contracts.Users.UnitOfWorkContracts
{
    public interface IUserUnitOfWork : IUnitOfWork
    {
        IStudentCommandRepository StudentCommandRepository { get; }
        ITeacherCommandRepository TeacherCommandRepository { get; }
        IUserCommandRepository UserCommandRepository { get; }
    }
}
