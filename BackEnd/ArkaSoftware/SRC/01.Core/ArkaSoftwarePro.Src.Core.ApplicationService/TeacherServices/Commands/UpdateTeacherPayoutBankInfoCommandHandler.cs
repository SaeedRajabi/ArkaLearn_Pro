using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;
using ArkaSoftwarePro.Src.Core.Contracts.Finance;
using ArkaSoftwarePro.Src.Core.Contracts.Students.StudentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.UpdateTeacherPayoutBankInfo;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.Domain.Exceptions;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Commands;

public class UpdateTeacherPayoutBankInfoCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ITeacherCommandRepository teacherCommandRepository,
    IUserCommandRepository userCommandRepository,
    IStudentCommandRepository studentCommandRepository,
    IZibalWalletProvisioningService zibalWalletProvisioningService,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<UpdateTeacherPayoutBankInfoCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(UpdateTeacherPayoutBankInfoCommand command)
    {
        var userId = ResolveUserId(command.UserId);
        if (userId <= 0)
            return await ResultAsync("User not authenticated.", ApplicationServiceStatus.NotFound);

        var teacher = await TeacherProfileProvisioner.EnsureTeacherRecordAsync(
            userId, userCommandRepository, teacherCommandRepository, studentCommandRepository);
        if (teacher == null)
            return await ResultAsync("Teacher not found.", ApplicationServiceStatus.NotFound);

        try
        {
            teacher.UpdatePayoutBankInfo(command.PayoutSheba ?? string.Empty, command.PayoutCardNumber ?? string.Empty);
        }
        catch (InvalidEntityStateException ex)
        {
            return await ResultAsync(ex.Message, ApplicationServiceStatus.ValidationError);
        }

        await teacherCommandRepository.CommitAsync();
        await zibalWalletProvisioningService.TryProvisionTeacherSubMerchantAsync(teacher.Id);
        return await OkAsync("Payout bank info saved.");
    }

    private long ResolveUserId(long commandUserId)
    {
        if (commandUserId > 0) return commandUserId;
        var claim = httpContextAccessor.HttpContext?.User?.Claims?.FirstOrDefault(x =>
            x.Type == ClaimTypes.NameIdentifier || x.Type == "userId" || x.Type == "nameid");
        return claim != null && long.TryParse(claim.Value, out var id) ? id : 0;
    }
}
