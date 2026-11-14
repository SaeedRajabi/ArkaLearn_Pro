using ArkaSoftwarePro.Src.Core.Domain.InvoiceAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.InvoiceAggregate.Events;
using ArkaSoftwarePro.Src.Core.Domain.InvoiceAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Core.Domain.OrderAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.StudentAggregate.Entities;
using Framework.Src.Core.Domain.Aggregates;
using Framework.Src.Core.Domain.Exceptions;

namespace ArkaSoftwarePro.Src.Core.Domain.InvoiceAggregate.Entities
{
    /// <summary>
    /// فاکتور (AggregateRoot)
    /// هر فاکتور به یک سفارش مرتبط است و می‌تواند چندین تراکنش داشته باشد
    /// </summary>
    public class Invoice : AggregateRoot
    {
        #region Properties

        /// <summary>
        /// شماره فاکتور
        /// </summary>
        public InvoiceNumber? InvoiceNumber { get; private set; }

        /// <summary>
        /// تاریخ فاکتور
        /// </summary>
        public DateTime InvoiceDate { get; private set; }

        /// <summary>
        /// مبلغ کل فاکتور
        /// </summary>
        public decimal TotalAmount { get; private set; }

        /// <summary>
        /// مبلغ پرداخت شده
        /// </summary>
        public decimal PaidAmount { get; private set; }

        /// <summary>
        /// مبلغ باقیمانده
        /// </summary>
        public decimal RemainingAmount => TotalAmount - PaidAmount;

        /// <summary>
        /// وضعیت فاکتور
        /// </summary>
        public InvoiceStatus Status { get; private set; }

        /// <summary>
        /// توضیحات فاکتور
        /// </summary>
        public string? Description { get; private set; }

        #endregion

        #region References

        /// <summary>
        /// سفارش مرتبط با این فاکتور
        /// </summary>
        public long OrderId { get; private set; }
        public Order? Order { get; private set; }

        /// <summary>
        /// دانشجو (مالک فاکتور)
        /// </summary>
        public long StudentId { get; private set; }
        public Student? Student { get; private set; }

        /// <summary>
        /// لیست تراکنش‌های مرتبط با این فاکتور
        /// </summary>
        public IReadOnlyList<Transaction> Transactions => _transactions.AsReadOnly();
        private readonly List<Transaction> _transactions = new();

        #endregion

        #region CTORs

        private Invoice() { }

        public Invoice(
            InvoiceNumber invoiceNumber,
            long orderId,
            long studentId,
            decimal totalAmount,
            string? description = null)
        {
            if (totalAmount < 0)
                throw new InvalidEntityStateException("Invoice total amount cannot be negative.", nameof(TotalAmount));

            InvoiceNumber = invoiceNumber;
            InvoiceDate = DateTime.UtcNow;
            OrderId = orderId;
            StudentId = studentId;
            TotalAmount = totalAmount;
            PaidAmount = 0;
            Status = InvoiceStatus.DRAFT;
            Description = description;

            AddEvent(new InvoiceCreated(invoiceNumber.Value, orderId, studentId, totalAmount));
        }

        #endregion

        #region Behaviors

        /// <summary>
        /// ایجاد فاکتور جدید از سفارش
        /// </summary>
        public static Invoice CreateFromOrder(
            Order order,
            Student student,
            string? description = null)
        {
            if (order == null)
                throw new InvalidEntityStateException("Order cannot be null.", nameof(Order));

            if (student == null)
                throw new InvalidEntityStateException("Student cannot be null.", nameof(Student));

            var totalAmount = order.OrderItems.Sum(item => item.TotalPrice);
            var invoiceNumber = InvoiceNumber.Generate(order.Id, DateTime.UtcNow);

            return new Invoice(invoiceNumber, order.Id, student.Id, totalAmount, description);
        }

        /// <summary>
        /// تکمیل فاکتور رایگان بدون نیاز به درگاه پرداخت
        /// </summary>
        public void MarkAsPaidWithoutPayment()
        {
            if (Status != InvoiceStatus.ISSUED)
                throw new InvalidEntityStateException("Only issued invoices can be marked as paid.", nameof(Status));

            if (TotalAmount != 0)
                throw new InvalidEntityStateException("Only zero-amount invoices can be paid without a transaction.", nameof(TotalAmount));

            Status = InvoiceStatus.PAID;
            PaidAmount = 0;
            AddEvent(new InvoicePaid(Id, InvoiceNumber!.Value, PaidAmount));
        }

        /// <summary>
        /// صادر کردن فاکتور (تغییر وضعیت از DRAFT به ISSUED)
        /// </summary>
        public void Issue()
        {
            if (Status != InvoiceStatus.DRAFT)
                throw new InvalidEntityStateException("Only draft invoices can be issued.", nameof(Status));

            Status = InvoiceStatus.ISSUED;
            AddEvent(new InvoiceIssued(Id, InvoiceNumber!.Value));
        }

        /// <summary>
        /// افزودن تراکنش به فاکتور
        /// </summary>
        public void AddTransaction(Transaction transaction)
        {
            if (transaction == null)
                throw new InvalidEntityStateException("Transaction cannot be null.", nameof(Transaction));

            if (transaction.InvoiceId != null && transaction.InvoiceId != Id)
                throw new InvalidEntityStateException("Transaction belongs to another invoice.", nameof(Transaction));

            transaction = Transaction.Create(
                transaction.TransactionNumber!,
                transaction.Amount,
                transaction.Status,
                Id,
                transaction.PaymentId,
                transaction.ReferenceNumber,
                transaction.Description);

            _transactions.Add(transaction);

            // به‌روزرسانی مبلغ پرداخت شده
            if (transaction.Status == TransactionStatus.SUCCESS)
            {
                PaidAmount += transaction.Amount;

                // اگر کل مبلغ پرداخت شد، وضعیت فاکتور را به PAID تغییر بده
                if (PaidAmount >= TotalAmount)
                {
                    Status = InvoiceStatus.PAID;
                    AddEvent(new InvoicePaid(Id, InvoiceNumber!.Value, PaidAmount));
                }
            }

            AddEvent(new TransactionAdded(Id, transaction.Id, transaction.Amount));
        }

        /// <summary>
        /// لغو کردن فاکتور
        /// </summary>
        public void Cancel(string? reason = null)
        {
            if (Status == InvoiceStatus.PAID)
                throw new InvalidEntityStateException("Paid invoices cannot be cancelled.", nameof(Status));

            if (Status == InvoiceStatus.CANCELLED)
                throw new InvalidEntityStateException("Invoice is already cancelled.", nameof(Status));

            Status = InvoiceStatus.CANCELLED;
            Description = string.IsNullOrWhiteSpace(reason) 
                ? Description 
                : $"{Description}\nCancellation Reason: {reason}";

            AddEvent(new InvoiceCancelled(Id, InvoiceNumber!.Value, reason));
        }

        /// <summary>
        /// به‌روزرسانی توضیحات
        /// </summary>
        public void UpdateDescription(string? description)
        {
            Description = description;
        }

        #endregion
    }
}
