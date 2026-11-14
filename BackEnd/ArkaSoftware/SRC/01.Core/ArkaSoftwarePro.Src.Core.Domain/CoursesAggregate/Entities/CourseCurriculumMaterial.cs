using Framework.Src.Core.Domain.Aggregates;

namespace ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Entities;

/// <summary>
/// Handout/code file attached to a course chapter (section) and/or lesson (section part).
/// Exactly one of CourseLessonId or section-only scope applies per row.
/// </summary>
public class CourseCurriculumMaterial : AggregateRoot
{
    public long CourseId { get; private set; }
    /// <summary>Chapter / CourseSection. Required for section-level materials; also set when lesson-scoped for easier queries.</summary>
    public long CourseSectionId { get; private set; }
    /// <summary>Null = chapter-level material; set = lesson/section-part material.</summary>
    public long? CourseLessonId { get; private set; }
    public long MediaAssetId { get; private set; }
    public string DisplayName { get; private set; } = string.Empty;
    public int SortOrder { get; private set; }

    private CourseCurriculumMaterial()
    {
    }

    public static CourseCurriculumMaterial Create(
        long courseId,
        long courseSectionId,
        long? courseLessonId,
        long mediaAssetId,
        string displayName,
        int sortOrder = 0)
    {
        if (courseId <= 0) throw new ArgumentException("Course id is required.", nameof(courseId));
        if (courseSectionId <= 0) throw new ArgumentException("Course section id is required.", nameof(courseSectionId));
        if (mediaAssetId <= 0) throw new ArgumentException("Media asset id is required.", nameof(mediaAssetId));
        if (courseLessonId is <= 0)
            throw new ArgumentException("Lesson id must be positive when provided.", nameof(courseLessonId));

        var name = (displayName ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Display name is required.", nameof(displayName));

        return new CourseCurriculumMaterial
        {
            CourseId = courseId,
            CourseSectionId = courseSectionId,
            CourseLessonId = courseLessonId,
            MediaAssetId = mediaAssetId,
            DisplayName = name.Length > 260 ? name[..260] : name,
            SortOrder = Math.Max(0, sortOrder),
        };
    }

    public void SoftDelete()
    {
        if (IsDelete) return;
        IsDelete = true;
    }

    /// <summary>Repoint material after curriculum section/lesson ids change.</summary>
    public void RemapTargets(long courseSectionId, long? courseLessonId)
    {
        if (courseSectionId <= 0)
            throw new ArgumentException("Course section id is required.", nameof(courseSectionId));
        if (courseLessonId is <= 0)
            throw new ArgumentException("Lesson id must be positive when provided.", nameof(courseLessonId));

        CourseSectionId = courseSectionId;
        CourseLessonId = courseLessonId;
    }

    public void Rename(string displayName)
    {
        var name = (displayName ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Display name is required.", nameof(displayName));
        DisplayName = name.Length > 260 ? name[..260] : name;
    }
}
