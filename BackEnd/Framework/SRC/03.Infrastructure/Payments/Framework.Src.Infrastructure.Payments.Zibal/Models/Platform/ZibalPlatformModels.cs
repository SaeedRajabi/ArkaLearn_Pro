namespace Framework.Src.Infrastructure.Payments.Zibal.Models.Platform;

public sealed class ZibalWalletItem
{
    public int Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public long Balance { get; init; }
    public long WithdrawableBalance { get; init; }
}

public sealed class ZibalSubMerchantFilter
{
    public string? Id { get; init; }
    public string? BankAccount { get; init; }
}

public sealed class ZibalSubMerchantItem
{
    public string Id { get; init; } = string.Empty;
    public string BankAccount { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public int Status { get; init; }
}

public sealed class ZibalSubMerchantCreateRequest
{
    public required string BankAccount { get; init; }
    public required string Name { get; init; }
    public string? CallbackUrl { get; init; }
}

public sealed class ZibalSubMerchantEditRequest
{
    public required string Id { get; init; }
    public string? BankAccount { get; init; }
    public string? Name { get; init; }
}

public sealed class ZibalCheckoutReportRequest
{
    public string? FromDate { get; init; }
    public string? ToDate { get; init; }
    public int Page { get; init; } = 1;
    public int Size { get; init; } = 100;
    public long? TransactionTrackId { get; init; }
    public bool Verbose { get; init; }
    public IReadOnlyList<ZibalSubMerchantFilter>? SubMerchants { get; init; }
}

public sealed class ZibalCheckoutQueueRequest
{
    public bool Verbose { get; init; }
    public IReadOnlyList<ZibalSubMerchantFilter>? SubMerchants { get; init; }
}

public sealed class ZibalCheckoutInquireRequest
{
    public required string WalletId { get; init; }
    public string? CheckoutRequestId { get; init; }
    public string? UniqueCode { get; init; }
}

public sealed class ZibalGatewayTransactionReportRequest
{
    public required string MerchantId { get; init; }
    public string? FromDate { get; init; }
    public string? ToDate { get; init; }
    public int Page { get; init; } = 1;
    public int Size { get; init; } = 100;
    public long? TrackId { get; init; }
    public int? Status { get; init; }
    public string? OrderId { get; init; }
    public string? Mobile { get; init; }
    public long? Amount { get; init; }
    public string? CardNumber { get; init; }
    public bool Verbose { get; init; }
}

public sealed class ZibalRefundRequest
{
    public required long TrackId { get; init; }
    public required string AccountId { get; init; }
    public long? Amount { get; init; }
    public string? CardNumber { get; init; }
    public string? Description { get; init; }
    public bool TryReverse { get; init; }
}

public sealed class ZibalRefundInquiryRequest
{
    public long? RefundId { get; init; }
    public long? TransactionTrackId { get; init; }
}

public sealed class ZibalRefundListRequest
{
    public string? FromDate { get; init; }
    public string? ToDate { get; init; }
    public int Page { get; init; } = 1;
    public int Size { get; init; } = 100;
    public int? Type { get; init; }
    public IReadOnlyList<int>? Status { get; init; }
}

public sealed class ZibalPagedResult<T>
{
    public IReadOnlyList<T> Items { get; init; } = [];
    public int Total { get; init; }
    public long? Sum { get; init; }
    public string Message { get; init; } = string.Empty;
    public int Result { get; init; }
}

public sealed class ZibalRefundResult
{
    public bool Status { get; init; }
    public int Result { get; init; }
    public string Message { get; init; } = string.Empty;
    public bool? Reversed { get; init; }
}
