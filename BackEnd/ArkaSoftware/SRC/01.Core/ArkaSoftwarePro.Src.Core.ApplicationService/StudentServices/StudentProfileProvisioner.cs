using ArkaSoftwarePro.Src.Core.Contracts.Students.StudentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.StudentAggregate.Entities;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.StudentServices;

internal static class StudentProfileProvisioner
{
    public static async Task<Student?> EnsureStudentRecordAsync(
        long userId,
        IUserCommandRepository userCommandRepository,
        IStudentCommandRepository studentCommandRepository,
        CancellationToken cancellationToken = default)
    {
        var existing = await FindExistingStudentAsync(userId, studentCommandRepository, cancellationToken);
        if (existing != null)
            return existing;

        if (userId <= 0)
            return null;

        var user = await userCommandRepository.GetAsync(userId);
        if (user == null || user.Id <= 0)
            return null;

        var student = new Student(userId);
        await studentCommandRepository.InsertAsync(student);
        await studentCommandRepository.CommitAsync();
        return student;
    }

    public static async Task<Student?> EnsureStudentRecordByUserNameAsync(
        string userName,
        IUserCommandRepository userCommandRepository,
        IStudentCommandRepository studentCommandRepository,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(userName))
            return null;

        var user = userCommandRepository.FindByUserNameAsync(userName.Trim());
        if (user == null || user.Id <= 0)
            return null;

        return await EnsureStudentRecordAsync(
            user.Id,
            userCommandRepository,
            studentCommandRepository,
            cancellationToken);
    }

    public static async Task<Student?> FindExistingStudentAsync(
        long userOrStudentId,
        IStudentCommandRepository studentCommandRepository,
        CancellationToken cancellationToken = default)
    {
        if (userOrStudentId <= 0)
            return null;

        var byUserId = await studentCommandRepository.GetByUserIdAsync(userOrStudentId, cancellationToken);
        if (byUserId != null)
            return byUserId;

        return await studentCommandRepository.GetByIdAsync(userOrStudentId, cancellationToken);
    }
}
