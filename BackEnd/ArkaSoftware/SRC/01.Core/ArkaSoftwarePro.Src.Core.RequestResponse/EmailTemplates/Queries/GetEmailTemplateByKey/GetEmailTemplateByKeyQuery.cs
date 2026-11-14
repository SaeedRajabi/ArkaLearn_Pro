using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.EmailTemplates.Queries.GetEmailTemplateByKey;

public class GetEmailTemplateByKeyQuery : IQuery<EmailTemplateDetailQri>, IWebRequest
{
    public string TemplateKey { get; set; } = string.Empty;
    public string Path => "/api/Service/EmailTemplates/GetByKey";
}

public sealed class EmailTemplateDetailQri
{
    public string TemplateKey { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string BodyHtml { get; set; } = string.Empty;
    public bool IsEnabled { get; set; }
    public bool IsCustomized { get; set; }
}
