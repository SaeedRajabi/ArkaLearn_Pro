using Framework.Src.Infrastructure.Payments.ZarinPal.Abstractions;
using Framework.Src.Infrastructure.Payments.ZarinPal.Clients;
using Framework.Src.Infrastructure.Payments.ZarinPal.Options;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Framework.Src.Infrastructure.Payments.ZarinPal.Extensions;

/// <summary>
/// ثبت سرویس‌های کتابخانه زرین‌پال در DI.
/// </summary>
public static class ZarinPalServiceCollectionExtensions
{
    /// <summary>
    /// افزودن کلاینت زرین‌پال به کانتینر سرویس‌ها.
    /// </summary>
    /// <param name="services">کانتینر DI.</param>
    /// <param name="configuration">پیکربندی برنامه (بخش PaymentGateway یا ZarinPal).</param>
    public static IServiceCollection AddZarinPal(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<ZarinPalOptions>(configuration.GetSection(ZarinPalOptions.SectionName));
        services.AddHttpClient<IZarinPalClient, ZarinPalClient>(client =>
        {
            client.Timeout = TimeSpan.FromSeconds(60);
            client.DefaultRequestHeaders.Accept.ParseAdd("application/json");
        });
        return services;
    }

    /// <summary>
    /// افزودن کلاینت زرین‌پال با پیکربندی دستی.
    /// </summary>
    public static IServiceCollection AddZarinPal(this IServiceCollection services, Action<ZarinPalOptions> configure)
    {
        services.Configure(configure);
        services.AddHttpClient<IZarinPalClient, ZarinPalClient>(client =>
        {
            client.Timeout = TimeSpan.FromSeconds(60);
            client.DefaultRequestHeaders.Accept.ParseAdd("application/json");
        });
        return services;
    }
}
