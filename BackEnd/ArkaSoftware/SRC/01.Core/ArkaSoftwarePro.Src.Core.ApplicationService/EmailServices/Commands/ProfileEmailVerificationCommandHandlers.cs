using ArkaSoftwarePro.Src.Core.Contracts.Email;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UnitOfWorkContracts;
using ArkaSoftwarePro.Src.Core.RequestResponse.Email.Commands.ConfirmProfileEmailVerification;
using ArkaSoftwarePro.Src.Core.RequestResponse.Email.Commands.SendProfileEmailVerificationOtp;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.EmailServices.Commands;

public class SendProfileEmailVerificationOtpCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IEmailVerificationService emailVerificationService,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<SendProfileEmailVerificationOtpCommand, object>(outer)
{
    public override async Task<CommandResult<object>> Handle(SendProfileEmailVerificationOtpCommand command)
    {
        if (!TryGetUserId(out var userId))
            return await ResultAsync(new { message = "Unauthorized." }, ApplicationServiceStatus.ValidationError);

        try
        {
            var session = await emailVerificationService.SendProfileEmailVerificationOtpAsync(userId, CancellationToken.None);
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

    private bool TryGetUserId(out long userId)
    {
        userId = 0;
        var claim = httpContextAccessor.HttpContext?.User?.FindFirst("userId")?.Value
            ?? httpContextAccessor.HttpContext?.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? httpContextAccessor.HttpContext?.User?.FindFirst("sub")?.Value;
        return long.TryParse(claim, out userId);
    }
}

public class ConfirmProfileEmailVerificationCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IEmailVerificationService emailVerificationService,
    IUserUnitOfWork userUnitOfWork,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<ConfirmProfileEmailVerificationCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(ConfirmProfileEmailVerificationCommand command)
    {
        if (!TryGetUserId(out var userId))
            return await ResultAsync("Unauthorized.", ApplicationServiceStatus.ValidationError);

        var ok = await emailVerificationService.VerifyProfileEmailOtpAsync(
            userId,
            command.OtpSessionId,
            command.OtpCode,
            CancellationToken.None);
        if (!ok)
        {
            AddMessage("Invalid or expired verification code.");
            return await ResultAsync("Invalid or expired verification code.", ApplicationServiceStatus.ValidationError);
        }

        var user = await userUnitOfWork.UserCommandRepository.GetAsync(userId);
        if (user is null)
            return await ResultAsync("User not found.", ApplicationServiceStatus.NotFound);

        user.MarkEmailVerified();
        await userUnitOfWork.CommitAsync();
        return await OkAsync("Email verified.");
    }

    private bool TryGetUserId(out long userId)
    {
        userId = 0;
        var claim = httpContextAccessor.HttpContext?.User?.FindFirst("userId")?.Value
            ?? httpContextAccessor.HttpContext?.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? httpContextAccessor.HttpContext?.User?.FindFirst("sub")?.Value;
        return long.TryParse(claim, out userId);
    }
}
