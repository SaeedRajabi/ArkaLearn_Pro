using ArkaSoftware.Extensions.UsersManagement.Abstractions;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.Extensions;
using Framework.Src.Utilities.OutService.ContextCarriers;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.EntityFrameworkCore.Infrastructure;

namespace Framework.Src.Infrastructure.Data.MSSQL.Commands.Interceptors
{
    public class AddAuditDataInterceptor : SaveChangesInterceptor
    {

        public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result)
        {
            AddShadowProperties(eventData);
            return base.SavingChanges(eventData, result);
        }


        public override ValueTask<InterceptionResult<int>> SavingChangesAsync(DbContextEventData eventData, InterceptionResult<int> result, CancellationToken cancellationToken = default)
        {
            AddShadowProperties(eventData);
            return base.SavingChangesAsync(eventData, result, cancellationToken);
        }


        private static void AddShadowProperties(DbContextEventData eventData)
        {
            var changeTracker = eventData.Context!.ChangeTracker;
            var userInfoService = eventData.Context.GetService<IUserInfoService>();
            var currentUserIdContextValue = eventData.Context.GetService<ICurrentUserContext>();
            changeTracker.SetAuditableEntityPropertyValues(userInfoService, currentUserIdContextValue);
        }
    }
}
