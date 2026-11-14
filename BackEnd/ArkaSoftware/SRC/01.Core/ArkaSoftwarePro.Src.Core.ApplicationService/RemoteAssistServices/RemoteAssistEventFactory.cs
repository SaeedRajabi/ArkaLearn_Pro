using ArkaSoftwarePro.Src.Core.Contracts.RemoteAssist;
using ArkaSoftwarePro.Src.Core.Domain.RemoteAssistAggregate.Entities;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.RemoteAssistServices;

internal static class RemoteAssistEventFactory
{
    public static RemoteAssistSessionChangedEvent Build(RemoteAssistSession session, string changeType) =>
        new()
        {
            SessionId = session.Id,
            RequesterUserId = session.RequesterUserId,
            AcceptedByTeacherUserId = session.AcceptedByTeacherUserId,
            OneTimeSessionCode = session.OneTimeSessionCode,
            SessionUsername = session.SessionUsername,
            Status = session.Status.ToString(),
            CreatedAtUtc = session.CreatedAtUtc.ToString("O"),
            CodeExpiresAtUtc = session.CodeExpiresAtUtc.ToString("O"),
            AcceptedAtUtc = session.AcceptedAtUtc?.ToString("O"),
            EndedAtUtc = session.EndedAtUtc?.ToString("O"),
            ConsentRequestedAtUtc = session.ConsentRequestedAtUtc?.ToString("O"),
            ChangeType = changeType,
            AllowRemoteControl = session.AllowRemoteControl,
            AllowClipboard = session.AllowClipboard,
            AllowFileTransfer = session.AllowFileTransfer,
            AllowAudio = session.AllowAudio,
            AllowLockLocalInput = session.AllowLockLocalInput,
        };
}
