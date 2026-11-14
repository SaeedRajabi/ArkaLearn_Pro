using ArkaSoftwarePro.Src.Core.Contracts.Email;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UnitOfWorkContracts;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Core.RequestResponse.Email.Commands.ConfirmEmailChange;
using ArkaSoftwarePro.Src.Core.RequestResponse.Email.Commands.SendEmailChangeOtp;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.EmailServices.Commands;

public class SendEmailChangeOtpCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IEmailVerificationService emailVerificationService,
    IUserQueryRepository userQueryRepository,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<SendEmailChangeOtpCommand, object>(outer)
{
    public override async Task<CommandResult<object>> Handle(SendEmailChangeOtpCommand command)
    {
        if (!TryGetUserId(out var userId))
            return await ResultAsync(new { message = "Unauthorized." }, ApplicationServiceStatus.ValidationError);

        var newEmail = (command.NewEmail ?? string.Empty).Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(newEmail) || !newEmail.Contains('@'))
        {
            AddMessage("Invalid email address.");
            return await ResultAsync(new { message = "Invalid email address." }, ApplicationServiceStatus.ValidationError);
        }

        var profile = await userQueryRepository.GetEmailVerificationInfoAsync(userId, CancellationToken.None);
        if (profile is null)
            return await ResultAsync(new { message = "User not found." }, ApplicationServiceStatus.NotFound);

        if (string.Equals(profile.Email, newEmail, StringComparison.OrdinalIgnoreCase))
        {
            AddMessage("New email must be different from your current email.");
            return await ResultAsync(new { message = "New email must be different from your current email." }, ApplicationServiceStatus.ValidationError);
        }

        var existing = await userQueryRepository.GetUserLookupByIdentityAsync(string.Empty, newEmail, CancellationToken.None);
        if (existing is not null && existing.UserId != userId)
        {
            AddMessage("This email is already registered.");
            return await ResultAsync(new { message = "This email is already registered." }, ApplicationServiceStatus.ValidationError);
        }

        try
        {
            var session = await emailVerificationService.SendEmailChangeOtpAsync(userId, newEmail, CancellationToken.None);
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

public class ConfirmEmailChangeCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IEmailVerificationService emailVerificationService,
    IUserQueryRepository userQueryRepository,
    IUserUnitOfWork userUnitOfWork,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<ConfirmEmailChangeCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(ConfirmEmailChangeCommand command)
    {
        if (!TryGetUserId(out var userId))
            return await ResultAsync("Unauthorized.", ApplicationServiceStatus.ValidationError);

        var newEmail = (command.NewEmail ?? string.Empty).Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(newEmail))
            return await ResultAsync("Invalid email address.", ApplicationServiceStatus.ValidationError);

        var existing = await userQueryRepository.GetUserLookupByIdentityAsync(string.Empty, newEmail, CancellationToken.None);
        if (existing is not null && existing.UserId != userId)
        {
            AddMessage("This email is already registered.");
            return await ResultAsync("This email is already registered.", ApplicationServiceStatus.ValidationError);
        }

        var ok = await emailVerificationService.VerifyEmailChangeOtpAsync(
            userId,
            command.OtpSessionId,
            newEmail,
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

        try
        {
            user.ChangeEmail(Email.FromString(newEmail));
            user.MarkEmailVerified();
        }
        catch (Exception ex)
        {
            AddMessage(ex.Message);
            return await ResultAsync(ex.Message, ApplicationServiceStatus.ValidationError);
        }

        await userUnitOfWork.CommitAsync();
        return await OkAsync("Email updated.");
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
