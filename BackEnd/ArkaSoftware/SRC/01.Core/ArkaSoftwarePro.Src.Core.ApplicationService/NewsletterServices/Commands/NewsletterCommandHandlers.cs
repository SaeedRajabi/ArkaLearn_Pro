using ArkaSoftwarePro.Src.Core.Contracts.Email;
using ArkaSoftwarePro.Src.Core.RequestResponse.Newsletter.Commands.ConfirmNewsletterSubscribe;
using ArkaSoftwarePro.Src.Core.RequestResponse.Newsletter.Commands.RequestNewsletterSubscribeOtp;
using ArkaSoftwarePro.Src.Core.RequestResponse.Newsletter.Commands.UnsubscribeNewsletter;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.NewsletterServices.Commands;

public class RequestNewsletterSubscribeOtpCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    INewsletterSubscriptionService newsletterSubscriptionService)
    : CommandHandler<RequestNewsletterSubscribeOtpCommand, object>(outer)
{
    public override async Task<CommandResult<object>> Handle(RequestNewsletterSubscribeOtpCommand command)
    {
        var email = (command.Email ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(email))
        {
            AddMessage("Email is required.");
            return await ResultAsync(new { message = "Email is required." }, ApplicationServiceStatus.ValidationError);
        }

        try
        {
            var session = await newsletterSubscriptionService.RequestSubscribeOtpAsync(email, CancellationToken.None);
            return await OkAsync(new
            {
                sessionId = session.SessionId,
                resendCooldownSeconds = session.ResendCooldownSeconds,
                expiresInSeconds = session.ExpiresInSeconds
            });
        }
        catch (Exception ex)
        {
            AddMessage(ex.Message);
            return await ResultAsync(new { message = ex.Message }, ApplicationServiceStatus.ValidationError);
        }
    }
}

public class ConfirmNewsletterSubscribeCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    INewsletterSubscriptionService newsletterSubscriptionService)
    : CommandHandler<ConfirmNewsletterSubscribeCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(ConfirmNewsletterSubscribeCommand command)
    {
        try
        {
            await newsletterSubscriptionService.ConfirmSubscribeAsync(
                command.Email,
                command.OtpSessionId,
                command.OtpCode,
                CancellationToken.None);
            return await OkAsync("Subscribed successfully.");
        }
        catch (Exception ex)
        {
            AddMessage(ex.Message);
            return await ResultAsync(ex.Message, ApplicationServiceStatus.ValidationError);
        }
    }
}

public class UnsubscribeNewsletterCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    INewsletterSubscriptionService newsletterSubscriptionService)
    : CommandHandler<UnsubscribeNewsletterCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(UnsubscribeNewsletterCommand command)
    {
        try
        {
            await newsletterSubscriptionService.UnsubscribeAsync(command.Email, CancellationToken.None);
            return await OkAsync("Unsubscribed successfully.");
        }
        catch (Exception ex)
        {
            AddMessage(ex.Message);
            return await ResultAsync(ex.Message, ApplicationServiceStatus.ValidationError);
        }
    }
}
