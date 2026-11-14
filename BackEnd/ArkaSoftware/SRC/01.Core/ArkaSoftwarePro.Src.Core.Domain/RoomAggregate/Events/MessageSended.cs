using Framework.Src.Core.Domain.Events;

namespace ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Events
{
    public record MessageSended(string Message , long RoomId) : IDomainEvent{ }
}
