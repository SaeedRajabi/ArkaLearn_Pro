using ArkaSoftwarePro.Src.Core.Domain.FinanceAggregate.Enumerations;
using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.FinanceAggregate.Entities;

public class WalletTransaction : Entity
{
    public long WalletId { get; private set; }
    public long UserId { get; private set; }
    public WalletTransactionType Type { get; private set; }
    public long AmountToman { get; private set; }
    public long BalanceAfterToman { get; private set; }
    public string Reference { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public long? CounterpartyUserId { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }

    private WalletTransaction() { }

    public static WalletTransaction Create(
        long walletId,
        long userId,
        WalletTransactionType type,
        long amountToman,
        long balanceAfterToman,
        string reference,
        string? description = null,
        long? counterpartyUserId = null)
        => new()
        {
            WalletId = walletId,
            UserId = userId,
            Type = type,
            AmountToman = amountToman,
            BalanceAfterToman = balanceAfterToman,
            Reference = reference.Trim(),
            Description = description,
            CounterpartyUserId = counterpartyUserId,
            CreatedAtUtc = DateTime.UtcNow,
        };
}
