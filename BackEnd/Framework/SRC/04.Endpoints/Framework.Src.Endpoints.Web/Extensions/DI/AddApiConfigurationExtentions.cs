using FluentValidation.AspNetCore;
using Framework.Src.Endpoints.Web.Middlewares;
using Microsoft.AspNetCore.Builder;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Framework.Src.Endpoints.Web.Extensions.DI
{
    public static class AddApiConfigurationExtensions
    {
        public static IServiceCollection AddArkaSoftwareApiCore(this IServiceCollection services, IConfiguration configuration, params string[] assemblyNamesForLoad)
        {
            services.AddFluentValidationAutoValidation().AddFluentValidationClientsideAdapters().AddControllers();
            services.AddArkaSoftwareDependencies(configuration, assemblyNamesForLoad);

            return services;
        }

        public static void UseArkaSoftwareApiExceptionHandler(this IApplicationBuilder app)
        {

            app.UseApiExceptionHandler(options =>
            {
                options.AddResponseDetails = (context, ex, error) =>
                {
                    if (ex.GetType().Name == nameof(SqlException))
                    {
                        error.Detail = "Exception was a database exception!";
                    }
                };
                options.DetermineLogLevel = ex =>
                {
                    if (ex.Message.StartsWith("cannot open database", StringComparison.InvariantCultureIgnoreCase) ||
                        ex.Message.StartsWith("a network-related", StringComparison.InvariantCultureIgnoreCase))
                    {
                        return LogLevel.Critical;
                    }
                    return LogLevel.Error;
                };
            });


        }
    }
}
