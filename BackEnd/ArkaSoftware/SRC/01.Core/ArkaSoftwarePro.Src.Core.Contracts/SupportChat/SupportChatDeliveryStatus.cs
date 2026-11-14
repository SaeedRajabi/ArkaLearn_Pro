namespace ArkaSoftwarePro.Src.Core.Contracts.SupportChat;

public static class SupportChatDeliveryStatus
{
    public const string Sent = "sent";
    public const string Delivered = "delivered";
    public const string Read = "read";

    public static string ResolveForSentMessage(
        DateTime messageSentAtUtc,
        DateTime? deliveredAtUtc,
        DateTime? recipientLastReadAtUtc)
    {
        if (recipientLastReadAtUtc.HasValue && recipientLastReadAtUtc.Value >= messageSentAtUtc)
            return Read;

        if (deliveredAtUtc.HasValue)
            return Delivered;

        return Sent;
    }
}
