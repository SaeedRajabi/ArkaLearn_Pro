using ArkaSoftwarePro.Src.Core.Contracts.SupportSubscription;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportSubscription.Commands.RequestStudentSupportFreeze;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.Domain.Exceptions;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SupportSubscriptionServices.Commands;

public class RequestStudentSupportFreezeCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IStudentSupportSubscriptionRepository repository)
    : CommandHandler<RequestStudentSupportFreezeCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(RequestStudentSupportFreezeCommand command)
    {
        if (command.UserId <= 0)
            return await ResultAsync("User not authenticated.", ApplicationServiceStatus.NotFound);

        var subscription = await repository.GetByStudentUserIdAsync(command.UserId);
        if (subscription == null)
            return await ResultAsync("No active support subscription found.", ApplicationServiceStatus.ValidationError);

        try
        {
            subscription.StartFreeze(command.FreezeDays, command.Reason, DateTime.UtcNow);
        }
        catch (InvalidEntityStateException ex)
        {
            return await ResultAsync(ex.Message, ApplicationServiceStatus.ValidationError);
        }

        await repository.CommitAsync();
        return await OkAsync("Support freeze started.");
    }
}
