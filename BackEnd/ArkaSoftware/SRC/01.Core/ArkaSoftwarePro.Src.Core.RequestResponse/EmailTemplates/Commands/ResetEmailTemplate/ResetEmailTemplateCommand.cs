using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.EmailTemplates.Commands.ResetEmailTemplate;

public class ResetEmailTemplateCommand : ICommand<string>, IWebRequest
{
    public string TemplateKey { get; set; } = string.Empty;
    public string Path => "/api/Service/EmailTemplates/Reset";
}
