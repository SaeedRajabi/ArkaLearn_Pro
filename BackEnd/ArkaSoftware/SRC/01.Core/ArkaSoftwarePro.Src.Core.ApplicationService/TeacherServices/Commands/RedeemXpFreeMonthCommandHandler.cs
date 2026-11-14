using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;
using ArkaSoftwarePro.Src.Core.Contracts.Students.StudentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.RedeemXpFreeMonth;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Commands;

public class RedeemXpFreeMonthCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ITeacherCommandRepository teacherCommandRepository,
    IUserCommandRepository userCommandRepository,
    IStudentCommandRepository studentCommandRepository,
    TeacherXpService xpService,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<RedeemXpFreeMonthCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(RedeemXpFreeMonthCommand command)
    {
        var userId = ResolveUserId();
        if (userId <= 0)
            return await ResultAsync("Unauthorized.", ApplicationServiceStatus.NotFound);

        var teacher = await TeacherProfileProvisioner.EnsureTeacherRecordAsync(
            userId, userCommandRepository, teacherCommandRepository, studentCommandRepository);
        if (teacher == null)
            return await ResultAsync("Teacher not found.", ApplicationServiceStatus.NotFound);

        var threshold = await xpService.GetNextThresholdAsync(teacher);
        if (teacher.ExperiencePoints < threshold)
            return await ResultAsync($"You need at least {threshold} XP.", ApplicationServiceStatus.ValidationError);

        try
        {
            teacher.RedeemXpFreeMonth(threshold);
        }
        catch
        {
            return await ResultAsync("Could not redeem XP.", ApplicationServiceStatus.ValidationError);
        }

        await xpService.RecordRedeemEventAsync(teacher, threshold);

        var ad = teacher.Advertisement ?? await teacherCommandRepository.GetAdvertisementByTeacherIdAsync(teacher.Id);
        if (ad != null)
        {
            ad.SetListingStarLevel(3);
            ad.BumpListing(3, DateTime.UtcNow);
        }

        await teacherCommandRepository.CommitAsync();
        return await ResultAsync("One free month activated.", ApplicationServiceStatus.Ok);
    }

    private long ResolveUserId()
    {
        var claim = httpContextAccessor.HttpContext?.User?.Claims?.FirstOrDefault(x =>
            x.Type == ClaimTypes.NameIdentifier || x.Type == "userId" || x.Type == "nameid");
        return claim != null && long.TryParse(claim.Value, out var id) ? id : 0;
    }
}
