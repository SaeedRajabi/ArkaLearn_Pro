using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using ArkaLearnDesktop.Application.Abstractions;

namespace ArkaLearnDesktop.Infrastructure.Local;

/// <summary>Persists JWT session locally (DPAPI). Not a business database — auto-login only.</summary>
public sealed class ProtectedSessionStore : IAuthSessionStore
{
    private static readonly string SessionPath = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "ArkaLearnDesktop",
        "session.bin");

    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public Task ClearAsync(CancellationToken cancellationToken = default)
    {
        if (File.Exists(SessionPath))
            File.Delete(SessionPath);
        return Task.CompletedTask;
    }

    public async Task<string?> GetAccessTokenAsync(CancellationToken cancellationToken = default)
    {
        var row = await ReadAsync(cancellationToken);
        return row?.AccessToken;
    }

    public async Task<DesktopUserProfile?> GetCurrentUserAsync(CancellationToken cancellationToken = default)
    {
        var row = await ReadAsync(cancellationToken);
        if (row is null || string.IsNullOrWhiteSpace(row.AccessToken)) return null;
        return new DesktopUserProfile(
            row.UserId,
            row.UserName ?? string.Empty,
            row.DisplayName ?? string.Empty,
            row.Email ?? string.Empty,
            row.Role ?? string.Empty,
            row.AvatarUrl);
    }

    public async Task<bool> HasValidSessionAsync(CancellationToken cancellationToken = default)
    {
        var row = await ReadAsync(cancellationToken);
        // Presence of a stored token is enough for bootstrap — EnsureSessionAsync decides
        // whether the backend session is still valid and renews the JWT when needed.
        return row is not null && !string.IsNullOrWhiteSpace(row.AccessToken);
    }

    public async Task SaveAsync(
        DesktopUserProfile user,
        string accessToken,
        DateTime? expiresAtUtc,
        CancellationToken cancellationToken = default)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(SessionPath)!);
        var payload = new SessionFile
        {
            UserId = user.UserId,
            UserName = user.UserName,
            DisplayName = user.DisplayName,
            Email = user.Email,
            Role = user.Role,
            AvatarUrl = user.AvatarUrl,
            AccessToken = accessToken,
            LoggedInAtUtc = DateTime.UtcNow,
            TokenExpiresAtUtc = expiresAtUtc,
        };

        var json = JsonSerializer.Serialize(payload, JsonOptions);
        var protectedBytes = ProtectedData.Protect(Encoding.UTF8.GetBytes(json), null, DataProtectionScope.CurrentUser);
        await File.WriteAllBytesAsync(SessionPath, protectedBytes, cancellationToken);
    }

    private static async Task<SessionFile?> ReadAsync(CancellationToken cancellationToken)
    {
        if (!File.Exists(SessionPath)) return null;
        try
        {
            var protectedBytes = await File.ReadAllBytesAsync(SessionPath, cancellationToken);
            var json = Encoding.UTF8.GetString(ProtectedData.Unprotect(protectedBytes, null, DataProtectionScope.CurrentUser));
            return JsonSerializer.Deserialize<SessionFile>(json, JsonOptions);
        }
        catch
        {
            return null;
        }
    }

    private sealed class SessionFile
    {
        public long UserId { get; set; }
        public string? UserName { get; set; }
        public string? DisplayName { get; set; }
        public string? Email { get; set; }
        public string? Role { get; set; }
        public string? AvatarUrl { get; set; }
        public string? AccessToken { get; set; }
        public DateTime LoggedInAtUtc { get; set; }
        public DateTime? TokenExpiresAtUtc { get; set; }
    }
}
