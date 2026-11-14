using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.ApplicationService.WalletServices;
using ArkaSoftwarePro.Src.Core.RequestResponse.Wallets.Commands.AdminAdjustUserWallet;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.WalletServices.Commands;

public class AdminAdjustUserWalletCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    UserWalletService walletService)
    : CommandHandler<AdminAdjustUserWalletCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(AdminAdjustUserWalletCommand command)
    {
        if (command.UserId <= 0)
            return await ResultAsync("Invalid user.", ApplicationServiceStatus.ValidationError);

        var (success, message) = await walletService.AdminAdjustAsync(
            command.UserId,
            command.AmountToman,
            command.Note);
        return success
            ? await OkAsync(message)
            : await ResultAsync(message, ApplicationServiceStatus.ValidationError);
    }
}
