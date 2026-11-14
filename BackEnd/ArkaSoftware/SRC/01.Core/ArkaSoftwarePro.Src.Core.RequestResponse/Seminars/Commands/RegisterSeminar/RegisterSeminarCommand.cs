using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Commands.RegisterSeminar
{
    public class RegisterSeminarCommand : ICommand<string>, IWebRequest
    {
        public long SeminarId { get; set; }
        public bool HasPaid { get; set; }
        public string Path => "/api/Service/Seminar/Register";
    }
}
