using Framework.Src.Core.Domain.Events;


namespace ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Events
{
    public record UserProfileUpdated(long UserId, string UserName, string Email, string ProfilePicture, DateTime OccurredOn) : IDomainEvent { }
}
