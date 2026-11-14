using ArkaSoftwarePro.Src.Core.Contracts.Finance;
using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Finance.FinanceRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Invoices.InvoiceRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Orders.OrderRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.FinanceAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.Invoices.Queries.GetInvoiceById;
using ArkaSoftwarePro.Src.Core.RequestResponse.Orders.Queries.GetOrderById;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.ApplicationService.WalletServices;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.BackfillTeacherCourseSales;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;

public class TeacherFinanceService(
    ITeacherFinanceCommandRepository financeCommandRepository,
    IInvoiceQueryRepository invoiceQueryRepository,
    IOrderQueryRepository orderQueryRepository,
    ICourseCommandRepository courseCommandRepository,
    ITeacherCommandRepository teacherCommandRepository,
    UserWalletService userWalletService, IBusinessTransactionRunner transactions)
{
    public Task<int> CreditCourseSalesFromInvoiceAsync(long invoiceId, CancellationToken cancellationToken = default) =>
        transactions.RunAsync(() => CreditCourseSalesCoreAsync(invoiceId, cancellationToken), _ => true, cancellationToken);

    private async Task<int> CreditCourseSalesCoreAsync(long invoiceId, CancellationToken cancellationToken)
    {
        var invoice = await invoiceQueryRepository.GetInvoiceByIdAsync(new GetInvoiceByIdQuery { InvoiceId = invoiceId });
        if (invoice == null) return 0;

        var order = await orderQueryRepository.GetOrderByIdAsync(new GetOrderByIdQuery { OrderId = invoice.OrderId });
        if (order == null || order.OrderItems.Count == 0) return 0;

        var settings = await financeCommandRepository.GetOrCreateSettingsAsync(cancellationToken);
        var soldAt = DateTime.UtcNow;
        var creditedCount = 0;

        foreach (var item in order.OrderItems)
        {
            var paymentReference = $"invoice:{invoiceId}:course:{item.CourseId}";
            if (await financeCommandRepository.SaleExistsByReferenceAsync(paymentReference, cancellationToken))
                continue;

            var course = await courseCommandRepository.GetAsync(item.CourseId);
            if (course?.TeacherId is not long teacherId || teacherId <= 0)
                continue;

            var gross = ToToman(item.TotalPrice);
            if (gross <= 0) continue;

            var platformFee = ToToman(gross * (double)settings.PlatformFeePercent / 100d);
            var taxableBase = gross - platformFee;
            var tax = ToToman(taxableBase * (double)settings.IncomeTaxPercent / 100d);
            var net = gross - platformFee - tax;
            if (net < 0) net = 0;

            var sale = TeacherCourseSale.Create(
                teacherId,
                item.CourseId,
                order.Id,
                invoiceId,
                order.StudentId,
                string.IsNullOrWhiteSpace(item.CourseTitle) ? $"Course #{item.CourseId}" : item.CourseTitle,
                item.Quantity,
                gross,
                tax,
                platformFee,
                net,
                paymentReference,
                soldAt);

            var wallet = await financeCommandRepository.GetOrCreateWalletAsync(teacherId, cancellationToken);
            wallet.CreditCourseSale(gross, tax, platformFee, net);
            settings.CreditCentralTreasury(gross, tax, platformFee, net);

            await financeCommandRepository.InsertCourseSaleAsync(sale, cancellationToken);
            await financeCommandRepository.SaveSettingsAsync(settings, cancellationToken);

            var teacherEntity = await teacherCommandRepository.GetByIdWithDetailsAsync(teacherId, cancellationToken);
            if (teacherEntity?.UserId is long teacherUserId)
            {
                await userWalletService.CreditTeacherSaleAsync(
                    teacherUserId,
                    net,
                    $"sale:{paymentReference}",
                    item.CourseTitle,
                    cancellationToken);
            }

            creditedCount++;
        }

        if (creditedCount > 0)
            await financeCommandRepository.CommitAsync(cancellationToken);

        return creditedCount;
    }

    public async Task<BackfillTeacherCourseSalesResult> BackfillCourseSalesFromPaidInvoicesAsync(
        CancellationToken cancellationToken = default)
    {
        var invoiceIds = await financeCommandRepository.GetPaidInvoiceIdsAsync(cancellationToken);
        var result = new BackfillTeacherCourseSalesResult { TotalPaidInvoices = invoiceIds.Count };

        foreach (var invoiceId in invoiceIds)
        {
            var credited = await CreditCourseSalesFromInvoiceAsync(invoiceId, cancellationToken);
            if (credited <= 0) continue;

            result.InvoicesCredited++;
            result.NewSalesCount += credited;
        }

        return result;
    }

    private static long ToToman(decimal amount) =>
        amount <= 0 ? 0 : Convert.ToInt64(Math.Round(amount, MidpointRounding.AwayFromZero));

    private static long ToToman(double amount) =>
        amount <= 0 ? 0 : Convert.ToInt64(Math.Round(amount, MidpointRounding.AwayFromZero));
}
