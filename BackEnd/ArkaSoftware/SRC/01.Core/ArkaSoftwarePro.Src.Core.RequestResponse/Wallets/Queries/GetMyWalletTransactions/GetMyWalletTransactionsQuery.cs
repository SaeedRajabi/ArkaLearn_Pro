using ArkaSoftwarePro.Src.Core.Domain.FinanceAggregate.Enumerations;
using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Wallets.Queries.GetMyWalletTransactions;

public class GetMyWalletTransactionsQuery : IQuery<List<WalletTransactionQri>>, IWebRequest
{
    public int Take { get; set; } = 50;
    public string Path => "/api/Service/Wallet/GetMyTransactions";
}

public class WalletTransactionQri
{
    public long Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public long AmountToman { get; set; }
    public long BalanceAfterToman { get; set; }
    public string Reference { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}
