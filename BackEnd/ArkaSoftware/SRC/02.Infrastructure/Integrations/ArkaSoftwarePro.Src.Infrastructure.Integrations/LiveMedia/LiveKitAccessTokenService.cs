using System.IdentityModel.Tokens.Jwt;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace ArkaSoftwarePro.Src.Infrastructure.Integrations.LiveMedia;

/// <summary>Creates LiveKit access tokens (JWT HS256) without an external LiveKit NuGet package.</summary>
public sealed class LiveKitAccessTokenService
{
    public string CreateToken(
        string apiKey,
        string apiSecret,
        string identity,
        string? displayName,
        string roomName,
        bool canPublish,
        TimeSpan ttl)
    {
        var now = DateTimeOffset.UtcNow;
        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(apiSecret));
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);
        var header = new JwtHeader(credentials);

        var videoGrants = new Dictionary<string, object>
        {
            ["roomJoin"] = true,
            ["room"] = roomName,
            ["canPublish"] = canPublish,
            ["canSubscribe"] = true,
            ["canPublishData"] = true,
        };

        var payload = new JwtPayload
        {
            { "iss", apiKey },
            { "sub", identity },
            { "name", string.IsNullOrWhiteSpace(displayName) ? identity : displayName },
            { "nbf", now.ToUnixTimeSeconds() },
            { "exp", now.Add(ttl).ToUnixTimeSeconds() },
            { "video", videoGrants },
        };

        return new JwtSecurityTokenHandler().WriteToken(new JwtSecurityToken(header, payload));
    }
}
