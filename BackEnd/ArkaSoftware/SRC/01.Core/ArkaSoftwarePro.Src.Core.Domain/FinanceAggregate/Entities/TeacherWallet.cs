using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.FinanceAggregate.Entities;

public class TeacherWallet : Entity
{
    public long TeacherId { get; private set; }
    public long AvailableBalanceToman { get; private set; }
    public long ReservedBalanceToman { get; private set; }
    public long TotalGrossSalesToman { get; private set; }
    public long TotalTaxWithheldToman { get; private set; }
    public long TotalPlatformFeeToman { get; private set; }
    public long TotalNetEarnedToman { get; private set; }
    public long TotalWithdrawnToman { get; private set; }
    public int TotalSaleCount { get; private set; }
    public DateTime? LastPayoutRequestedAtUtc { get; private set; }

    private TeacherWallet() { }

    public static TeacherWallet Create(long teacherId) => new() { TeacherId = teacherId };

    public void CreditCourseSale(long grossToman, long taxToman, long platformFeeToman, long netToman)
    {
        TotalGrossSalesToman += grossToman;
        TotalTaxWithheldToman += taxToman;
        TotalPlatformFeeToman += platformFeeToman;
        TotalNetEarnedToman += netToman;
        AvailableBalanceToman += netToman;
        TotalSaleCount += 1;
    }

    public void ReserveForPayout(long amountToman)
    {
        if (amountToman <= 0)
            throw new InvalidOperationException("Payout amount must be greater than zero.");
        if (amountToman > AvailableBalanceToman)
            throw new InvalidOperationException("Insufficient available balance.");

        AvailableBalanceToman -= amountToman;
        ReservedBalanceToman += amountToman;
        LastPayoutRequestedAtUtc = DateTime.UtcNow;
    }

    public void CompletePayout(long amountToman)
    {
        if (amountToman <= 0 || amountToman > ReservedBalanceToman)
            throw new InvalidOperationException("Invalid payout completion amount.");

        ReservedBalanceToman -= amountToman;
        TotalWithdrawnToman += amountToman;
    }

    public void RejectPayout(long amountToman)
    {
        if (amountToman <= 0 || amountToman > ReservedBalanceToman)
            throw new InvalidOperationException("Invalid payout rejection amount.");

        ReservedBalanceToman -= amountToman;
        AvailableBalanceToman += amountToman;
    }
}
