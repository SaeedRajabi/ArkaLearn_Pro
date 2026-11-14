using ArkaLearnDesktop.Application.Abstractions;
using ArkaLearnDesktop.Infrastructure.Api;
using ArkaLearnDesktop.Infrastructure.Drm;
using ArkaLearnDesktop.Infrastructure.Local;
using ArkaLearnDesktop.Infrastructure.Messenger;
using ArkaLearnDesktop.Infrastructure.RemoteAssist;
using ArkaLearnDesktop.Infrastructure.Tray;
using Microsoft.Extensions.DependencyInjection;

namespace ArkaLearnDesktop.Infrastructure.DI;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddArkaLearnDesktopInfrastructure(this IServiceCollection services)
    {
        services.AddSingleton<IWindowsStartupService, WindowsStartupService>();
        services.AddSingleton<IDesktopLocalSettings, DesktopLocalSettings>();
        services.AddSingleton<IAuthSessionStore, ProtectedSessionStore>();
        services.AddSingleton<IDesktopLicenseStore, ProtectedLicenseStore>();
        services.AddSingleton<IOfflineLicenseService, ApiOfflineLicenseService>();
        services.AddSingleton<IEncryptedMediaCacheStore, FileEncryptedMediaCacheStore>();
        services.AddSingleton<IWatchPositionStore, FileWatchPositionStore>();
        services.AddSingleton<ISecurePlaybackService, SecurePlaybackService>();
        services.AddSingleton<ISecureMaterialDownloadService, SecureMaterialDownloadService>();
        services.AddSingleton<MessengerMemoryStore>();
        services.AddSingleton<SupportChatHubClient>();
        services.AddSingleton<ISupportChatSyncService, SupportChatSyncService>();
        services.AddSingleton<RemoteAssistHubClient>();
        services.AddSingleton<IRemoteScreenShareAdapter, WindowsScreenShareAdapter>();
        services.AddSingleton<IRemoteInputExecutor, WindowsRemoteInputExecutor>();
        services.AddSingleton<IVipAccessService, VipAccessService>();
        services.AddSingleton<DesktopTrayService>();
        services.AddSingleton<IDesktopTrayService>(sp => sp.GetRequiredService<DesktopTrayService>());
        services.AddHttpClient<IDesktopApiClient, DesktopApiClient>();

        return services;
    }

    public static async Task InitializeDesktopPersistenceAsync(this IServiceProvider services)
    {
        await using var scope = services.CreateAsyncScope();
        var settings = scope.ServiceProvider.GetRequiredService<IDesktopLocalSettings>();
        await settings.EnsureInitializedAsync();
    }
}
