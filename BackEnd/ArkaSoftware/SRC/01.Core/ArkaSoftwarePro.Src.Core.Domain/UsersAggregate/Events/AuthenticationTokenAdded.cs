using Framework.Src.Core.Domain.Events;

namespace ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Events
{
    public record AuthenticationTokenAdded(long UserId, string Token, DateTime ExpirationDate, DateTime? IssuedAt, bool IsRevoked) : IDomainEvent
    {
    }
}
