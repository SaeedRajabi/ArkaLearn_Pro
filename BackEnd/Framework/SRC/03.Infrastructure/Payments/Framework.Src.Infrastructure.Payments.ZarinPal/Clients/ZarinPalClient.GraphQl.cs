using System.Text.Json;
using Framework.Src.Infrastructure.Payments.ZarinPal.Abstractions;
using Framework.Src.Infrastructure.Payments.ZarinPal.Models.GraphQl;

namespace Framework.Src.Infrastructure.Payments.ZarinPal.Clients;

public sealed partial class ZarinPalClient
{
    /// <inheritdoc />
    public async Task<IReadOnlyList<ZarinPalSession>> GetSessionsAsync(
        string terminalId,
        ZarinPalSessionFilter? filter = null,
        int? limit = null,
        int? offset = null,
        CancellationToken cancellationToken = default)
    {
        const string query = """
            query($terminal_id: ID, $filter: SessionStatusEnum, $limit: Int, $offset: Int) {
              Session(terminal_id: $terminal_id, filter: $filter, limit: $limit, offset: $offset) {
                id status amount description created_at
              }
            }
            """;

        var variables = new Dictionary<string, object?> { ["terminal_id"] = terminalId };
        if (filter.HasValue) variables["filter"] = MapSessionFilter(filter.Value);
        if (limit.HasValue) variables["limit"] = limit.Value;
        if (offset.HasValue) variables["offset"] = offset.Value;

        var data = await ExecuteGraphQlAsync(query, variables, cancellationToken);
        if (!data.TryGetProperty("Session", out var sessions) || sessions.ValueKind != JsonValueKind.Array)
            return Array.Empty<ZarinPalSession>();

        return sessions.EnumerateArray().Select(ParseSession).ToList();
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<ZarinPalSession>> SearchSessionsAsync(
        ZarinPalSessionSearchFilter filter,
        CancellationToken cancellationToken = default)
    {
        const string query = """
            query Sessions($terminal_id: ID, $reference_id: String, $id: ID, $card_pan: String,
              $description: String, $mobile: CellNumber, $email: String, $rrn: String) {
              Session(terminal_id: $terminal_id, reference_id: $reference_id, id: $id,
                card_pan: $card_pan, description: $description, mobile: $mobile, email: $email, rrn: $rrn) {
                id status amount description created_at
                session_tries { id session_id payment_id payer_ip init_time verify_time status rrn card_pan created_at is_card_mobile_verified }
              }
            }
            """;

        var variables = new
        {
            terminal_id = filter.TerminalId,
            reference_id = filter.ReferenceId,
            id = filter.Id,
            card_pan = filter.CardPan,
            description = filter.Description,
            mobile = filter.Mobile,
            email = filter.Email,
            rrn = filter.Rrn
        };

        var data = await ExecuteGraphQlAsync(query, variables, cancellationToken);
        if (!data.TryGetProperty("Session", out var sessions) || sessions.ValueKind != JsonValueKind.Array)
            return Array.Empty<ZarinPalSession>();

        return sessions.EnumerateArray().Select(ParseSessionWithTries).ToList();
    }

    /// <inheritdoc />
    public async Task<ZarinPalSession?> GetSessionByIdAsync(
        string terminalId,
        string sessionId,
        CancellationToken cancellationToken = default)
    {
        const string query = """
            query SessionById($terminal_id: ID, $id: ID) {
              Session(terminal_id: $terminal_id, id: $id) {
                id amount status description created_at
                terminal { id }
                timeline { refund_status refund_amount refund_time }
                session_tries { session_id status rrn card_pan is_card_mobile_verified }
              }
            }
            """;

        var data = await ExecuteGraphQlAsync(query, new { terminal_id = terminalId, id = sessionId }, cancellationToken);
        if (!data.TryGetProperty("Session", out var sessions) || sessions.ValueKind != JsonValueKind.Array)
            return null;

        var first = sessions.EnumerateArray().FirstOrDefault();
        return first.ValueKind == JsonValueKind.Undefined ? null : ParseSessionWithTries(first);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<ZarinPalReconciliation>> GetReconciliationsAsync(
        ZarinPalReconciliationSearchFilter filter,
        CancellationToken cancellationToken = default)
    {
        const string query = """
            query getReconciles($terminal_id: ID, $filter: ReconciliationStatusEnum,
              $created_from_date: DateTime, $created_to_date: DateTime, $id: ID, $reference_id: String) {
              resource: Reconciliation(
                terminal_id: $terminal_id, filter: $filter, id: $id,
                created_to_date: $created_to_date, created_from_date: $created_from_date,
                reference_id: $reference_id) {
                id status amount payable_at reference_id reconciled_at
              }
            }
            """;

        var variables = new Dictionary<string, object?>
        {
            ["terminal_id"] = filter.TerminalId,
            ["filter"] = MapReconciliationFilter(filter.Filter),
            ["id"] = filter.Id,
            ["reference_id"] = filter.ReferenceId
        };
        if (filter.CreatedFromDate.HasValue)
            variables["created_from_date"] = filter.CreatedFromDate.Value.ToString("yyyy-MM-dd");
        if (filter.CreatedToDate.HasValue)
            variables["created_to_date"] = filter.CreatedToDate.Value.ToString("yyyy-MM-dd");

        var data = await ExecuteGraphQlAsync(query, variables, cancellationToken);
        if (!data.TryGetProperty("resource", out var items) || items.ValueKind != JsonValueKind.Array)
            return Array.Empty<ZarinPalReconciliation>();

        return items.EnumerateArray().Select(ParseReconciliation).ToList();
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<ZarinPalBankAccount>> GetBankAccountsAsync(
        int? limit = null,
        CancellationToken cancellationToken = default)
    {
        var query = limit.HasValue
            ? "query { BankAccounts(limit: " + limit.Value + ") { id iban status is_legal holder_name type issuing_bank { name slug } } }"
            : "query { BankAccounts { id iban status is_legal holder_name type issuing_bank { name slug } } }";

        var data = await ExecuteGraphQlAsync(query, null, cancellationToken);
        if (!data.TryGetProperty("BankAccounts", out var items) || items.ValueKind != JsonValueKind.Array)
            return Array.Empty<ZarinPalBankAccount>();

        return items.EnumerateArray().Select(ParseBankAccount).ToList();
    }

    /// <inheritdoc />
    public async Task<ZarinPalBankAccount> AddBankAccountAsync(
        ZarinPalBankAccountAddRequest request,
        CancellationToken cancellationToken = default)
    {
        const string mutation = """
            mutation BankAccountAdd($iban: String!, $is_legal: Boolean!, $type: BankAccountTypeEnum) {
              BankAccountAdd(iban: $iban, is_legal: $is_legal, type: $type) {
                id iban status is_legal holder_name type issuing_bank { name slug }
              }
            }
            """;

        var data = await ExecuteGraphQlAsync(mutation, new
        {
            iban = request.Iban,
            is_legal = request.IsLegal,
            type = request.Type
        }, cancellationToken);

        if (!data.TryGetProperty("BankAccountAdd", out var item))
            throw new Exceptions.ZarinPalException("پاسخ افزودن حساب بانکی نامعتبر است.");

        return ParseBankAccount(item);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<ZarinPalTerminal>> GetTerminalsAsync(
        CancellationToken cancellationToken = default)
    {
        const string query = """
            query { Terminals { id status preferred_bank_account_id domain support_phone key name logo created_at updated_at } }
            """;

        var data = await ExecuteGraphQlAsync(query, null, cancellationToken);
        if (!data.TryGetProperty("Terminals", out var items) || items.ValueKind != JsonValueKind.Array)
            return Array.Empty<ZarinPalTerminal>();

        return items.EnumerateArray().Select(ParseTerminal).ToList();
    }

    /// <inheritdoc />
    public async Task<ZarinPalTerminal> AddTerminalAsync(
        ZarinPalTerminalAddRequest request,
        CancellationToken cancellationToken = default)
    {
        const string mutation = """
            mutation TerminalAdd($mcc_id: ID!, $domain: String!, $support_phone: CellNumber!, $name: String!, $bank_account_id: ID!) {
              TerminalAdd(mcc_id: $mcc_id, domain: $domain, support_phone: $support_phone, name: $name, bank_account_id: $bank_account_id) {
                id mcc_id preferred_bank_account_id domain support_phone key name status logo created_at updated_at
              }
            }
            """;

        var data = await ExecuteGraphQlAsync(mutation, new
        {
            mcc_id = request.MccId,
            domain = request.Domain,
            support_phone = request.SupportPhone,
            name = request.Name,
            bank_account_id = request.BankAccountId
        }, cancellationToken);

        if (!data.TryGetProperty("TerminalAdd", out var item))
            throw new Exceptions.ZarinPalException("پاسخ ایجاد ترمینال نامعتبر است.");

        return ParseTerminal(item);
    }

    /// <inheritdoc />
    public async Task<ZarinPalInvoice> AddInvoiceAsync(
        ZarinPalInvoiceAddRequest request,
        CancellationToken cancellationToken = default)
    {
        const string mutation = """
            mutation InvoiceAdd($terminal_id: ID!, $amount: BigInteger!, $fee_type: TerminalFeeTypeEnum,
              $description: String!, $note: String, $callback_url: String, $payer_name: String!,
              $payer_mobile: String!, $payer_email: String, $notify_type: NotifyTypeEnum) {
              InvoiceAdd(terminal_id: $terminal_id, amount: $amount, fee_type: $fee_type,
                description: $description, note: $note, callback_url: $callback_url,
                payer_name: $payer_name, payer_mobile: $payer_mobile, payer_email: $payer_email,
                notify_type: $notify_type) {
                id status amount fee description
                sessions { id amount status payer_info { order_id } }
              }
            }
            """;

        var data = await ExecuteGraphQlAsync(mutation, new
        {
            terminal_id = request.TerminalId,
            amount = request.Amount,
            fee_type = request.FeeType,
            description = request.Description,
            note = request.Note,
            callback_url = request.CallbackUrl,
            payer_name = request.PayerName,
            payer_mobile = request.PayerMobile,
            payer_email = request.PayerEmail,
            notify_type = request.NotifyType
        }, cancellationToken);

        if (!data.TryGetProperty("InvoiceAdd", out var item))
            throw new Exceptions.ZarinPalException("پاسخ ایجاد فاکتور نامعتبر است.");

        return ParseInvoice(item);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<ZarinPalInvoice>> GetInvoicesAsync(
        string terminalId,
        string? invoiceId = null,
        CancellationToken cancellationToken = default)
    {
        const string query = """
            query invoice($terminal_id: ID, $id: ID) {
              Invoice(terminal_id: $terminal_id, id: $id) {
                id description status amount
                sessions { id status amount payer_info { order_id } }
              }
            }
            """;

        var data = await ExecuteGraphQlAsync(query, new { terminal_id = terminalId, id = invoiceId }, cancellationToken);
        if (!data.TryGetProperty("Invoice", out var items) || items.ValueKind != JsonValueKind.Array)
            return Array.Empty<ZarinPalInvoice>();

        return items.EnumerateArray().Select(ParseInvoice).ToList();
    }

    /// <inheritdoc />
    public async Task<ZarinPalRefundResult> AddRefundAsync(
        ZarinPalRefundRequest request,
        CancellationToken cancellationToken = default)
    {
        const string mutation = """
            mutation AddRefund($session_id: ID!, $amount: BigInteger!, $description: String,
              $method: InstantPayoutActionTypeEnum, $reason: RefundReasonEnum) {
              resource: AddRefund(session_id: $session_id, amount: $amount, description: $description,
                method: $method, reason: $reason) {
                terminal_id id amount timeline { refund_amount refund_time refund_status }
              }
            }
            """;

        var data = await ExecuteGraphQlAsync(mutation, new
        {
            session_id = request.SessionId,
            amount = request.Amount,
            description = request.Description,
            method = MapRefundMethod(request.Method),
            reason = MapRefundReason(request.Reason)
        }, cancellationToken);

        if (!data.TryGetProperty("resource", out var item))
            throw new Exceptions.ZarinPalException("پاسخ استرداد نامعتبر است.");

        return ParseRefund(item);
    }

    /// <inheritdoc />
    public async Task<ZarinPalPayout> AddPayoutAsync(
        ZarinPalPayoutAddRequest request,
        CancellationToken cancellationToken = default)
    {
        const string mutation = """
            mutation PayoutAdd($terminal_id: ID!, $bank_account_id: ID!, $amount: BigInteger!,
              $description: String, $reconciliation_parts: ReconciliationPartsEnum) {
              resource: PayoutAdd(terminal_id: $terminal_id, bank_account_id: $bank_account_id,
                amount: $amount, description: $description, reconciliation_parts: $reconciliation_parts) {
                id url_code description status amount percent reconciliation_parts created_at updated_at
              }
            }
            """;

        var data = await ExecuteGraphQlAsync(mutation, new
        {
            terminal_id = request.TerminalId,
            bank_account_id = request.BankAccountId,
            amount = request.Amount,
            description = request.Description,
            reconciliation_parts = request.ReconciliationParts
        }, cancellationToken);

        if (!data.TryGetProperty("resource", out var item))
            throw new Exceptions.ZarinPalException("پاسخ تسویه نامعتبر است.");

        return ParsePayout(item);
    }

    /// <inheritdoc />
    public async Task<ZarinPalInstantPayout> AddInstantPayoutAsync(
        ZarinPalInstantPayoutAddRequest request,
        CancellationToken cancellationToken = default)
    {
        const string mutation = """
            mutation InstantPayoutAdd($terminal_id: ID!, $bank_account_id: ID!, $amount: BigInteger!) {
              resource: InstantPayoutAdd(terminal_id: $terminal_id, bank_account_id: $bank_account_id, amount: $amount) {
                id url_code status amount fee created_at
              }
            }
            """;

        var data = await ExecuteGraphQlAsync(mutation, new
        {
            terminal_id = request.TerminalId,
            bank_account_id = request.BankAccountId,
            amount = request.Amount
        }, cancellationToken);

        if (!data.TryGetProperty("resource", out var item))
            throw new Exceptions.ZarinPalException("پاسخ تسویه آنی نامعتبر است.");

        return ParseInstantPayout(item);
    }

    /// <inheritdoc />
    public async Task<ZarinPalInstantPayout?> GetInstantPayoutAsync(
        string terminalId,
        string payoutId,
        CancellationToken cancellationToken = default)
    {
        const string query = """
            query getInstantPayout($id: ID, $terminal_id: ID) {
              resource: InstantPayout(id: $id, terminal_id: $terminal_id) {
                id url_code status description amount fee reference_id reconciled_at created_at updated_at
              }
            }
            """;

        var data = await ExecuteGraphQlAsync(query, new { terminal_id = terminalId, id = payoutId }, cancellationToken);
        if (!data.TryGetProperty("resource", out var items) || items.ValueKind != JsonValueKind.Array)
            return null;

        var first = items.EnumerateArray().FirstOrDefault();
        return first.ValueKind == JsonValueKind.Undefined ? null : ParseInstantPayout(first);
    }

    #region Parse helpers

    private static string MapSessionFilter(ZarinPalSessionFilter filter) => filter switch
    {
        ZarinPalSessionFilter.Paid => "PAID",
        ZarinPalSessionFilter.Verified => "VERIFIED",
        ZarinPalSessionFilter.Trash => "TRASH",
        ZarinPalSessionFilter.Active => "ACTIVE",
        ZarinPalSessionFilter.Refunded => "REFUNDED",
        _ => "ALL"
    };

    private static string MapReconciliationFilter(ZarinPalReconciliationFilter filter) => filter switch
    {
        ZarinPalReconciliationFilter.Paid => "PAID",
        ZarinPalReconciliationFilter.InProgress => "IN_PROGRESS",
        ZarinPalReconciliationFilter.Reversed => "REVERSED",
        _ => "ALL"
    };

    private static string MapRefundMethod(ZarinPalRefundMethod method)
        => method == ZarinPalRefundMethod.Card ? "CARD" : "PAYA";

    private static string MapRefundReason(ZarinPalRefundReason reason) => reason switch
    {
        ZarinPalRefundReason.DuplicateTransaction => "DUPLICATE_TRANSACTION",
        ZarinPalRefundReason.SuspiciousTransaction => "SUSPICIOUS_TRANSACTION",
        ZarinPalRefundReason.Other => "OTHER",
        _ => "CUSTOMER_REQUEST"
    };

    private static ZarinPalSession ParseSession(JsonElement e) => new()
    {
        Id = GetString(e, "id") ?? string.Empty,
        Status = GetString(e, "status") ?? string.Empty,
        Amount = GetLong(e, "amount"),
        Description = GetString(e, "description"),
        CreatedAt = GetDate(e, "created_at")
    };

    private static ZarinPalSession ParseSessionWithTries(JsonElement e)
    {
        IReadOnlyList<ZarinPalSessionTry> list = Array.Empty<ZarinPalSessionTry>();
        if (e.TryGetProperty("session_tries", out var tries) && tries.ValueKind == JsonValueKind.Array)
        {
            list = tries.EnumerateArray().Select(t => new ZarinPalSessionTry
            {
                Id = GetString(t, "id") ?? string.Empty,
                SessionId = GetString(t, "session_id") ?? string.Empty,
                PaymentId = GetString(t, "payment_id"),
                PayerIp = GetString(t, "payer_ip"),
                InitTime = GetInt(t, "init_time"),
                VerifyTime = GetInt(t, "verify_time"),
                Status = GetString(t, "status") ?? string.Empty,
                Rrn = GetString(t, "rrn"),
                CardPan = GetString(t, "card_pan"),
                IsCardMobileVerified = GetBool(t, "is_card_mobile_verified"),
                CreatedAt = GetDate(t, "created_at")
            }).ToList();
        }

        return new ZarinPalSession
        {
            Id = GetString(e, "id") ?? string.Empty,
            Status = GetString(e, "status") ?? string.Empty,
            Amount = GetLong(e, "amount"),
            Description = GetString(e, "description"),
            CreatedAt = GetDate(e, "created_at"),
            SessionTries = list
        };
    }

    private static ZarinPalReconciliation ParseReconciliation(JsonElement e) => new()
    {
        Id = GetString(e, "id") ?? string.Empty,
        Status = GetString(e, "status") ?? string.Empty,
        Amount = GetLong(e, "amount"),
        PayableAt = GetDate(e, "payable_at"),
        ReferenceId = GetString(e, "reference_id"),
        ReconciledAt = GetDate(e, "reconciled_at")
    };

    private static ZarinPalBankAccount ParseBankAccount(JsonElement e) => new()
    {
        Id = GetString(e, "id") ?? string.Empty,
        Iban = GetString(e, "iban") ?? string.Empty,
        Status = GetString(e, "status") ?? string.Empty,
        IsLegal = GetBool(e, "is_legal") ?? false,
        HolderName = GetString(e, "holder_name"),
        Type = GetString(e, "type"),
        IssuingBank = e.TryGetProperty("issuing_bank", out var bank) ? new ZarinPalIssuingBank
        {
            Name = GetString(bank, "name") ?? string.Empty,
            Slug = GetString(bank, "slug") ?? string.Empty
        } : null
    };

    private static ZarinPalTerminal ParseTerminal(JsonElement e) => new()
    {
        Id = GetString(e, "id") ?? string.Empty,
        Status = GetString(e, "status") ?? string.Empty,
        PreferredBankAccountId = GetString(e, "preferred_bank_account_id"),
        Domain = GetString(e, "domain"),
        SupportPhone = GetString(e, "support_phone"),
        Key = GetString(e, "key"),
        Name = GetString(e, "name"),
        Logo = GetString(e, "logo"),
        CreatedAt = GetDate(e, "created_at"),
        UpdatedAt = GetDate(e, "updated_at")
    };

    private static ZarinPalInvoice ParseInvoice(JsonElement e)
    {
        var sessions = Array.Empty<ZarinPalInvoiceSession>();
        if (e.TryGetProperty("sessions", out var s) && s.ValueKind == JsonValueKind.Array)
        {
            sessions = s.EnumerateArray().Select(x => new ZarinPalInvoiceSession
            {
                Id = GetString(x, "id") ?? string.Empty,
                Status = GetString(x, "status") ?? string.Empty,
                Amount = GetLong(x, "amount"),
                OrderId = x.TryGetProperty("payer_info", out var pi) ? GetString(pi, "order_id") : null
            }).ToArray();
        }

        return new ZarinPalInvoice
        {
            Id = GetString(e, "id") ?? string.Empty,
            Status = GetString(e, "status") ?? string.Empty,
            Amount = GetLong(e, "amount"),
            Fee = GetLongNullable(e, "fee"),
            Description = GetString(e, "description"),
            Sessions = sessions
        };
    }

    private static ZarinPalRefundResult ParseRefund(JsonElement e) => new()
    {
        TerminalId = GetString(e, "terminal_id") ?? string.Empty,
        Id = GetString(e, "id") ?? string.Empty,
        Amount = GetLong(e, "amount"),
        Timeline = e.TryGetProperty("timeline", out var tl) ? new ZarinPalRefundTimeline
        {
            RefundAmount = GetLongNullable(tl, "refund_amount"),
            RefundTime = GetDate(tl, "refund_time"),
            RefundStatus = GetString(tl, "refund_status")
        } : null
    };

    private static ZarinPalPayout ParsePayout(JsonElement e) => new()
    {
        Id = GetString(e, "id") ?? string.Empty,
        UrlCode = GetString(e, "url_code"),
        Status = GetString(e, "status") ?? string.Empty,
        Description = GetString(e, "description"),
        Amount = GetLong(e, "amount"),
        Percent = GetInt(e, "percent"),
        ReconciliationParts = GetString(e, "reconciliation_parts"),
        CreatedAt = GetDate(e, "created_at"),
        UpdatedAt = GetDate(e, "updated_at")
    };

    private static ZarinPalInstantPayout ParseInstantPayout(JsonElement e) => new()
    {
        Id = GetString(e, "id") ?? string.Empty,
        UrlCode = GetString(e, "url_code"),
        Status = GetString(e, "status") ?? string.Empty,
        Description = GetString(e, "description"),
        Amount = GetLong(e, "amount"),
        Fee = GetLongNullable(e, "fee"),
        ReferenceId = GetString(e, "reference_id"),
        ReconciledAt = GetDate(e, "reconciled_at"),
        CreatedAt = GetDate(e, "created_at"),
        UpdatedAt = GetDate(e, "updated_at")
    };

    private static string? GetString(JsonElement e, string name)
        => e.TryGetProperty(name, out var p) && p.ValueKind == JsonValueKind.String ? p.GetString() : p.ValueKind == JsonValueKind.Number ? p.GetRawText() : null;

    private static long GetLong(JsonElement e, string name)
        => e.TryGetProperty(name, out var p) && p.TryGetInt64(out var v) ? v : 0;

    private static long? GetLongNullable(JsonElement e, string name)
        => e.TryGetProperty(name, out var p) && p.TryGetInt64(out var v) ? v : null;

    private static int? GetInt(JsonElement e, string name)
        => e.TryGetProperty(name, out var p) && p.TryGetInt32(out var v) ? v : null;

    private static bool? GetBool(JsonElement e, string name)
        => e.TryGetProperty(name, out var p) && (p.ValueKind == JsonValueKind.True || p.ValueKind == JsonValueKind.False) ? p.GetBoolean() : null;

    private static DateTimeOffset? GetDate(JsonElement e, string name)
        => e.TryGetProperty(name, out var p) && p.ValueKind == JsonValueKind.String && DateTimeOffset.TryParse(p.GetString(), out var d) ? d : null;

    #endregion
}
