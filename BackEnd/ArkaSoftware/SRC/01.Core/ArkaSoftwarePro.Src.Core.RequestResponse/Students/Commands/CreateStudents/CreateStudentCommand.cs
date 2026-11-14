using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Students.Commands.CreateStudents
{
    public class CreateStudentCommand:ICommand<string> , IWebRequest
    {

        public long UserId { get; set; }
        public string Path => "/api/Service/Student/Create";
    }
}
