using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Entities
{
    public class Chat:Entity
    {
        public string? Message { get; private set; }
        public DateTime SendAt { get; private set; }


        public long RoomId { get; private set; }
        public Room? Room { get; private set; }


        public Chat()
        {

        }

        private Chat(string message , long roomId)
        {
            Message = message;
            RoomId = roomId;
            SendAt = DateTime.Now;
        }


        public static Chat Create(string message , long roomId) 
            => new Chat(message, roomId);
    }
}
