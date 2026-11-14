using Framework.Src.Core.Domain.ValueOBJs;

namespace ArkaSoftwarePro.Src.Core.Domain.ProjectAggregate.ValueOBJs;

public class ProjectShortDescription : BaseValueOBJs<ProjectShortDescription>
{
    public string? Value { get; private set; }

    private ProjectShortDescription() { }

    public ProjectShortDescription(string? value)
    {
        Value = string.IsNullOrWhiteSpace(value) ? string.Empty : value.Trim();
        if (Value.Length > 500)
            Value = Value[..500];
    }

    protected override IEnumerable<object> GetEqualityComponents() { yield return Value!; }
}
