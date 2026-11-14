using Microsoft.IdentityModel.Tokens;
using System.Text;
using ArkaSoftwarePro.Src.Core.Contracts.Users.SecurityTokenContracts;
using ArkaSoftwarePro.Src.Infrastructure.Security.IMP.Services;

namespace ArkaSoftwarePro.Src.Endpoints.API.DI.JWT
{
    public static class AddSecurityConfigurationExtensions
    {
        public static IServiceCollection AddSecurityDependencies(this IServiceCollection services, IConfiguration configuration)
        {

            var securityConfig = new JwtGeneratorSettings();
            configuration.GetSection("Jwt").Bind(securityConfig);

            services.AddSingleton(securityConfig);

            services.AddSingleton(provider =>
            {
                var config = provider.GetRequiredService<JwtGeneratorSettings>();

                return new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = config.JwtIssuer,
                    ValidAudience = config.JwtAudience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config.JwtSignKey))
                };
            });
            services.AddSingleton<IJwtGeneratorSettings, JwtGeneratorSettings>(_ => securityConfig);
            services.AddScoped<IJwtGenerator, JwtGenerator>(_ => new JwtGenerator(securityConfig));
            return services;
        }
    }
}
