using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.ApplicationService.WalletServices;
using ArkaSoftwarePro.Src.Core.RequestResponse.Wallets.Commands.PaySeminarFromWallet;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.WalletServices.Commands;

public class PaySeminarFromWalletCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    UserWalletService walletService,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<PaySeminarFromWalletCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(PaySeminarFromWalletCommand command)
    {
        var userId = ResolveUserId();
        if (userId <= 0)
            return await ResultAsync("User not authenticated.", ApplicationServiceStatus.NotFound);

        var (success, message) = await walletService.PaySeminarFromWalletAsync(userId, command.SeminarId);
        return success
            ? await OkAsync(message)
            : await ResultAsync(message, ApplicationServiceStatus.ValidationError);
    }

    private long ResolveUserId()
    {
        var claim = httpContextAccessor.HttpContext?.User?.Claims?.FirstOrDefault(x =>
            x.Type == ClaimTypes.NameIdentifier || x.Type == "userId" || x.Type == "nameid");
        return claim != null && long.TryParse(claim.Value, out var id) ? id : 0;
    }
}
