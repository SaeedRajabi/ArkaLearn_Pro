using Framework.Src.Core.Domain.Exceptions;
using Framework.Src.Core.Domain.ValueOBJs;

namespace ArkaSoftwarePro.Src.Core.Domain.ProjectAggregate.ValueOBJs;

public class ProjectTitle : BaseValueOBJs<ProjectTitle>
{
    public string? Value { get; private set; }

    private ProjectTitle() { }

    public ProjectTitle(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new InvalidValueObjectStateException("ValidationErrorIsRequired", nameof(ProjectTitle));
        if (value.Length > 200)
            throw new InvalidValueObjectStateException("ValidationErrorStringLength", nameof(ProjectTitle));
        Value = value.Trim();
    }

    protected override IEnumerable<object> GetEqualityComponents() { yield return Value!; }
}
