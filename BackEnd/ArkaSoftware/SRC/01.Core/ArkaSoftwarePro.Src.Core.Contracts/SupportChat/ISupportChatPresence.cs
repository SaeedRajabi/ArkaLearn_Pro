namespace ArkaSoftwarePro.Src.Core.Contracts.SupportChat;

public interface ISupportChatPresence
{
    void Register(long userId, string connectionId);

    long? Unregister(string connectionId);

    bool IsOnline(long userId);
}
