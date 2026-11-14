namespace ArkaSoftwarePro.Src.Core.Contracts.Users.GoogleAuth
{
    public interface ILoginGoogleAuth
    {
        Task<object> VerifyGoogleToken(string token);
    }
}
