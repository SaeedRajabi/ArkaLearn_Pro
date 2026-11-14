using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;
using ArkaSoftwarePro.Src.Core.Contracts.Students.StudentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.ManualBumpAdvertisement;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Commands;

public class ManualBumpAdvertisementCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ITeacherCommandRepository teacherCommandRepository,
    IUserCommandRepository userCommandRepository,
    IStudentCommandRepository studentCommandRepository,
    TeacherAdvertisingEntitlements entitlements,
    ManualBumpCaptchaService captchaService,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<ManualBumpAdvertisementCommand, ManualBumpAdvertisementResultQri>(outer)
{
    public override async Task<CommandResult<ManualBumpAdvertisementResultQri>> Handle(ManualBumpAdvertisementCommand command)
    {
        var userId = ResolveUserId();
        if (userId <= 0)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        if (!captchaService.TryValidate(command.CaptchaId, command.CaptchaCode, userId))
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);

        var teacher = await TeacherProfileProvisioner.EnsureTeacherRecordAsync(
            userId, userCommandRepository, teacherCommandRepository, studentCommandRepository);
        if (teacher == null)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        var ad = teacher.Advertisement ?? await teacherCommandRepository.GetAdvertisementByTeacherIdAsync(teacher.Id);
        if (ad is null)
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);

        if (!ad.IsPublic || ad.ApprovalStatus != TeacherApprovalStatus.Approved)
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);

        var settings = await teacherCommandRepository.GetOrCreateMonetizationSettingsAsync();
        var cooldownMinutes = settings.ManualBumpCooldownMinutes > 0 ? settings.ManualBumpCooldownMinutes : 25;
        var now = DateTime.UtcNow;

        if (!ad.CanManualBump(now, cooldownMinutes))
            return await ResultAsync(null!, ApplicationServiceStatus.ValidationError);

        var starLevel = await entitlements.GetEffectiveStarLevelAsync(teacher);
        ad.ManualBumpListing(starLevel, now);

        await teacherCommandRepository.CommitAsync();

        return await ResultAsync(new ManualBumpAdvertisementResultQri
        {
            BumpedAtUtc = now,
            NextManualBumpAtUtc = now.AddMinutes(cooldownMinutes),
            ManualBumpCooldownMinutes = cooldownMinutes,
        }, ApplicationServiceStatus.Ok);
    }

    private long ResolveUserId()
    {
        var claim = httpContextAccessor.HttpContext?.User?.Claims?.FirstOrDefault(x =>
            x.Type == ClaimTypes.NameIdentifier || x.Type == "userId" || x.Type == "nameid");
        return claim != null && long.TryParse(claim.Value, out var id) ? id : 0;
    }
}
