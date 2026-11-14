using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.EmailTemplates.Commands.UpsertEmailTemplate;

public class UpsertEmailTemplateCommand : ICommand<string>, IWebRequest
{
    public string TemplateKey { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string BodyHtml { get; set; } = string.Empty;
    public bool IsEnabled { get; set; } = true;
    public string Path => "/api/Service/EmailTemplates/Upsert";
}
