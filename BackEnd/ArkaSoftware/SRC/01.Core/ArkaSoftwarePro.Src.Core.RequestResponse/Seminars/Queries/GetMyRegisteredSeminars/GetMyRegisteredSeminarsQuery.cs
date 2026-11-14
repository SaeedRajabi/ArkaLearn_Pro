using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.GetMyRegisteredSeminars
{
    /// <summary>
    /// سمینارهای ثبت‌نام‌شدهٔ کاربر جاری به‌همراه لینک اتاق و نام کاربری ورود به اتاق
    /// </summary>
    public class GetMyRegisteredSeminarsQuery : IQuery<List<MyRegisteredSeminarQri>>, IWebRequest
    {
        public long UserId { get; set; }
        public string Path => "/api/Service/Seminar/GetMyRegisteredSeminars";
    }
}
