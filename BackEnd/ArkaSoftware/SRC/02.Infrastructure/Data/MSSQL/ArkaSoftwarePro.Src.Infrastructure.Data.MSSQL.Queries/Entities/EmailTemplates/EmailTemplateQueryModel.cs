namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.EmailTemplates;

public class EmailTemplateQueryModel
{
    public long Id { get; set; }
    public string TemplateKey { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string BodyHtml { get; set; } = string.Empty;
    public bool IsEnabled { get; set; }
}
