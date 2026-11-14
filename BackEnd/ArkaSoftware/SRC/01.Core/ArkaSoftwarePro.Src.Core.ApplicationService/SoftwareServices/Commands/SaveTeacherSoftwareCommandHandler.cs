using ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;
using ArkaSoftwarePro.Src.Core.Contracts.Software.SoftwareRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Students.StudentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.SoftwareAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Software.Commands.SaveTeacherSoftware;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SoftwareServices.Commands;

public class SaveTeacherSoftwareCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ISoftwareCommandRepository softwareRepository,
    ITeacherCommandRepository teacherCommandRepository,
    IUserCommandRepository userCommandRepository,
    IStudentCommandRepository studentCommandRepository,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<SaveTeacherSoftwareCommand, long>(outer)
{
    public override async Task<CommandResult<long>> Handle(SaveTeacherSoftwareCommand command)
    {
        if (!TryGetUserId(out var userId))
            return await ResultAsync(default(long), ApplicationServiceStatus.NotFound);

        var teacher = await TeacherProfileProvisioner.EnsureTeacherRecordAsync(
            userId, userCommandRepository, teacherCommandRepository, studentCommandRepository);
        if (teacher == null)
            return await ResultAsync(default(long), ApplicationServiceStatus.NotFound);

        var blockedReason = TeacherAccountGuard.GetContentManagementBlockReason(teacher);
        if (blockedReason != null)
        {
            result.AddMessage(blockedReason);
            return await ResultAsync(default(long), ApplicationServiceStatus.ValidationError);
        }

        if (string.IsNullOrWhiteSpace(command.Title))
        {
            result.AddMessage("Title is required.");
            return await ResultAsync(default(long), ApplicationServiceStatus.ValidationError);
        }

        var tags = command.Tags ?? [];
        var status = TeacherApprovalStatus.Pending;
        long softwareId;

        if (command.SoftwareId > 0)
        {
            var existing = await softwareRepository.GetWithTeacherAsync(command.SoftwareId);
            if (existing == null || existing.TeacherId != teacher.Id)
                return await ResultAsync(default(long), ApplicationServiceStatus.NotFound);

            existing.Update(
                command.Title,
                command.ShortDescription ?? string.Empty,
                command.LongDescriptionHtml ?? string.Empty,
                command.CoverImageUrl,
                command.InstallerFileUrl,
                command.InstallerFileName,
                command.CategoryId,
                tags,
                command.SortOrder,
                status);
            existing.EnsureSlug(existing.Id);
            softwareId = existing.Id;
        }
        else
        {
            var created = SoftwareProduct.CreateTeacher(
                teacher.Id,
                userId,
                command.Title,
                command.ShortDescription ?? string.Empty,
                command.LongDescriptionHtml ?? string.Empty,
                command.CoverImageUrl,
                command.InstallerFileUrl,
                command.InstallerFileName,
                command.CategoryId,
                tags,
                command.SortOrder,
                status);
            await softwareRepository.InsertAsync(created);
            await softwareRepository.CommitAsync();
            created.EnsureSlug(created.Id);
            softwareId = created.Id;
        }

        await softwareRepository.CommitAsync();
        return await OkAsync(softwareId);
    }

    private bool TryGetUserId(out long userId)
    {
        userId = 0;
        var claim = httpContextAccessor.HttpContext?.User?.Claims?.FirstOrDefault(x =>
            x.Type == ClaimTypes.NameIdentifier || x.Type == "userId" || x.Type == "nameid");
        return claim != null && long.TryParse(claim.Value, out userId) && userId > 0;
    }
}
