using ArkaSoftwarePro.Src.Core.Domain.EnrollmentAggregate.Enumerations;
using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.EnrollmentAggregate.Entities
{
    public class Payment : Entity
    {

        public decimal Amount { get; private set; }
        public DateTime PaymentDate { get; private set; }
        public PaymentStatus PaymentStatus { get; private set; }
        public PaymentMethod PaymentMethods { get; private set; }
        public PaymentType PaymentType { get; private set; }

        public long? EnrollmentId { get; private set; }
        public Enrollment? Enrollment { get; private set; }


        public Payment()
        {
            
        }

        private Payment(decimal amount, PaymentStatus paymentStatus, PaymentMethod paymentMethods, PaymentType paymentType, long? enrollmentId)
        {
            Amount = amount;
            PaymentDate = DateTime.Now;
            PaymentStatus = paymentStatus;
            PaymentMethods = paymentMethods;
            PaymentType = paymentType;
            EnrollmentId = enrollmentId;
        }

        public static Payment Create(decimal amount, PaymentStatus paymentStatus, PaymentMethod paymentMethods,
            PaymentType paymentType, long? enrollmentId)
            => new Payment(amount, paymentStatus, paymentMethods, paymentType, enrollmentId);
    }
}
