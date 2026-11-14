using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Commands.UpdateSeminarStatus
{
    public class UpdateSeminarStatus : ICommand<string>, IWebRequest
    {
        public long Id { get; set; }
        public byte Status { get; set; }
        public bool? IsPublic { get; set; }
        public string Path => "/api/Service/Seminar/UpdateStatus";
    }
}
