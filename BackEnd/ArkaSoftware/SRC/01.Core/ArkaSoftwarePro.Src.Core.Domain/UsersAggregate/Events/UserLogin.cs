using Framework.Src.Core.Domain.Events;


namespace ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Events
{
    public record UserLogin(string UserName, string Password) : IDomainEvent { }
}
