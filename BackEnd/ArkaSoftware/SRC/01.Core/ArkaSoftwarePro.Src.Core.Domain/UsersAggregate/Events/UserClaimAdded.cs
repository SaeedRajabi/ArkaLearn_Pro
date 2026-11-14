using Framework.Src.Core.Domain.Events;

namespace ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Events
{
    public record UserClaimAdded(long RoleId, string ClaimType, string ClaimValue) : IDomainEvent
    {
    }
}
