using Framework.Src.Core.Domain.Events;

namespace ArkaSoftwarePro.Src.Core.Domain.EnrollmentAggregate.Events;

public record InstallmentAdded(
    DateTime DueDate, 
    decimal Amount, 
    bool IsPaid, 
    DateTime? PaidDate, 
    long EnrollmentId
) : IDomainEvent
{
}