using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.SaveTeacherResume;

public class SaveTeacherResumeCommand : ICommand<string>, IWebRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string PdfFileUrl { get; set; } = string.Empty;
    public string? PdfFileName { get; set; }
    public string Path => "/api/Service/Teacher/SaveResume";
}
