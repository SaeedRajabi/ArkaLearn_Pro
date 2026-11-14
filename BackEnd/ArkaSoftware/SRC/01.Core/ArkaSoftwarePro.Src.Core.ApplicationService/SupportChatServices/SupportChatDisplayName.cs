namespace ArkaSoftwarePro.Src.Core.ApplicationService.SupportChatServices;

public static class SupportChatDisplayName
{
    public static string Build(string? firstName, string? lastName, string? userName, string? email)
    {
        var full = $"{firstName?.Trim() ?? ""} {lastName?.Trim() ?? ""}".Trim();
        if (!string.IsNullOrEmpty(full)) return full;
        if (!string.IsNullOrWhiteSpace(userName)) return userName.Trim();
        return email?.Trim() ?? "دانشجو";
    }
}
