using ArkaSoftwarePro.Src.Core.Contracts.IPBlacklist.IPBlacklistRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Sms;
using ArkaSoftwarePro.Src.Core.Contracts.Users.SecurityTokenContracts;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Security.Commands.SendIpUnblockOtp;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices.Commands;

public class SendIpUnblockOtpCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IPhoneVerificationService phoneVerificationService,
    IUserQueryRepository userQueryRepository,
    IIPBlacklistQueryRepository ipBlacklistQueryRepository,
    IUserDeviceInfoService userInfoService)
    : CommandHandler<SendIpUnblockOtpCommand, IpUnblockOtpSessionQri>(outer)
{
    public override async Task<CommandResult<IpUnblockOtpSessionQri>> Handle(SendIpUnblockOtpCommand command)
    {
        var ip = userInfoService.GetUserInfo().IpAddress;
        if (string.IsNullOrWhiteSpace(ip) || !await ipBlacklistQueryRepository.IsIpBlockedAsync(ip))
        {
            AddMessage("This IP address is not blocked.");
            return await ResultAsync(new IpUnblockOtpSessionQri(), ApplicationServiceStatus.ValidationError);
        }

        if (!IranianPhoneNormalizer.TryNormalizeLocalNumber(command.PhoneNumber, out var localPhone))
        {
            AddMessage("A valid phone number is required.");
            return await ResultAsync(new IpUnblockOtpSessionQri(), ApplicationServiceStatus.ValidationError);
        }

        var user = await userQueryRepository.GetUserByLocalPhoneAsync(localPhone);
        if (user is null)
        {
            AddMessage("No account found for this phone number.");
            return await ResultAsync(new IpUnblockOtpSessionQri(), ApplicationServiceStatus.ValidationError);
        }

        try
        {
            var session = await phoneVerificationService.SendIpUnblockOtpAsync(localPhone, user.FullName, cancellationToken: CancellationToken.None);
            return await OkAsync(new IpUnblockOtpSessionQri
            {
                SessionId = session.SessionId,
                ResendCooldownSeconds = session.ResendCooldownSeconds,
                ExpiresInSeconds = session.ExpiresInSeconds,
            });
        }
        catch (InvalidOperationException ex)
        {
            AddMessage(ex.Message);
            return await ResultAsync(new IpUnblockOtpSessionQri(), ApplicationServiceStatus.ValidationError);
        }
    }
}
