using Framework.Src.Core.Domain.Aggregates;



namespace ArkaSoftwarePro.Src.Core.Domain.EmailTemplateAggregate.Entities;



public class EmailTemplate : AggregateRoot

{

    public string TemplateKey { get; private set; } = string.Empty;

    public string DisplayName { get; private set; } = string.Empty;

    public string Description { get; private set; } = string.Empty;

    public string Subject { get; private set; } = string.Empty;

    public string BodyHtml { get; private set; } = string.Empty;

    public bool IsEnabled { get; private set; } = true;



    private EmailTemplate()

    {

    }



    public EmailTemplate(
        string templateKey,
        string displayName,
        string description,
        string subject,
        string bodyHtml,
        bool isEnabled = true)
    {
        SetTemplateKey(templateKey);
        Update(displayName, description, subject, bodyHtml, isEnabled);
    }



    public void Update(

        string displayName,

        string description,

        string subject,

        string bodyHtml,

        bool isEnabled)

    {

        DisplayName = displayName?.Trim() ?? string.Empty;

        Description = description?.Trim() ?? string.Empty;

        Subject = subject?.Trim() ?? string.Empty;

        BodyHtml = bodyHtml ?? string.Empty;

        IsEnabled = isEnabled;

    }



    public void SetTemplateKey(string templateKey)

    {

        TemplateKey = templateKey?.Trim() ?? string.Empty;

    }



    public void ResetToDefault(string displayName, string description, string subject, string bodyHtml)

        => Update(displayName, description, subject, bodyHtml, isEnabled: true);

}

