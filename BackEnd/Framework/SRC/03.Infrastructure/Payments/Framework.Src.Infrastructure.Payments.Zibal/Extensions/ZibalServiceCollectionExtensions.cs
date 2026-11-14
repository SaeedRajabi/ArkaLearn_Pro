using Framework.Src.Infrastructure.Payments.Zibal.Abstractions;
using Framework.Src.Infrastructure.Payments.Zibal.Clients;
using Framework.Src.Infrastructure.Payments.Zibal.Options;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Framework.Src.Infrastructure.Payments.Zibal.Extensions;

public static class ZibalServiceCollectionExtensions
{
    public static IServiceCollection AddZibal(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<ZibalOptions>(configuration.GetSection(ZibalOptions.SectionName));
        services.AddHttpClient<IZibalClient, ZibalClient>(client =>
        {
            client.Timeout = TimeSpan.FromSeconds(60);
            client.DefaultRequestHeaders.Accept.ParseAdd("application/json");
        });
        services.AddHttpClient<IZibalPlatformClient, ZibalPlatformClient>(client =>
        {
            client.Timeout = TimeSpan.FromSeconds(60);
            client.DefaultRequestHeaders.Accept.ParseAdd("application/json");
        });
        return services;
    }

    public static IServiceCollection AddZibal(this IServiceCollection services, Action<ZibalOptions> configure)
    {
        services.Configure(configure);
        services.AddHttpClient<IZibalClient, ZibalClient>(client =>
        {
            client.Timeout = TimeSpan.FromSeconds(60);
            client.DefaultRequestHeaders.Accept.ParseAdd("application/json");
        });
        services.AddHttpClient<IZibalPlatformClient, ZibalPlatformClient>(client =>
        {
            client.Timeout = TimeSpan.FromSeconds(60);
            client.DefaultRequestHeaders.Accept.ParseAdd("application/json");
        });
        return services;
    }
}
