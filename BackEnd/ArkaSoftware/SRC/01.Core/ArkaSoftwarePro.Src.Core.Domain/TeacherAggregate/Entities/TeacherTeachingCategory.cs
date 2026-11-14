using Framework.Src.Core.Domain.Aggregates;

namespace ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;

public class TeacherTeachingCategory : AggregateRoot
{
    public string Name { get; private set; } = string.Empty;
    public string Slug { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public bool IsActive { get; private set; } = true;
    public int SortOrder { get; private set; }

    private TeacherTeachingCategory() { }

    public static TeacherTeachingCategory Create(string name, string slug, string? description = null, int sortOrder = 0)
    {
        return new TeacherTeachingCategory
        {
            Name = name.Trim(),
            Slug = slug.Trim().ToLowerInvariant(),
            Description = description?.Trim(),
            SortOrder = sortOrder,
            IsActive = true,
        };
    }

    public void Update(string name, string slug, string? description, int sortOrder, bool isActive)
    {
        Name = name.Trim();
        Slug = slug.Trim().ToLowerInvariant();
        Description = description?.Trim();
        SortOrder = sortOrder;
        IsActive = isActive;
    }
}
