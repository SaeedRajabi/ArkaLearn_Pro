using Framework.Src.Utilities.OutService.Services;
using Microsoft.Extensions.DependencyInjection;

namespace Framework.Src.Endpoints.Web.Extensions.DI
{
    public static class AddArkaSoftwareServicesExtensions
    {
        public static IServiceCollection AddArkaSoftwareUnitalityServices(
        this IServiceCollection services)
        {
            services.AddTransient<ArkaSoftwareCMPOutServices>();
            return services;
        }
    }
}
