using ArkaSoftwarePro.Src.Core.Contracts.Users.SecurityTokenContracts;

namespace ArkaSoftwarePro.Src.Infrastructure.Security.IMP.Services
{
    public class JwtGeneratorSettings : IJwtGeneratorSettings
    {
        public string JwtIssuer { get; set; } = string.Empty;

        public string JwtAudience { get; set; } = string.Empty;

        public string JwtSignKey { get; set; } = string.Empty;

        public int JwtLifetimeMinutes { get; set; }

        public int RefreshTokenLifetimeDays { get; set; }
    }
}
