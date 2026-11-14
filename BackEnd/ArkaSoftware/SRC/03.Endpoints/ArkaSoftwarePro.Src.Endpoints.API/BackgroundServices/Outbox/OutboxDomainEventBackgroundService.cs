using System.Text.Json;
using ArkaSoftwarePro.Src.Core.Domain.InvoiceAggregate.Events;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Framework.Src.Core.Contracts.ApplicationService.Events;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.OutBoxEventItems;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Endpoints.API.BackgroundServices.Outbox;

/// <summary>
/// پردازش رویدادهای دامنه که فقط در OutBox ذخیره شده و قبلاً اجرا نشده‌اند
/// (مثلاً InvoicePaid برای ثبت‌نام دوره و اعتبار مالی استاد).
/// </summary>
public sealed class OutboxDomainEventBackgroundService(
    IServiceScopeFactory scopeFactory,
    ILogger<OutboxDomainEventBackgroundService> logger) : BackgroundService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Give the app a moment to finish startup.
        await Task.Delay(TimeSpan.FromSeconds(15), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessBatchAsync(stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogWarning(ex, "Outbox domain event processing failed.");
            }

            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
        }
    }

    public async Task ProcessBatchAsync(CancellationToken cancellationToken)
    {
        List<long> ids;
        using (var scope = scopeFactory.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ArkaSoftwareCommandDbContext>();
            ids = await db.OutBoxEventItems.AsNoTracking()
                .Where(x => !x.IsProcessed && x.EventName == nameof(InvoicePaid))
                .OrderBy(x => x.OutBoxEventItemId).Select(x => x.OutBoxEventItemId)
                .Take(40).ToListAsync(cancellationToken);
        }
        foreach (var id in ids)
        {
            try
            {
                using var scope = scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<ArkaSoftwareCommandDbContext>();
                var dispatcher = scope.ServiceProvider.GetRequiredService<IDomainEventDispatcher>();
                await db.Database.CreateExecutionStrategy().ExecuteAsync(async () =>
                {
                    db.ChangeTracker.Clear();
                    await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
                    // Transaction-owned SQL Server lock coordinates independent API processes as well as workers.
                    var resource = "ArkaLearn:InvoicePaid";
                    await db.Database.ExecuteSqlInterpolatedAsync($@"
DECLARE @result int;
EXEC @result = sys.sp_getapplock @Resource={resource}, @LockMode='Exclusive', @LockOwner='Transaction', @LockTimeout=0;
IF @result < 0 THROW 51001, 'Outbox event is being handled by another worker.', 1;", cancellationToken);
                    var item = await db.OutBoxEventItems.SingleAsync(x => x.OutBoxEventItemId == id, cancellationToken);
                    if (item.IsProcessed) return;
                    var paid = JsonSerializer.Deserialize<InvoicePaidDto>(item.EventPayload ?? "{}", JsonOptions);
                    if (paid is null || paid.InvoiceId <= 0)
                        throw new InvalidOperationException("Invalid InvoicePaid event payload; manual repair is required.");
                    await dispatcher.PublishDomainEventAsync(
                        new InvoicePaid(paid.InvoiceId, paid.InvoiceNumber ?? string.Empty, paid.PaidAmount));
                    item.IsProcessed = true;
                    await db.SaveChangesAsync(cancellationToken);
                    await transaction.CommitAsync(cancellationToken);
                });
            }
            catch (Microsoft.Data.SqlClient.SqlException ex) when (ex.Number == 51001)
            {
                logger.LogDebug("InvoicePaid processing is owned by another worker; event {Id} remains pending.", id);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogError(ex, "Outbox event {OutBoxEventItemId} failed; it remains pending for retry.", id);
            }
        }
    }

    private sealed class InvoicePaidDto
    {
        public long InvoiceId { get; set; }
        public string? InvoiceNumber { get; set; }
        public decimal PaidAmount { get; set; }
    }
}
