namespace Framework.Src.Utilities.OutService.ContextCarriers
{
    public interface ICurrentUserContext
    {
        string? UserId { get; }
        void SetUserId(string userId);
    }
}
