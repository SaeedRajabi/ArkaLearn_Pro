namespace ArkaSoftwarePro.Src.Core.Domain.OrderAggregate.Enumerations;

public enum PaymentStatus:byte
{
    PENDING = 1,
    PAID = 2,
    FAILED = 3
}