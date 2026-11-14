using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Commands.RegisterUserForSeminar
{
    /// <summary>
    /// ثبت‌نام یک کاربر/دانشجو در سمینار توسط ادمین.
    /// </summary>
    public class RegisterUserForSeminarCommand : ICommand<string>, IWebRequest
    {
        public long SeminarId { get; set; }
        public long UserId { get; set; }
        public bool HasPaid { get; set; }
        public string Path => "/api/Service/Seminar/RegisterUser";
    }
}
