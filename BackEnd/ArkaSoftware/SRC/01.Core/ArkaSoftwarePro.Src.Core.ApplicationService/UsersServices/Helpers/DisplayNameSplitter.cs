namespace ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;

internal static class DisplayNameSplitter
{
    public static (string FirstName, string LastName) Split(string displayName)
    {
        var trimmed = (displayName ?? string.Empty).Trim();
        if (string.IsNullOrEmpty(trimmed))
            return ("Student", "User");

        var parts = trimmed.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (parts.Length == 1)
            return (parts[0], parts[0]);

        return (parts[0], string.Join(' ', parts.Skip(1)));
    }
}
