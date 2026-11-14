using Framework.Src.Core.Domain.Events;

namespace ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Events
{
    public record UserFullNameUpdated(long UserId , string FirstName , string LastName) : IDomainEvent { }
}
