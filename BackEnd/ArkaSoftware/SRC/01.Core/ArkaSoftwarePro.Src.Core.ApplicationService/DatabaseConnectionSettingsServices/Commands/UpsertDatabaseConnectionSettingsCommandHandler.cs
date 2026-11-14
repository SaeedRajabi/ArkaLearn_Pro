using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.DatabaseConnection;
using ArkaSoftwarePro.Src.Core.Contracts.DatabaseConnection.DatabaseConnectionSettingsRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Security;
using ArkaSoftwarePro.Src.Core.RequestResponse.DatabaseConnectionSettings.Commands.UpsertDatabaseConnectionSettings;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;
using DatabaseConnectionSettingsEntity = ArkaSoftwarePro.Src.Core.Domain.DatabaseConnectionSettingsAggregate.Entities.DatabaseConnectionSettings;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.DatabaseConnectionSettingsServices.Commands;

public class UpsertDatabaseConnectionSettingsCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IDatabaseConnectionSettingsCommandRepository repository,
    ISecretProtector secretProtector,
    IDatabaseConnectionSettingsCache settingsCache,
    IDatabaseConnectionStringProvider connectionStringProvider,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<UpsertDatabaseConnectionSettingsCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(UpsertDatabaseConnectionSettingsCommand command)
    {
        if (!DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))
            return await ResultAsync("Admin access required.", ApplicationServiceStatus.ValidationError);

        if (command.UseDatabaseConnection)
        {
            if (string.IsNullOrWhiteSpace(command.Server) ||
                string.IsNullOrWhiteSpace(command.Database) ||
                string.IsNullOrWhiteSpace(command.UserId))
            {
                return await ResultAsync("Server, database and user are required.", ApplicationServiceStatus.ValidationError);
            }
        }

        var current = await repository.GetCurrentAsync();
        var passwordEncrypted = current?.PasswordEncrypted;
        if (command.Password is not null)
        {
            passwordEncrypted = string.IsNullOrWhiteSpace(command.Password)
                ? null
                : secretProtector.Protect(command.Password.Trim());
        }

        if (command.UseDatabaseConnection)
        {
            var testSettings = new DatabaseConnectionSettingsSnapshot
            {
                UseDatabaseConnection = true,
                Server = command.Server,
                Port = command.Port,
                Database = command.Database,
                UserId = command.UserId,
                Password = command.Password ?? secretProtector.Unprotect(passwordEncrypted),
                TrustServerCertificate = command.TrustServerCertificate,
                MultipleActiveResultSets = command.MultipleActiveResultSets,
            };

            if (!await connectionStringProvider.TestConnectionAsync(testSettings))
                return await ResultAsync("Database connection failed.", ApplicationServiceStatus.ValidationError);
        }

        if (current is null)
        {
            current = new DatabaseConnectionSettingsEntity(
                command.UseDatabaseConnection,
                command.Server,
                command.Port,
                command.Database,
                command.UserId,
                passwordEncrypted,
                command.TrustServerCertificate,
                command.MultipleActiveResultSets);
            await repository.InsertAsync(current);
        }
        else
        {
            current.Update(
                command.UseDatabaseConnection,
                command.Server,
                command.Port,
                command.Database,
                command.UserId,
                passwordEncrypted,
                command.TrustServerCertificate,
                command.MultipleActiveResultSets);
        }

        await repository.CommitAsync();
        await settingsCache.RefreshAsync();
        return await OkAsync("Database connection settings saved.");
    }
}
