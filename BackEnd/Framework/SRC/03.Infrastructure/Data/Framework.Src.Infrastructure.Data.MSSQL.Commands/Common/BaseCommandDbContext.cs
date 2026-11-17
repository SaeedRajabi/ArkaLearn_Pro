using ArkaSoftware.Extensions.UsersManagement.Abstractions;
using Framework.Src.Core.Domain.ValueOBJs;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.Extensions;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.ValueConversions;
using Framework.Src.Utilities.OutService.ContextCarriers;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Storage;
using System.Globalization;

namespace Framework.Src.Infrastructure.Data.MSSQL.Commands.Common
{
    public abstract class BaseCommandDbContext : DbContext
    {
        #region Properties Injection And CTORs
        protected IDbContextTransaction _transaction;
        public BaseCommandDbContext(DbContextOptions options) : base(options) { }
        protected BaseCommandDbContext() { }
        #endregion

        #region Transaction Management Methods
        public void BeginTransaction()
        {
            _transaction = Database.BeginTransaction();
        }
        public void RollbackTransaction()
        {
            if (_transaction == null)
            {
                throw new NullReferenceException("Please call `BeginTransaction()` method first.");
            }
            _transaction.Rollback();
        }
        public void CommitTransaction()
        {
            if (_transaction == null)
            {
                throw new NullReferenceException("Please call `BeginTransaction()` method first.");
            }
            _transaction.Commit();
        }
        #endregion

        #region Hellper Methods For Working With Shadow Properties
        public T GetShadowPropertyValue<T>(object entity, string propertyName) where T : IConvertible
        {
            var value = Entry(entity).Property(propertyName).CurrentValue;
            return value != null!
                ? (T)Convert.ChangeType(value, typeof(T), CultureInfo.InvariantCulture)!
                : default!;
        }
        public object GetShadowPropertyValue(object entity, string propertyName)
        {
            return Entry(entity).Property(propertyName).CurrentValue!;
        }
        #endregion
        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.AddAuditableShadowProperties();
        }
        protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
        {
            base.ConfigureConventions(configurationBuilder);
            configurationBuilder.Properties<BusinessID>().HaveConversion<BusinessIdConversion>();
            configurationBuilder.Properties<PId>().HaveConversion<PIdConversion>();
            configurationBuilder.Properties<Description>().HaveConversion<DescriptionConvention>();
            configurationBuilder.Properties<Image>().HaveConversion<ImageConversion>();

        }
        public IEnumerable<string> GetIncludePaths(Type clrEntityType)
        {
            var entityType = Model.FindEntityType(clrEntityType);
            var includedNavigations = new HashSet<INavigation>();
            var stack = new Stack<IEnumerator<INavigation>>();
            while (true)
            {
                var entityNavigations = new List<INavigation>();
                foreach (var navigation in entityType!.GetNavigations())
                {
                    if (includedNavigations.Add(navigation))
                        entityNavigations.Add(navigation);
                }
                if (entityNavigations.Count == 0)
                {
                    if (stack.Count > 0)
                        yield return string.Join(".", stack.Reverse().Select(e => e.Current.Name));
                }
                else
                {
                    foreach (var navigation in entityNavigations)
                    {
                        var inverseNavigation = navigation.Inverse;
                        if (inverseNavigation != null)
                            includedNavigations.Add(inverseNavigation);
                    }
                    stack.Push(entityNavigations.GetEnumerator());
                }
                while (stack.Count > 0 && !stack.Peek().MoveNext())
                    stack.Pop();
                if (stack.Count == 0) break;
                entityType = stack.Peek().Current.TargetEntityType;
            }
        }

        protected virtual void BeforeSaveTriggers()
        {
            SetShadowProperties();
        }

        protected virtual void AfterSaveTriggers() { }

        public override int SaveChanges() => SaveChanges(true);

        public override int SaveChanges(bool acceptAllChangesOnSuccess)
        {
            ChangeTracker.DetectChanges();
            BeforeSaveTriggers();
            var previous = ChangeTracker.AutoDetectChangesEnabled;
            ChangeTracker.AutoDetectChangesEnabled = false;
            try
            {
                var result = base.SaveChanges(acceptAllChangesOnSuccess);
                AfterSaveTriggers();
                return result;
            }
            finally { ChangeTracker.AutoDetectChangesEnabled = previous; }
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) =>
            SaveChangesAsync(true, cancellationToken);

        public override async Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
        {
            ChangeTracker.DetectChanges();
            BeforeSaveTriggers();
            var previous = ChangeTracker.AutoDetectChangesEnabled;
            ChangeTracker.AutoDetectChangesEnabled = false;
            try
            {
                var result = await base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
                AfterSaveTriggers();
                return result;
            }
            finally { ChangeTracker.AutoDetectChangesEnabled = previous; }
        }

        #region Private Method For Set Shadow Properties With Current User Information
        private void SetShadowProperties()
        {
            var userInfoService = this.GetService<IUserInfoService>();
            var currentUserIdContextValue = this.GetService<ICurrentUserContext>();
            ChangeTracker.SetAuditableEntityPropertyValues(userInfoService, currentUserIdContextValue);
        }
        #endregion
    }
}
