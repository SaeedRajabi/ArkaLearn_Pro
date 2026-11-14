namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Finance;

public class UserWalletQueryModel
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public bool IsPlatformWallet { get; set; }
    public long AvailableBalanceToman { get; set; }
}
