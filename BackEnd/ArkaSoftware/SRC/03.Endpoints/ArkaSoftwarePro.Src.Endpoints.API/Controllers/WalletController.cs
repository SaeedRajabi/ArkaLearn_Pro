using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.Contracts.Finance.WalletRepositoryContracts;
using ArkaSoftwarePro.Src.Core.RequestResponse.Wallets.Commands.AdminAdjustUserWallet;
using ArkaSoftwarePro.Src.Core.RequestResponse.Wallets.Commands.PayInvoiceFromWallet;
using ArkaSoftwarePro.Src.Core.RequestResponse.Wallets.Commands.PaySeminarFromWallet;
using ArkaSoftwarePro.Src.Core.RequestResponse.Wallets.Queries.GetAdminUserWallets;
using ArkaSoftwarePro.Src.Core.RequestResponse.Wallets.Queries.GetMyWallet;
using ArkaSoftwarePro.Src.Core.RequestResponse.Wallets.Queries.GetMyWalletTransactions;
using ArkaSoftwarePro.Src.Endpoints.API.Common;
using Framework.Src.Endpoints.Web.Controllers;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers;

[Route("api/Service/[controller]")]
[ApiController]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme + "," + CookieAuthenticationDefaults.AuthenticationScheme)]
public class WalletController : BaseController
{
    [HttpGet("GetMyWallet")]
    public Task<IActionResult> GetMyWallet()
        => Query<GetMyWalletQuery, MyWalletQri>(new GetMyWalletQuery());

    [HttpGet("GetMyTransactions")]
    public Task<IActionResult> GetMyTransactions([FromQuery] int take = 50)
        => Query<GetMyWalletTransactionsQuery, List<WalletTransactionQri>>(new GetMyWalletTransactionsQuery { Take = take });

    [HttpPost("PayInvoice")]
    public Task<IActionResult> PayInvoice([FromBody] PayInvoiceFromWalletCommand command)
        => Edit<PayInvoiceFromWalletCommand, string>(command);

    [HttpPost("PaySeminar")]
    public Task<IActionResult> PaySeminar([FromBody] PaySeminarFromWalletCommand command)
        => Edit<PaySeminarFromWalletCommand, string>(command);

    [HttpGet("GetAdminUserWallets")]
    public Task<IActionResult> GetAdminUserWallets([FromQuery] string? search, [FromQuery] int take = 50)
    {
        if (!User.IsDashboardAdminRole()) return Task.FromResult<IActionResult>(Forbid());
        return Query<GetAdminUserWalletsQuery, List<AdminUserWalletQri>>(
            new GetAdminUserWalletsQuery { Search = search, Take = take });
    }

    [HttpGet("GetPlatformWallet")]
    public async Task<IActionResult> GetPlatformWallet(
        [FromServices] IUserWalletRepository walletRepository,
        CancellationToken cancellationToken)
    {
        if (!User.IsDashboardAdminRole()) return Forbid();
        var wallet = await walletRepository.GetOrCreatePlatformWalletAsync(cancellationToken);
        return Ok(new
        {
            wallet.AvailableBalanceToman,
            wallet.ReservedBalanceToman,
            wallet.TotalDepositedToman,
            wallet.TotalSpentToman,
            wallet.IsSuspended,
        });
    }

    [HttpPost("AdminAdjustBalance")]
    public Task<IActionResult> AdminAdjustBalance([FromBody] AdminAdjustUserWalletCommand command)
    {
        if (!User.IsDashboardAdminRole()) return Task.FromResult<IActionResult>(Forbid());
        return Edit<AdminAdjustUserWalletCommand, string>(command);
    }
}
