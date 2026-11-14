using ArkaSoftwarePro.Src.Core.Domain.RemoteAssistAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.RemoteAssist.Commands.RequestRemoteAssistSession;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.RemoteAssistServices;

internal static class RemoteAssistMapper
{
    public static RemoteAssistSessionQri ToQri(
        RemoteAssistSession session,
        string? plainPassword = null,
        string? requesterDisplayName = null,
        string? requesterPhoneNumber = null,
        string? helperDisplayName = null) =>
        new()
        {
            SessionId = session.Id,
            RequesterUserId = session.RequesterUserId,
            AcceptedByTeacherUserId = session.AcceptedByTeacherUserId,
            OneTimeSessionCode = session.OneTimeSessionCode,
            SessionUsername = session.SessionUsername,
            SessionPassword = plainPassword,
            Status = session.Status.ToString(),
            CreatedAtUtc = session.CreatedAtUtc,
            CodeExpiresAtUtc = session.CodeExpiresAtUtc,
            AcceptedAtUtc = session.AcceptedAtUtc,
            EndedAtUtc = session.EndedAtUtc,
            ConsentRequestedAtUtc = session.ConsentRequestedAtUtc,
            AllowRemoteControl = session.AllowRemoteControl,
            AllowClipboard = session.AllowClipboard,
            AllowFileTransfer = session.AllowFileTransfer,
            AllowAudio = session.AllowAudio,
            AllowLockLocalInput = session.AllowLockLocalInput,
            RequesterDisplayName = requesterDisplayName,
            RequesterPhoneNumber = requesterPhoneNumber,
            HelperDisplayName = helperDisplayName,
            IsRequesterOnline = false,
        };

    public static RemoteAssistSessionQri WithOnline(this RemoteAssistSessionQri qri, bool online)
    {
        qri.IsRequesterOnline = online;
        return qri;
    }
}
