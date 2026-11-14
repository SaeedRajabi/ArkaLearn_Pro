using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Enumerations;
using Framework.Src.Core.Domain.Events;

namespace ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Events
{
    public record UserAdded(string UserName, string Password, string Email , UserRole Role , bool AcceptedTerms) : IDomainEvent { }
}
