using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.FinanceAggregate.Entities;

public class UserWallet : Entity
{
    public const long PlatformUserId = 0;

    public long UserId { get; private set; }
    public bool IsPlatformWallet { get; private set; }
    public long AvailableBalanceToman { get; private set; }
    public long ReservedBalanceToman { get; private set; }
    public long TotalDepositedToman { get; private set; }
    public long TotalSpentToman { get; private set; }
    public long TotalReceivedToman { get; private set; }
    public long TotalWithdrawnToman { get; private set; }
    public string? ZibalSubMerchantId { get; private set; }
    public DateTime? ZibalProvisionedAtUtc { get; private set; }
    public DateTime? LastPayoutRequestedAtUtc { get; private set; }
    public bool IsSuspended { get; private set; }

    private UserWallet() { }

    public static UserWallet CreateForUser(long userId) => new() { UserId = userId };

    public static UserWallet CreatePlatform() => new() { UserId = PlatformUserId, IsPlatformWallet = true };

    public void CreditTopUp(long amountToman)
    {
        EnsureActive();
        if (amountToman <= 0) throw new InvalidOperationException("Top-up amount must be positive.");
        AvailableBalanceToman += amountToman;
        TotalDepositedToman += amountToman;
    }

    public void DebitPurchase(long amountToman)
    {
        EnsureActive();
        if (amountToman <= 0) throw new InvalidOperationException("Purchase amount must be positive.");
        if (amountToman > AvailableBalanceToman)
            throw new InvalidOperationException("Insufficient wallet balance.");
        AvailableBalanceToman -= amountToman;
        TotalSpentToman += amountToman;
    }

    public void CreditReceived(long amountToman)
    {
        EnsureActive();
        if (amountToman <= 0) throw new InvalidOperationException("Credit amount must be positive.");
        AvailableBalanceToman += amountToman;
        TotalReceivedToman += amountToman;
    }

    public void ReserveForWithdrawal(long amountToman)
    {
        EnsureActive();
        if (amountToman <= 0) throw new InvalidOperationException("Withdrawal amount must be positive.");
        if (amountToman > AvailableBalanceToman)
            throw new InvalidOperationException("Insufficient available balance.");
        AvailableBalanceToman -= amountToman;
        ReservedBalanceToman += amountToman;
        LastPayoutRequestedAtUtc = DateTime.UtcNow;
    }

    public void CompleteWithdrawal(long amountToman)
    {
        if (amountToman <= 0 || amountToman > ReservedBalanceToman)
            throw new InvalidOperationException("Invalid withdrawal completion amount.");
        ReservedBalanceToman -= amountToman;
        TotalWithdrawnToman += amountToman;
    }

    public void RejectWithdrawal(long amountToman)
    {
        if (amountToman <= 0 || amountToman > ReservedBalanceToman)
            throw new InvalidOperationException("Invalid withdrawal rejection amount.");
        ReservedBalanceToman -= amountToman;
        AvailableBalanceToman += amountToman;
    }

    public void AdminAdjust(long deltaToman)
    {
        if (deltaToman == 0) return;
        if (deltaToman > 0)
        {
            AvailableBalanceToman += deltaToman;
            TotalDepositedToman += deltaToman;
            return;
        }

        var debit = Math.Abs(deltaToman);
        if (debit > AvailableBalanceToman)
            throw new InvalidOperationException("Insufficient balance for admin debit.");
        AvailableBalanceToman -= debit;
        TotalSpentToman += debit;
    }

    public void SetZibalSubMerchant(string subMerchantId)
    {
        ZibalSubMerchantId = string.IsNullOrWhiteSpace(subMerchantId) ? null : subMerchantId.Trim();
        ZibalProvisionedAtUtc = string.IsNullOrWhiteSpace(subMerchantId) ? null : DateTime.UtcNow;
    }

    public void Suspend() => IsSuspended = true;

    public void Activate() => IsSuspended = false;

    private void EnsureActive()
    {
        if (IsSuspended)
            throw new InvalidOperationException("Wallet is suspended.");
    }
}
