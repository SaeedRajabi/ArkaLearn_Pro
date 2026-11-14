using Framework.Src.Core.Domain.Events;

namespace ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Events;

public record EmailVerified(long UserId, string Email) : IDomainEvent;
