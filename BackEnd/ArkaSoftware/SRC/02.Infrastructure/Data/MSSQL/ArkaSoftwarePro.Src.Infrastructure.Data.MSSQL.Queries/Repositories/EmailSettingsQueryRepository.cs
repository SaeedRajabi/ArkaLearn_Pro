using ArkaSoftwarePro.Src.Core.Contracts.EmailSettings.EmailSettingsRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Queries.QueryRepositories;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Repositories;

public class EmailSettingsQueryRepository(ArkaSoftwareQueryDbContext dbContext)
    : BaseQueryRepository<ArkaSoftwareQueryDbContext>(dbContext), IEmailSettingsQueryRepository
{
    public async Task<EmailSettingsQri?> GetCurrentAsync()
    {
        var row = await dbContext.EmailSettings.AsNoTracking()
            .OrderByDescending(x => x.Id)
            .FirstOrDefaultAsync();
        if (row is null) return null;

        return new EmailSettingsQri
        {
            IsEnabled = row.IsEnabled,
            Host = row.Host,
            Port = row.Port,
            UseSsl = row.UseSsl,
            UseStartTls = row.UseStartTls,
            AllowInvalidCertificate = row.AllowInvalidCertificate,
            Username = row.Username,
            HasPassword = !string.IsNullOrWhiteSpace(row.Password),
            FromEmail = row.FromEmail,
            FromName = row.FromName,
            TimeoutSeconds = row.TimeoutSeconds,
            RequireEmailVerification = row.RequireEmailVerification,
            OtpExpiryMinutes = row.OtpExpiryMinutes,
            OtpResendCooldownSeconds = row.OtpResendCooldownSeconds,
            PasswordResetLinkExpiryMinutes = row.PasswordResetLinkExpiryMinutes,
            PasswordChangeUseSms = row.PasswordChangeUseSms
        };
    }
}
