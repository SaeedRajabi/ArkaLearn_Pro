using ArkaSoftwarePro.Src.Core.Contracts.NotificationSettings.NotificationSettingsRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;
using NotificationSettingsEntity = ArkaSoftwarePro.Src.Core.Domain.NotificationSettingsAggregate.Entities.NotificationSettings;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories;

public class NotificationSettingsCommandRepository(ArkaSoftwareCommandDbContext dbContext)
    : BaseCommandRepository<NotificationSettingsEntity, ArkaSoftwareCommandDbContext>(dbContext), INotificationSettingsCommandRepository
{
    public async Task<NotificationSettingsEntity?> GetCurrentAsync()
        => await _dbContext.NotificationSettings.OrderByDescending(x => x.Id).FirstOrDefaultAsync();
}
