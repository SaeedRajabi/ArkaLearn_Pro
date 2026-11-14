using ArkaSoftwarePro.Src.Core.Domain.EnrollmentAggregate.Enumerations;
using Framework.Src.Core.Domain.Events;

namespace ArkaSoftwarePro.Src.Core.Domain.EnrollmentAggregate.Events
{
    public record PaymentAdded(
        decimal Amount, 
        PaymentStatus PaymentStatus, 
        PaymentMethod PaymentMethods, 
        PaymentType PaymentType,
        long EnrollmentId
        ) : IDomainEvent
    {
    }
}
