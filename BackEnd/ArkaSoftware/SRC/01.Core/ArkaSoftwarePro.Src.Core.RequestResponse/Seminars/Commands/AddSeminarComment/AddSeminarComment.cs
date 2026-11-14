using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Commands.AddSeminarComment
{
    public class AddSeminarComment : ICommand<string>, IWebRequest
    {
        public long SeminarId { get; set; }
        public string Content { get; set; } = string.Empty;
        public int Rating { get; set; }
        public int Like { get; set; }
        public long? ParentId { get; set; }
        public string Path => "/api/Service/Seminar/add-comment";
    }
}
