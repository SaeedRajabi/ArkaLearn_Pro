using Framework.Src.Infrastructure.Data.MSSQL.Commands.Extensions;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.OutBoxEventItems;
using Extensions.Serializers.Abstractions;
using Extensions.UsersManagement.Abstractions;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Framework.Src.Utilities.OutService.ContextCarriers;

namespace Framework.Src.Infrastructure.Data.MSSQL.Commands.Common
{
    public abstract class BaseOutboxCommandDbContext : BaseCommandDbContext
    {
        public DbSet<OutBoxEventItem> OutBoxEventItems { get; set; }
        private readonly Dictionary<object, OutBoxEventItem> _pendingEvents = new(ReferenceEqualityComparer.Instance);

        #region Constractors
        public BaseOutboxCommandDbContext(DbContextOptions options) : base(options)
        {

        }

        protected BaseOutboxCommandDbContext()
        {
        }
        #endregion

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);
            builder.ApplyConfiguration(new OutBoxEventItemConfigure());
        }
        protected override void BeforeSaveTriggers()
        {
            AddOutboxEventItems();
            base.BeforeSaveTriggers();
        }
        protected override void AfterSaveTriggers()
        {
            foreach (var aggregate in ChangeTracker.GetAggregatesWithEvent()) aggregate.ClearEvents();
            _pendingEvents.Clear();
            base.AfterSaveTriggers();
        }

        private void AddOutboxEventItems()
        {
            string _currentUserIdContextValue = ResolveAccruedByUserId();
            var changedAggregates = ChangeTracker.GetAggregatesWithEvent();
            var serialize = this.GetService<IJsonSerializer>();
            foreach (var aggregate in changedAggregates)
            {
                var events = aggregate.GetEvents();
                foreach (var @event in events)
                {
                    if (_pendingEvents.TryGetValue(@event, out var existing) && Entry(existing).State != EntityState.Detached)
                        continue;
                    var outBoxEventItemCreated = new OutBoxEventItem() 
                    {
                        EventId = Guid.NewGuid(),
                        AccruedByUserId = _currentUserIdContextValue,
                        AccruedOn = DateTime.Now,
                        AggregateId = aggregate.BusinessId.ToString(),
                        AggregateName = aggregate.GetType().Name,
                        AggregateTypeName = aggregate.GetType().FullName!,
                        EventName = @event.GetType().Name,
                        EventTypeName = @event.GetType().FullName!,
                        EventPayload = serialize.Serialize(@event),
                        IsProcessed = false
                    };
                    OutBoxEventItems.Add(outBoxEventItemCreated);
                    _pendingEvents[@event] = outBoxEventItemCreated;
                }
            }
        }

        /// <summary>
        /// Resolves AccruedByUserId for outbox rows. Outside an HTTP request (e.g. SignalR hub invoking a command after the last participant leaves),
        /// <see cref="IUserInfoService"/> may not have a usable <c>HttpContext</c>; we fall back instead of throwing.
        /// </summary>
        private string ResolveAccruedByUserId()
        {
            var currentUserCtx = this.GetService<ICurrentUserContext>();
            var fromContext = currentUserCtx?.UserId;
            if (!string.IsNullOrWhiteSpace(fromContext))
                return fromContext!;

            // WebUserInfoService.UserIdOrDefault() assumes a real HTTP request. SignalR hub work (e.g. last
            // participant left → EndRoomSession) often runs with IHttpContextAccessor.HttpContext == null.
            // Do not call IUserInfoService in that case — avoids NRE even if exception handling is bypassed (debugger).
            var httpAccessor = this.GetService<IHttpContextAccessor>();
            if (httpAccessor != null && httpAccessor.HttpContext == null)
                return string.Empty;

            try
            {
                var userInfo = this.GetService<IUserInfoService>();
                if (userInfo == null)
                    return string.Empty;

                var fromClaims = userInfo.UserIdOrDefault();
                if (!string.IsNullOrWhiteSpace(fromClaims))
                    return fromClaims;
            }
            catch (Exception)
            {
                // HttpContext present but incomplete, or IUserInfoService implementation throws.
            }

            return string.Empty;
        }
    }
}

