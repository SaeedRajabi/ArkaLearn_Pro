using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.AddTeacher
{
    public class AddTeacherCommand : ICommand<string>, IWebRequest
    {
        public long UserId { get; set; }
        public string ShortDescription { get; set; } = string.Empty;
        public string LongDescription { get; set; } = string.Empty;

        public string Path => "api/Service/Teacher/Add";
    }
}
