namespace ArkaSoftwarePro.Src.Core.RequestResponse.Messages.Queries.GetAllMessageInRoom;

public class GetAllMessageWithRoomIdQri
{
    public string SenderId { get; set; } = string.Empty;
    public string MessageText { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string? SendAt { get; set; }
}