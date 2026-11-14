using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.Contracts.Finance.WalletRepositoryContracts;
using ArkaSoftwarePro.Src.Core.RequestResponse.Wallets.Queries.GetMyWalletTransactions;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.WalletServices.Queries;

public class GetMyWalletTransactionsQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    IUserWalletRepository walletRepository,
    IHttpContextAccessor httpContextAccessor)
    : QueryHandler<GetMyWalletTransactionsQuery, List<WalletTransactionQri>>(outer)
{
    public override async Task<QueryResult<List<WalletTransactionQri>>> Handle(GetMyWalletTransactionsQuery query)
    {
        var userId = ResolveUserId();
        if (userId <= 0)
            return await ResultAsync([], ApplicationServiceStatus.NotFound);

        var rows = await walletRepository.GetTransactionsAsync(userId, query.Take);
        var items = rows.Select(x => new WalletTransactionQri
        {
            Id = x.Id,
            Type = x.Type.ToString(),
            AmountToman = x.AmountToman,
            BalanceAfterToman = x.BalanceAfterToman,
            Reference = x.Reference,
            Description = x.Description,
            CreatedAtUtc = x.CreatedAtUtc,
        }).ToList();

        return await ResultAsync(items);
    }

    private long ResolveUserId()
    {
        var claim = httpContextAccessor.HttpContext?.User?.Claims?.FirstOrDefault(x =>
            x.Type == ClaimTypes.NameIdentifier || x.Type == "userId" || x.Type == "nameid");
        return claim != null && long.TryParse(claim.Value, out var id) ? id : 0;
    }
}
