using Framework.Src.Core.Domain.Aggregates;

namespace ArkaSoftwarePro.Src.Core.Domain.RemoteAssistAggregate.Entities;

public class RemoteAssistSession : AggregateRoot
{
    public const int DefaultOpenTtlDays = 30;

    /// <summary>Student who owns the listening credentials.</summary>
    public long RequesterUserId { get; private set; }

    /// <summary>Teacher/admin who requested or is connected.</summary>
    public long? AcceptedByTeacherUserId { get; private set; }

    public string OneTimeSessionCode { get; private set; } = string.Empty;
    public string SessionUsername { get; private set; } = string.Empty;
    public string PasswordHash { get; private set; } = string.Empty;
    public RemoteAssistSessionStatus Status { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime CodeExpiresAtUtc { get; private set; }
    public DateTime? AcceptedAtUtc { get; private set; }
    public DateTime? EndedAtUtc { get; private set; }
    public DateTime? ConsentRequestedAtUtc { get; private set; }

    public bool AllowRemoteControl { get; private set; } = true;
    public bool AllowClipboard { get; private set; }
    public bool AllowFileTransfer { get; private set; }
    public bool AllowAudio { get; private set; }
    public bool AllowLockLocalInput { get; private set; }

    private RemoteAssistSession() { }

    public static RemoteAssistSession CreateOpen(
        long ownerUserId,
        string oneTimeSessionCode,
        string sessionUsername,
        string passwordHash,
        int ttlDays = DefaultOpenTtlDays)
    {
        if (ownerUserId <= 0)
            throw new ArgumentException("Owner user id is required.", nameof(ownerUserId));
        if (string.IsNullOrWhiteSpace(oneTimeSessionCode))
            throw new ArgumentException("Session code is required.", nameof(oneTimeSessionCode));
        if (string.IsNullOrWhiteSpace(sessionUsername))
            throw new ArgumentException("Session username is required.", nameof(sessionUsername));
        if (string.IsNullOrWhiteSpace(passwordHash))
            throw new ArgumentException("Password hash is required.", nameof(passwordHash));

        var now = DateTime.UtcNow;
        var days = ttlDays <= 0 ? DefaultOpenTtlDays : ttlDays;
        return new RemoteAssistSession
        {
            RequesterUserId = ownerUserId,
            OneTimeSessionCode = oneTimeSessionCode.Trim().ToUpperInvariant(),
            SessionUsername = sessionUsername.Trim(),
            PasswordHash = passwordHash.Trim(),
            Status = RemoteAssistSessionStatus.Pending,
            CreatedAtUtc = now,
            CodeExpiresAtUtc = now.AddDays(days),
            AllowRemoteControl = true,
            AllowClipboard = false,
            AllowFileTransfer = false,
            AllowAudio = false,
            AllowLockLocalInput = false,
        };
    }

    /// <summary>Legacy alias used by older call sites.</summary>
    public static RemoteAssistSession Request(
        long requesterUserId,
        string oneTimeSessionCode,
        string passwordHash,
        int ttlMinutes = 15) =>
        CreateOpen(
            requesterUserId,
            oneTimeSessionCode,
            $"u{requesterUserId}",
            passwordHash,
            Math.Max(1, (int)Math.Ceiling(ttlMinutes / (60.0 * 24.0))));

    public void ExtendOpenWindow(int ttlDays = DefaultOpenTtlDays)
    {
        if (Status is not (RemoteAssistSessionStatus.Pending or RemoteAssistSessionStatus.AwaitingConsent))
            return;
        var days = ttlDays <= 0 ? DefaultOpenTtlDays : ttlDays;
        CodeExpiresAtUtc = DateTime.UtcNow.AddDays(days);
    }

    public void ChangePassword(string passwordHash)
    {
        if (string.IsNullOrWhiteSpace(passwordHash))
            throw new ArgumentException("Password hash is required.", nameof(passwordHash));
        if (Status is RemoteAssistSessionStatus.Ended or RemoteAssistSessionStatus.Expired or RemoteAssistSessionStatus.Rejected)
            throw new InvalidOperationException("Cannot change password on a closed session.");

        PasswordHash = passwordHash.Trim();
    }

    public bool CanRequestConnect(DateTime utcNow) =>
        Status == RemoteAssistSessionStatus.Pending && utcNow < CodeExpiresAtUtc && !IsDelete;

    public void RequestConnect(long helperUserId)
    {
        if (helperUserId <= 0)
            throw new ArgumentException("Helper user id is required.", nameof(helperUserId));
        if (helperUserId == RequesterUserId)
            throw new InvalidOperationException("Cannot connect to your own session.");
        if (!CanRequestConnect(DateTime.UtcNow))
            throw new InvalidOperationException("Session cannot accept a connection request.");

        AcceptedByTeacherUserId = helperUserId;
        ConsentRequestedAtUtc = DateTime.UtcNow;
        Status = RemoteAssistSessionStatus.AwaitingConsent;
        AcceptedAtUtc = null;
        EndedAtUtc = null;
    }

    /// <summary>
    /// Re-open consent for an already-active (or awaiting) session so the student
    /// must approve permissions again before remote control continues.
    /// </summary>
    public void ReRequestConsent(long helperUserId)
    {
        if (helperUserId <= 0)
            throw new ArgumentException("Helper user id is required.", nameof(helperUserId));
        if (helperUserId == RequesterUserId)
            throw new InvalidOperationException("Cannot connect to your own session.");
        if (Status is RemoteAssistSessionStatus.Ended
            or RemoteAssistSessionStatus.Expired
            or RemoteAssistSessionStatus.Rejected
            || IsDelete)
            throw new InvalidOperationException("Session cannot accept a reconnect request.");

        AcceptedByTeacherUserId = helperUserId;
        ConsentRequestedAtUtc = DateTime.UtcNow;
        Status = RemoteAssistSessionStatus.AwaitingConsent;
        AcceptedAtUtc = null;
        EndedAtUtc = null;
        ResetPermissionsToDefaults();
    }

    public bool CanGrantConsent() =>
        Status == RemoteAssistSessionStatus.AwaitingConsent && !IsDelete;

    public void GrantConsent(RemoteAssistPermissionSet permissions)
    {
        if (!CanGrantConsent())
            throw new InvalidOperationException("Session is not awaiting consent.");
        if (AcceptedByTeacherUserId is null or <= 0)
            throw new InvalidOperationException("No helper requested this session.");

        ApplyPermissions(permissions);
        AcceptedAtUtc = DateTime.UtcNow;
        Status = RemoteAssistSessionStatus.Active;
    }

    public void DenyConsent()
    {
        if (Status != RemoteAssistSessionStatus.AwaitingConsent)
            return;

        AcceptedByTeacherUserId = null;
        ConsentRequestedAtUtc = null;
        AcceptedAtUtc = null;
        Status = RemoteAssistSessionStatus.Pending;
        ResetPermissionsToDefaults();
    }

    public void UpdatePermissions(RemoteAssistPermissionSet permissions)
    {
        if (Status != RemoteAssistSessionStatus.Active)
            throw new InvalidOperationException("Permissions can only be updated on an active session.");
        ApplyPermissions(permissions);
    }

    public void Accept(long teacherUserId) => RequestConnect(teacherUserId);

    public void Reject()
    {
        if (Status == RemoteAssistSessionStatus.AwaitingConsent)
        {
            DenyConsent();
            return;
        }

        if (Status != RemoteAssistSessionStatus.Pending) return;
        Status = RemoteAssistSessionStatus.Rejected;
        EndedAtUtc = DateTime.UtcNow;
    }

    public void End()
    {
        if (Status is RemoteAssistSessionStatus.Ended or RemoteAssistSessionStatus.Expired) return;
        Status = RemoteAssistSessionStatus.Ended;
        EndedAtUtc = DateTime.UtcNow;
    }

    public void ExpireIfNeeded(DateTime utcNow)
    {
        if ((Status is RemoteAssistSessionStatus.Pending or RemoteAssistSessionStatus.AwaitingConsent)
            && utcNow >= CodeExpiresAtUtc)
        {
            Status = RemoteAssistSessionStatus.Expired;
            EndedAtUtc = utcNow;
        }
    }

    public void SoftDelete()
    {
        if (Status is RemoteAssistSessionStatus.Pending
            or RemoteAssistSessionStatus.AwaitingConsent
            or RemoteAssistSessionStatus.Active)
        {
            End();
        }

        IsDelete = true;
    }

    private void ApplyPermissions(RemoteAssistPermissionSet permissions)
    {
        AllowRemoteControl = permissions.AllowRemoteControl;
        AllowClipboard = permissions.AllowClipboard;
        AllowFileTransfer = permissions.AllowFileTransfer;
        AllowAudio = permissions.AllowAudio;
        AllowLockLocalInput = permissions.AllowLockLocalInput;
    }

    private void ResetPermissionsToDefaults()
    {
        AllowRemoteControl = true;
        AllowClipboard = false;
        AllowFileTransfer = false;
        AllowAudio = false;
        AllowLockLocalInput = false;
    }
}

public readonly record struct RemoteAssistPermissionSet(
    bool AllowRemoteControl = true,
    bool AllowClipboard = false,
    bool AllowFileTransfer = false,
    bool AllowAudio = false,
    bool AllowLockLocalInput = false);

public enum RemoteAssistSessionStatus
{
    Pending = 0,
    Active = 1,
    Ended = 2,
    Expired = 3,
    Rejected = 4,
    AwaitingConsent = 5,
}
