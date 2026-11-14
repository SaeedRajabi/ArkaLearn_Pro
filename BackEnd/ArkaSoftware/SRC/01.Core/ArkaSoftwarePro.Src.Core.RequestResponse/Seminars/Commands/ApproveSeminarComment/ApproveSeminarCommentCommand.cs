using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Commands.ApproveSeminarComment
{
    public class ApproveSeminarCommentCommand : ICommand<string>, IWebRequest
    {
        public long SeminarId { get; set; }
        public long CommentId { get; set; }
        public bool IsApproved { get; set; }
        public string Path => "/api/Service/Seminar/approve-comment";
    }
}
