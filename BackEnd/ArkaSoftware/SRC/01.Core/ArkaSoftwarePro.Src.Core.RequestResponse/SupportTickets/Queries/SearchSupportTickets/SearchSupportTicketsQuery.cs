using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.SupportTickets.Queries.SearchSupportTickets;

public class SearchSupportTicketsQuery : IQuery<PagedData<SearchSupportTicketQri>>
{
    public string InputValue { get; set; } = string.Empty;
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public bool NeedTotalCount { get; set; } = true;
    public string? Status { get; set; }
    public string? TicketSource { get; set; }
    public string? Department { get; set; }
}

public class SearchSupportTicketQri
{
    public long Id { get; set; }
    public int DisplayNumber { get; set; }
    public string DisplayCode { get; set; } = string.Empty;
    public string TicketSource { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string RequesterName { get; set; } = string.Empty;
    public string RequesterEmail { get; set; } = string.Empty;
    public DateTime? CreatedDateTime { get; set; }
    public DateTime? LastMessageAtUtc { get; set; }
    public string? LastMessagePreview { get; set; }
}
