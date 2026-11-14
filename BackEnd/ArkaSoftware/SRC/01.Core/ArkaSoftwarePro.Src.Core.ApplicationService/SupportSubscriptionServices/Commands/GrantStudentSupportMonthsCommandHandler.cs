using ArkaSoftwarePro.Src.Core.Contracts.SupportChat.SupportChatRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.SupportSubscription;
using ArkaSoftwarePro.Src.Core.Domain.SupportSubscriptionAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportSubscription.Commands.GrantStudentSupportMonths;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.Domain.Exceptions;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SupportSubscriptionServices.Commands;

public class GrantStudentSupportMonthsCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IStudentSupportSubscriptionRepository repository,
    ISupportChatQueryRepository supportChatQueryRepository)
    : CommandHandler<GrantStudentSupportMonthsCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(GrantStudentSupportMonthsCommand command)
    {
        if (!long.TryParse(command.StudentUserId, out var studentUserId) || studentUserId <= 0 || command.Months <= 0)
            return await ResultAsync("Invalid grant request.", ApplicationServiceStatus.ValidationError);

        var maxMonths = command.ActorIsAdmin ? 24 : StudentSupportSubscription.MaxTeacherGrantMonths;
        if (command.Months > maxMonths)
            return await ResultAsync(
                command.ActorIsAdmin
                    ? "Invalid grant request."
                    : $"Teachers can grant at most {StudentSupportSubscription.MaxTeacherGrantMonths} months at a time.",
                ApplicationServiceStatus.ValidationError);

        if (!command.ActorIsAdmin)
        {
            if (!await supportChatQueryRepository.IsTeacherAllowedForStudentAsync(studentUserId, command.ActorUserId))
                return await ResultAsync("You are not allowed to grant support for this student.", ApplicationServiceStatus.ValidationError);
        }

        var subscription = await repository.GetOrCreateAsync(studentUserId);
        try
        {
            subscription.GrantMonths(command.Months, DateTime.UtcNow, command.ActorUserId, command.ActorIsAdmin ? "admin" : "teacher");
        }
        catch (InvalidEntityStateException ex)
        {
            return await ResultAsync(ex.Message, ApplicationServiceStatus.ValidationError);
        }

        await repository.CommitAsync();
        return await OkAsync("Support time granted.");
    }
}
