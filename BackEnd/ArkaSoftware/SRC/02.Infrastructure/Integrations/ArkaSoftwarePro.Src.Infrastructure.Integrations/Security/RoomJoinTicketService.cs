using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using ArkaSoftwarePro.Src.Core.Contracts.Rooms;
using Microsoft.Extensions.Configuration;

namespace ArkaSoftwarePro.Src.Infrastructure.Integrations.Security;

public sealed class RoomJoinTicketService(IConfiguration configuration) : IRoomJoinTicketService
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    private byte[] SigningKey
    {
        get
        {
            var configured = configuration["RoomJoinTicket:SigningKey"];
            if (string.IsNullOrWhiteSpace(configured)) configured = configuration["Jwt:JwtSignKey"];
            if (string.IsNullOrWhiteSpace(configured) || Encoding.UTF8.GetByteCount(configured) < 32)
                throw new InvalidOperationException("A room ticket signing key of at least 32 bytes is required.");
            return Encoding.UTF8.GetBytes(configured);
        }
    }

    public string CreateStudentTicket(long roomId, long seatUserId) =>
        Create(roomId, $"seat:{seatUserId}", RoomMeetingRole.Student, seatUserId, null);

    public string CreateGuestTicket(long roomId, string guestKey)
    {
        var key = string.IsNullOrWhiteSpace(guestKey)
            ? Guid.NewGuid().ToString("N")
            : guestKey.Trim();
        return Create(roomId, $"guest:{key}", RoomMeetingRole.Guest, null, null);
    }

    public string CreateStaffTicket(long roomId, long staffUserId, RoomMeetingRole role) =>
        Create(roomId, $"staff:{staffUserId}", role, null, staffUserId);

    public RoomJoinTicketClaims? Validate(string? ticket, long expectedRoomId)
    {
        if (string.IsNullOrWhiteSpace(ticket) || ticket.Length > 8192)
            return null;

        var parts = ticket.Split('.', 2);
        if (parts.Length != 2)
            return null;

        byte[] payloadBytes;
        try
        {
            payloadBytes = Base64UrlDecode(parts[0]);
        }
        catch
        {
            return null;
        }

        var expectedSig = ComputeHmac(payloadBytes);
        byte[] providedSig;
        try
        {
            providedSig = Base64UrlDecode(parts[1]);
        }
        catch
        {
            return null;
        }

        if (!CryptographicOperations.FixedTimeEquals(expectedSig, providedSig))
            return null;

        TicketPayload? payload;
        try
        {
            payload = JsonSerializer.Deserialize<TicketPayload>(payloadBytes, JsonOptions);
        }
        catch
        {
            return null;
        }

        if (payload == null || payload.RoomId != expectedRoomId)
            return null;

        if (payload.ExpUtc <= DateTimeOffset.UtcNow.ToUnixTimeSeconds())
            return null;

        if (!Enum.TryParse<RoomMeetingRole>(payload.Role, true, out var role) || !Enum.IsDefined(role))
            return null;

        return new RoomJoinTicketClaims
        {
            RoomId = payload.RoomId,
            ParticipantKey = payload.Sub ?? string.Empty,
            Role = role,
            SeatUserId = payload.SeatUserId,
            StaffUserId = payload.StaffUserId,
            ExpiresUtc = DateTimeOffset.FromUnixTimeSeconds(payload.ExpUtc).UtcDateTime,
        };
    }

    private string Create(long roomId, string participantKey, RoomMeetingRole role, long? seatUserId, long? staffUserId)
    {
        var payload = new TicketPayload
        {
            RoomId = roomId,
            Sub = participantKey,
            Role = role.ToString(),
            SeatUserId = seatUserId,
            StaffUserId = staffUserId,
            ExpUtc = DateTimeOffset.UtcNow.AddHours(8).ToUnixTimeSeconds(),
            Jti = Guid.NewGuid().ToString("N"),
        };

        var payloadBytes = JsonSerializer.SerializeToUtf8Bytes(payload, JsonOptions);
        var sig = ComputeHmac(payloadBytes);
        return $"{Base64UrlEncode(payloadBytes)}.{Base64UrlEncode(sig)}";
    }

    private byte[] ComputeHmac(byte[] payload) =>
        HMACSHA256.HashData(SigningKey, payload);

    private static string Base64UrlEncode(byte[] data) =>
        Convert.ToBase64String(data).TrimEnd('=').Replace('+', '-').Replace('/', '_');

    private static byte[] Base64UrlDecode(string data)
    {
        var padded = data.Replace('-', '+').Replace('_', '/');
        switch (padded.Length % 4)
        {
            case 2: padded += "=="; break;
            case 3: padded += "="; break;
        }
        return Convert.FromBase64String(padded);
    }

    private sealed class TicketPayload
    {
        public long RoomId { get; set; }
        public string? Sub { get; set; }
        public string? Role { get; set; }
        public long? SeatUserId { get; set; }
        public long? StaffUserId { get; set; }
        public long ExpUtc { get; set; }
        public string? Jti { get; set; }
    }
}
