using ArkaSoftwarePro.Src.Core.Domain.EnrollmentAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.InvoiceAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.InvoiceAggregate.ValueOBJs;
using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.InvoiceAggregate.Entities
{
    /// <summary>
    /// تراکنش مالی (Entity)
    /// هر تراکنش به یک فاکتور و یک پرداخت مرتبط است
    /// </summary>
    public class Transaction : Entity
    {
        #region Properties

        /// <summary>
        /// شماره تراکنش
        /// </summary>
        public TransactionNumber? TransactionNumber { get; private set; }

        /// <summary>
        /// تاریخ و زمان تراکنش
        /// </summary>
        public DateTime TransactionDate { get; private set; }

        /// <summary>
        /// مبلغ تراکنش
        /// </summary>
        public decimal Amount { get; private set; }

        /// <summary>
        /// وضعیت تراکنش
        /// </summary>
        public TransactionStatus Status { get; private set; }

        /// <summary>
        /// شماره مرجع از درگاه پرداخت (برای تراکنش‌های آنلاین)
        /// </summary>
        public string? ReferenceNumber { get; private set; }

        /// <summary>
        /// توضیحات تراکنش
        /// </summary>
        public string? Description { get; private set; }

        #endregion

        #region References

        /// <summary>
        /// فاکتور مرتبط با این تراکنش
        /// </summary>
        public long? InvoiceId { get; private set; }
        public Invoice? Invoice { get; private set; }

        /// <summary>
        /// پرداخت مرتبط با این تراکنش (اختیاری - اگر از طریق Enrollment پرداخت شده باشد)
        /// </summary>
        public long? PaymentId { get; private set; }
        public Payment? Payment { get; private set; }

        #endregion

        #region CTORs

        private Transaction() { }

        public Transaction(
            TransactionNumber transactionNumber,
            decimal amount,
            TransactionStatus status,
            long? invoiceId = null,
            long? paymentId = null,
            string? referenceNumber = null,
            string? description = null)
        {
            if (amount <= 0)
                throw new Framework.Src.Core.Domain.Exceptions.InvalidEntityStateException("Transaction amount must be greater than zero.", nameof(Amount));

            TransactionNumber = transactionNumber;
            TransactionDate = DateTime.UtcNow;
            Amount = amount;
            Status = status;
            InvoiceId = invoiceId;
            PaymentId = paymentId;
            ReferenceNumber = referenceNumber;
            Description = description;
        }

        #endregion

        #region Behaviors

        /// <summary>
        /// ایجاد تراکنش جدید
        /// </summary>
        public static Transaction Create(
            TransactionNumber transactionNumber,
            decimal amount,
            TransactionStatus status,
            long? invoiceId = null,
            long? paymentId = null,
            string? referenceNumber = null,
            string? description = null)
        {
            return new Transaction(transactionNumber, amount, status, invoiceId, paymentId, referenceNumber, description);
        }

        /// <summary>
        /// به‌روزرسانی وضعیت تراکنش
        /// </summary>
        public void UpdateStatus(TransactionStatus newStatus)
        {
            Status = newStatus;
        }

        /// <summary>
        /// تنظیم شماره مرجع
        /// </summary>
        public void SetReferenceNumber(string referenceNumber)
        {
            if (string.IsNullOrWhiteSpace(referenceNumber))
                throw new Framework.Src.Core.Domain.Exceptions.InvalidEntityStateException("Reference number cannot be empty.", nameof(ReferenceNumber));

            ReferenceNumber = referenceNumber.Trim();
        }

        /// <summary>
        /// تنظیم توضیحات
        /// </summary>
        public void SetDescription(string? description)
        {
            Description = description;
        }

        #endregion
    }
}
