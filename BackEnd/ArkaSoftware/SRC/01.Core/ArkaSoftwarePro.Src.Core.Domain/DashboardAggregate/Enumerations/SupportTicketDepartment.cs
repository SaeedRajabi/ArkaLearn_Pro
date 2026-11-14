namespace ArkaSoftwarePro.Src.Core.Domain.DashboardAggregate.Enumerations;

public static class SupportTicketDepartment
{
    public const string Support = "Support";
    public const string Services = "Services";
    public const string Sales = "Sales";
    public const string SoftwareDevelopment = "SoftwareDevelopment";

    public static readonly string[] All =
    [
        Support,
        Services,
        Sales,
        SoftwareDevelopment,
    ];

    public static bool IsValid(string? value) =>
        !string.IsNullOrWhiteSpace(value) && All.Contains(value.Trim(), StringComparer.Ordinal);
}
