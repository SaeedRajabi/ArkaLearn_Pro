using Framework.Src.Core.Domain.ValueOBJs;

namespace ArkaSoftwarePro.Src.Core.Domain.ProjectAggregate.ValueOBJs;

public class ProjectLongDescription : BaseValueOBJs<ProjectLongDescription>
{
    public string? Value { get; private set; }

    private ProjectLongDescription() { }

    public ProjectLongDescription(string? value)
    {
        Value = value ?? string.Empty;
    }

    protected override IEnumerable<object> GetEqualityComponents() { yield return Value!; }
}
