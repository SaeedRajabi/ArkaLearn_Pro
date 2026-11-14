using ArkaLearnDesktop.Application.Auth.Commands;
using Microsoft.Extensions.DependencyInjection;

namespace ArkaLearnDesktop.Application.DI;

public static class ApplicationServiceCollectionExtensions
{
    public static IServiceCollection AddArkaLearnDesktopApplication(this IServiceCollection services)
    {
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(LoginCommand).Assembly));
        return services;
    }
}
