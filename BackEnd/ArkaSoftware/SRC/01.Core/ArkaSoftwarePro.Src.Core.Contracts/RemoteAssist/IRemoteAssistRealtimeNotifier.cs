namespace ArkaSoftwarePro.Src.Core.Contracts.RemoteAssist;

public interface IRemoteAssistRealtimeNotifier
{
    Task NotifySessionRequestedAsync(RemoteAssistSessionChangedEvent payload);
    Task NotifySessionAcceptedAsync(RemoteAssistSessionChangedEvent payload);
    Task NotifySessionEndedAsync(RemoteAssistSessionChangedEvent payload);
    Task NotifyConsentRequiredAsync(RemoteAssistSessionChangedEvent payload);
    Task NotifyConsentResolvedAsync(RemoteAssistSessionChangedEvent payload);
}
