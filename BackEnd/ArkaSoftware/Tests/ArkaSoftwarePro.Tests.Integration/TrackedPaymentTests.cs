using ArkaSoftwarePro.Src.Core.Domain.FinanceAggregate.Entities;
using ArkaSoftwarePro.Src.Core.ApplicationService.PaymentsServices;
using ArkaSoftwarePro.Src.Core.Contracts.Finance.Payments;
using ArkaSoftwarePro.Src.Infrastructure.Integrations.Payments;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.Finance;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Services;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace ArkaSoftwarePro.Tests.Integration;

public sealed class TrackedPaymentTests : IAsyncLifetime
{
    private readonly SqliteConnection connection = new("Data Source=:memory:");
    private PaymentDb db = null!;
    private PaymentAttemptStore store = null!;
    private TrackedPaymentService service = null!;
    private readonly Gateway gateway = new();
    private readonly PaymentGatewayRuntimeOptions options = new() { Provider = "IdPay", AmountMultiplier = 10 };
    private int deliveries;

    public async Task InitializeAsync()
    {
        await connection.OpenAsync();
        db = new PaymentDb(new DbContextOptionsBuilder<ArkaSoftwareCommandDbContext>().UseSqlite(connection).Options);
        await db.Database.EnsureCreatedAsync();
        store = new PaymentAttemptStore(db);
        service = new TrackedPaymentService(store, NullLogger<TrackedPaymentService>.Instance);
    }
    public async Task DisposeAsync() { await db.DisposeAsync(); await connection.DisposeAsync(); }

    private Task<PaymentStartResult> Start(string order = "order-one") => service.StartAsync(
        new PaymentStartRequest(order, 120_000, "https://example.test/callback", "test", null, null, null),
        options, gateway, 1, 21, 42, default);

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task BusinessTransactionRollsBackSavedWritesWhenOperationFails(bool throws)
    {
        var runner = new BusinessTransactionRunner(db);
        async Task<bool> Operation()
        {
            db.Add(new DeliveryMarker { Id = 1 });
            await db.SaveChangesAsync();
            if (throws) throw new InvalidOperationException("fulfillment failed after debit");
            return false;
        }
        if (throws) await Assert.ThrowsAsync<InvalidOperationException>(() => runner.RunAsync(Operation, result => result));
        else Assert.False(await runner.RunAsync(Operation, result => result));
        db.ChangeTracker.Clear();
        Assert.Equal(0, await db.Set<DeliveryMarker>().CountAsync());
    }

    [Fact]
    public async Task NestedBusinessOperationCommitsOnlyWithItsOuterTransaction()
    {
        var runner = new BusinessTransactionRunner(db);
        Assert.False(await runner.RunAsync(async () =>
        {
            db.Add(new DeliveryMarker { Id = 1 });
            await db.SaveChangesAsync();
            Assert.True(await runner.RunAsync(async () =>
            {
                db.Add(new DeliveryMarker { Id = 2 });
                await db.SaveChangesAsync();
                return true;
            }, result => result));
            return false;
        }, result => result));
        db.ChangeTracker.Clear();
        Assert.Equal(0, await db.Set<DeliveryMarker>().CountAsync());
    }

    private Task<(string, string?)> Fulfill(PaymentAttempt attempt, PaymentVerifyResult result)
    {
        Assert.Equal(120_000, attempt.ExpectedAmount);
        Assert.Equal(42, attempt.UserId);
        deliveries++;
        return Task.FromResult<(string, string?)>(("done", "https://example.test/success"));
    }

    [Fact]
    public async Task RepeatedCallbackDeliversOnceAndReturnsStoredResult()
    {
        await Start();
        Assert.Equal("done", await service.ProcessAsync("order-one", "payment-one", options, gateway, Fulfill, url => url, default));
        var repeat = await service.ProcessAsync("order-one", "payment-one", options, gateway, Fulfill, url => url, default);
        Assert.Equal("https://example.test/success", repeat);
        Assert.Equal(1, deliveries);
        Assert.Equal(1, gateway.Verifications);
    }

    [Theory]
    [InlineData("unrecorded", "payment-one", 120000, "order-one")]
    [InlineData("order-one", "another-payment", 120000, "order-one")]
    [InlineData("order-one", "payment-one", 1000, "order-one")]
    [InlineData("order-one", "payment-one", 120000, "another-order")]
    public async Task UnknownOrMismatchedPaymentCannotDeliver(string order, string payment, long amount, string gatewayOrder)
    {
        await Start();
        gateway.Amount = amount;
        gateway.Order = gatewayOrder;
        await Assert.ThrowsAsync<PaymentValidationException>(() => service.ProcessAsync(order, payment, options, gateway, Fulfill, url => url, default));
        Assert.Equal(0, deliveries);
        Assert.NotEqual(PaymentAttemptStatus.Completed, (await store.FindAsync("order-one", default))!.Status);
    }

    [Fact]
    public async Task LeaseCannotBeAcquiredTwiceAndCanBeRetriedAfterRelease()
    {
        await Start();
        var provider = (await store.FindAsync("order-one", default))!.Provider;
        var first = await store.TryAcquireAsync("order-one", "payment-one", provider, default);
        Assert.NotNull(first);
        Assert.Null(await store.TryAcquireAsync("order-one", "payment-one", provider, default));
        await store.ReleaseAsync("order-one", Guid.NewGuid(), default);
        Assert.Null(await store.TryAcquireAsync("order-one", "payment-one", provider, default));
        await store.ReleaseAsync("order-one", first!.Value, default);
        Assert.NotNull(await store.TryAcquireAsync("order-one", "payment-one", provider, default));
    }

    [Fact]
    public async Task FailedFulfillmentRollsBackAndRetriesWithoutReverifyingGateway()
    {
        await Start();
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.ProcessAsync<string>("order-one", "payment-one", options, gateway,
            async (attempt, verified) =>
            {
                db.Add(new DeliveryMarker { Id = 1 });
                await db.SaveChangesAsync();
                throw new InvalidOperationException("simulated failure after a database write");
            }, url => url, default));
        db.ChangeTracker.Clear();
        Assert.Equal(0, await db.Set<DeliveryMarker>().CountAsync());
        Assert.NotNull((await store.FindAsync("order-one", default))!.ReferenceNumber);
        Assert.Equal("done", await service.ProcessAsync("order-one", "payment-one", options, gateway, Fulfill, url => url, default));
        Assert.Equal(1, gateway.Verifications);
    }

    [Fact]
    public async Task GatewayReferenceCannotBeReusedForAnotherOrder()
    {
        await Start();
        await service.ProcessAsync("order-one", "payment-one", options, gateway, Fulfill, url => url, default);
        gateway.Payment = "payment-two";
        gateway.Order = "order-two";
        await Start("order-two");
        await Assert.ThrowsAsync<SqliteException>(() => service.ProcessAsync("order-two", "payment-two", options, gateway, Fulfill, url => url, default));
        Assert.Equal(1, deliveries);
    }

    private sealed class Gateway : IClientPaymentGateway
    {
        public string Payment = "payment-one", Order = "order-one";
        public long Amount = 120_000;
        public int Verifications;
        public Task<PaymentStartResult> CreatePaymentAsync(PaymentStartRequest request, CancellationToken cancellationToken = default) =>
            Task.FromResult(new PaymentStartResult(Payment, "https://example.test/pay"));
        public Task<PaymentVerifyResult> VerifyPaymentAsync(PaymentVerifyRequest request, CancellationToken cancellationToken = default)
        {
            Verifications++;
            Assert.Equal(120_000, request.Amount);
            return Task.FromResult(new PaymentVerifyResult(true, "ok", Amount, "unique-reference", null, Payment, Order));
        }
    }

    private sealed class DeliveryMarker { public int Id { get; set; } }
    private sealed class PaymentDb(DbContextOptions<ArkaSoftwareCommandDbContext> options) : ArkaSoftwareCommandDbContext(options)
    {
        protected override void OnModelCreating(ModelBuilder builder)
        {
            foreach (var type in builder.Model.GetEntityTypes().ToArray()) builder.Ignore(type.ClrType);
            builder.ApplyConfiguration(new PaymentAttemptConfiguration());
            builder.Entity<DeliveryMarker>().HasKey(x => x.Id);
        }
        protected override void BeforeSaveTriggers() { }
    }
}
