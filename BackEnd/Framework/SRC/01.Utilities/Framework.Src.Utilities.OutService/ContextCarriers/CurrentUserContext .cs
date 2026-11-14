namespace Framework.Src.Utilities.OutService.ContextCarriers
{
    public class CurrentUserContext:ICurrentUserContext
    {
        private string? _userId;

        public string? UserId => _userId;

        public void SetUserId(string userId)
        {
            _userId = userId;
        }
    }
}
