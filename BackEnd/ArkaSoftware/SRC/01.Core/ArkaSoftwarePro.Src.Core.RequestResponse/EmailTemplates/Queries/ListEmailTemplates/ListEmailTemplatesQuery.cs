using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.EmailTemplates.Queries.ListEmailTemplates;

public class ListEmailTemplatesQuery : IQuery<List<EmailTemplateListItemQri>>, IWebRequest
{
    public string Path => "/api/Service/EmailTemplates/List";
}

public sealed class EmailTemplateListItemQri
{
    public string TemplateKey { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public bool IsEnabled { get; set; }
    public bool IsCustomized { get; set; }
}
