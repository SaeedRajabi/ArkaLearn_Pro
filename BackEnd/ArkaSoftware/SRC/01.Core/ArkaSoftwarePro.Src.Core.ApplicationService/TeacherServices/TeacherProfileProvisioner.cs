using ArkaSoftwarePro.Src.Core.Contracts.Students.StudentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.StudentAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Enumerations;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;

internal static class TeacherProfileProvisioner
{
    public static async Task<Teacher?> EnsureTeacherRecordAsync(
        long userId,
        IUserCommandRepository userCommandRepository,
        ITeacherCommandRepository teacherCommandRepository,
        IStudentCommandRepository studentCommandRepository,
        CancellationToken cancellationToken = default)
    {
        var existing = await FindExistingTeacherAsync(userId, teacherCommandRepository, cancellationToken);
        if (existing != null)
        {
            if (existing.UserId.HasValue && existing.UserId.Value > 0)
                await EnsureStudentRecordAsync(existing.UserId.Value, studentCommandRepository, cancellationToken);
            return existing;
        }

        if (userId <= 0)
            return null;

        var user = await userCommandRepository.GetAsync(userId);
        if (user == null || user.Id <= 0)
            return null;

        if (user.Role is not (UserRole.TEACHER or UserRole.ADMIN))
            return null;

        var teacher = Teacher.Create(userId, string.Empty);
        await teacherCommandRepository.InsertAsync(teacher);
        await teacherCommandRepository.CommitAsync();
        await EnsureStudentRecordAsync(userId, studentCommandRepository, cancellationToken);
        return teacher;
    }

    public static async Task<Teacher?> EnsureTeacherRecordByUserNameAsync(
        string userName,
        IUserCommandRepository userCommandRepository,
        ITeacherCommandRepository teacherCommandRepository,
        IStudentCommandRepository studentCommandRepository,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(userName))
            return null;

        var user = userCommandRepository.FindByUserNameAsync(userName.Trim());
        if (user == null || user.Id <= 0)
            return null;

        return await EnsureTeacherRecordAsync(
            user.Id,
            userCommandRepository,
            teacherCommandRepository,
            studentCommandRepository,
            cancellationToken);
    }

    private static async Task<Teacher?> FindExistingTeacherAsync(
        long userOrTeacherId,
        ITeacherCommandRepository teacherCommandRepository,
        CancellationToken cancellationToken)
    {
        if (userOrTeacherId <= 0)
            return null;

        var byUserId = await teacherCommandRepository.GetByUserIdWithDetailsAsync(userOrTeacherId, cancellationToken);
        if (byUserId != null)
            return byUserId;

        return await teacherCommandRepository.GetByIdWithDetailsAsync(userOrTeacherId, cancellationToken);
    }

    private static async Task EnsureStudentRecordAsync(
        long userId,
        IStudentCommandRepository studentCommandRepository,
        CancellationToken cancellationToken)
    {
        var student = await studentCommandRepository.GetByUserIdAsync(userId, cancellationToken);
        if (student != null)
            return;

        await studentCommandRepository.InsertAsync(new Student(userId));
        await studentCommandRepository.CommitAsync();
    }
}
