using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Core.Domain.EducationPlanAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.EducationPlanAggregate.ValueOBJs;
using Framework.Src.Core.Domain.Aggregates;
using Framework.Src.Core.Domain.ValueOBJs;

namespace ArkaSoftwarePro.Src.Core.Domain.EducationPlanAggregate.Entities
{
    public class EducationPlan : AggregateRoot
    {
        #region Scalar Properties
        public Title? Title { get; private set; }
        public int HourlyRate { get; private set; }
        public int TotalHours { get; private set; }
        public Money? TotalCost { get; private set; }
        public Description? Description { get; private set; }
        public long ManagedRoomStudentId { get; private set; }
        public long RoomId { get; private set; }
        public long OwnerUserId { get; private set; }
        public DateTime StartDateUtc { get; private set; }
        public DateTime EndDateUtc { get; private set; }
        public int UsedMinutes { get; private set; }
        public EducationPlanPaymentType PaymentType { get; private set; } = EducationPlanPaymentType.Cash;
        public decimal BaseTotalCostToman { get; private set; }
        public decimal FinalTotalCostToman { get; private set; }
        #endregion

        #region References Properties

        private readonly List<EducationPlanInstallment> _installments = new();
        public IReadOnlyCollection<EducationPlanInstallment> Installments => _installments.AsReadOnly();

        private readonly List<Course> _courses = new();
        public IEnumerable<Course> Courses => _courses.AsReadOnly();

        private readonly List<EducationPlanSessionUsage> _sessionUsages = new();
        public IReadOnlyCollection<EducationPlanSessionUsage> SessionUsages => _sessionUsages.AsReadOnly();

        #endregion

        public int TotalMinutes => TotalHours * 60;
        public int RemainingMinutes => Math.Max(0, TotalMinutes - UsedMinutes);
        public decimal UsedHours => Math.Round(UsedMinutes / 60m, 2);
        public decimal RemainingHours => Math.Round(RemainingMinutes / 60m, 2);

        #region CTORs
        private EducationPlan(
            string title,
            int hourlyRate,
            int totalHours,
            decimal totalCost,
            string description,
            long managedRoomStudentId,
            long roomId,
            long ownerUserId,
            DateTime startDateUtc,
            DateTime endDateUtc)
        {
            Title = new Title(title);
            HourlyRate = hourlyRate;
            TotalHours = totalHours;
            TotalCost = new Money(totalCost);
            Description = new Description(description);
            ManagedRoomStudentId = managedRoomStudentId;
            RoomId = roomId;
            OwnerUserId = ownerUserId;
            StartDateUtc = startDateUtc;
            EndDateUtc = endDateUtc;
            UsedMinutes = 0;
        }

        public EducationPlan()
        {
        }
        #endregion

        #region Factories
        public static EducationPlan CreatePrivatePlan(
            string title,
            int hourlyRate,
            int totalHours,
            decimal totalCost,
            string description,
            long managedRoomStudentId,
            long roomId,
            long ownerUserId,
            DateTime startDateUtc,
            DateTime endDateUtc,
            EducationPlanPaymentType paymentType = EducationPlanPaymentType.Cash,
            IReadOnlyList<(int Number, DateTime DueDateUtc, decimal AmountToman)>? installments = null)
        {
            if (managedRoomStudentId <= 0)
                throw new ArgumentException("Student is required.", nameof(managedRoomStudentId));
            if (roomId <= 0)
                throw new ArgumentException("Room is required.", nameof(roomId));
            if (endDateUtc < startDateUtc)
                throw new ArgumentException("End date must be on or after start date.");

            var plan = new EducationPlan(
                title,
                hourlyRate,
                totalHours,
                totalCost,
                description,
                managedRoomStudentId,
                roomId,
                ownerUserId,
                startDateUtc,
                endDateUtc);

            plan.ConfigurePayment(paymentType, totalCost, installments);
            return plan;
        }

        public static EducationPlan Create(string title, int hourlyRate, int totalHours, decimal totalCost, string description = "None")
            => CreatePrivatePlan(title, hourlyRate, totalHours, totalCost, description, 0, 0, 0, DateTime.UtcNow, DateTime.UtcNow.AddYears(1));
        #endregion

        public void ConfigurePayment(
            EducationPlanPaymentType paymentType,
            decimal baseTotalToman,
            IReadOnlyList<(int Number, DateTime DueDateUtc, decimal AmountToman)>? installments)
        {
            PaymentType = paymentType;
            BaseTotalCostToman = baseTotalToman;
            FinalTotalCostToman = paymentType == EducationPlanPaymentType.Installment
                ? EducationPlanInstallmentPricing.ApplyInstallmentMarkup(baseTotalToman)
                : baseTotalToman;

            _installments.Clear();
            if (paymentType != EducationPlanPaymentType.Installment)
                return;

            if (installments == null || installments.Count == 0)
                throw new ArgumentException("Installment schedule is required for installment payment.", nameof(installments));

            var ordered = installments.OrderBy(i => i.Number).ToList();
            foreach (var item in ordered)
                _installments.Add(EducationPlanInstallment.Create(item.Number, item.DueDateUtc, item.AmountToman));
        }

        public void UpdatePaymentSchedule(
            EducationPlanPaymentType paymentType,
            decimal baseTotalToman,
            IReadOnlyList<(int Number, DateTime DueDateUtc, decimal AmountToman)>? installments)
        {
            var paidInstallments = _installments.Where(i => i.IsPaid).ToList();

            if (paymentType == EducationPlanPaymentType.Cash)
            {
                if (paidInstallments.Count > 0)
                    throw new InvalidOperationException("Cannot switch to cash payment while installments have already been paid.");

                ConfigurePayment(paymentType, baseTotalToman, installments);
                return;
            }

            if (installments == null || installments.Count == 0)
                throw new ArgumentException("Installment schedule is required for installment payment.", nameof(installments));

            var ordered = installments.OrderBy(i => i.Number).ToList();

            foreach (var paid in paidInstallments)
            {
                if (!ordered.Any(i => i.Number == paid.InstallmentNumber))
                    throw new InvalidOperationException($"Paid installment #{paid.InstallmentNumber} cannot be removed.");

                var incoming = ordered.First(i => i.Number == paid.InstallmentNumber);
                if (Math.Abs(incoming.AmountToman - paid.AmountToman) > 1m)
                    throw new InvalidOperationException($"Paid installment #{paid.InstallmentNumber} amount cannot be changed.");
            }

            PaymentType = paymentType;
            BaseTotalCostToman = baseTotalToman;
            FinalTotalCostToman = EducationPlanInstallmentPricing.ApplyInstallmentMarkup(baseTotalToman);

            _installments.RemoveAll(i => !i.IsPaid);

            foreach (var item in ordered)
            {
                if (paidInstallments.Any(p => p.InstallmentNumber == item.Number))
                    continue;

                var existingUnpaid = _installments.FirstOrDefault(i => i.InstallmentNumber == item.Number);
                if (existingUnpaid != null)
                    existingUnpaid.UpdateSchedule(item.DueDateUtc, item.AmountToman);
                else
                    _installments.Add(EducationPlanInstallment.Create(item.Number, item.DueDateUtc, item.AmountToman));
            }
        }

        public bool HasOverdueInstallments(DateTime utcNow) =>
            PaymentType == EducationPlanPaymentType.Installment &&
            _installments.Any(i => i.IsOverdue(utcNow));

        public bool IsPaymentCurrent(DateTime utcNow) =>
            PaymentType != EducationPlanPaymentType.Installment || !HasOverdueInstallments(utcNow);

        public bool IsAccessibleAt(DateTime utcMoment) =>
            IsActiveAt(utcMoment) && IsPaymentCurrent(utcMoment);

        public bool IsActiveAt(DateTime utcMoment) =>
            !IsDelete && utcMoment >= StartDateUtc && utcMoment <= EndDateUtc && RemainingMinutes > 0;

        public bool TryConsumeSessionMinutes(long roomSessionId, int minutes)
        {
            if (minutes <= 0)
                return false;
            if (_sessionUsages.Any(u => u.RoomSessionId == roomSessionId))
                return false;

            var applied = Math.Min(minutes, RemainingMinutes);
            if (applied <= 0)
                return false;

            UsedMinutes += applied;
            _sessionUsages.Add(EducationPlanSessionUsage.Create(Id, roomSessionId, applied));
            return true;
        }

        public void UpdateDetails(
            string title,
            int hourlyRate,
            int totalHours,
            decimal totalCost,
            string description,
            long managedRoomStudentId,
            long roomId,
            DateTime startDateUtc,
            DateTime endDateUtc,
            EducationPlanPaymentType paymentType = EducationPlanPaymentType.Cash,
            IReadOnlyList<(int Number, DateTime DueDateUtc, decimal AmountToman)>? installments = null)
        {
            Title = new Title(title);
            HourlyRate = hourlyRate;
            TotalHours = totalHours;
            TotalCost = new Money(totalCost);
            Description = new Description(description);
            ManagedRoomStudentId = managedRoomStudentId;
            RoomId = roomId;
            StartDateUtc = startDateUtc;
            EndDateUtc = endDateUtc;
            UpdatePaymentSchedule(paymentType, totalCost, installments);
        }
    }
}
