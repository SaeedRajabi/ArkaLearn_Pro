namespace ArkaSoftwarePro.Src.Core.Contracts.Users.SecurityTokenContracts
{
    public interface IJwtGeneratorSettings
    {
        string JwtIssuer { get; }

        string JwtAudience { get; }

        string JwtSignKey { get; }

        int JwtLifetimeMinutes { get; }

        int RefreshTokenLifetimeDays { get; }
    }

}
