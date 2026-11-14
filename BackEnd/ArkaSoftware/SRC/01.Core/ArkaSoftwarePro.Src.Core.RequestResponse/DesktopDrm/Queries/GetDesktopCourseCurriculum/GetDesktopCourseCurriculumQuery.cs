using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetDesktopCourseCurriculum;

public class GetDesktopCourseCurriculumQuery : IQuery<DesktopCourseCurriculumQri?>
{
    public long UserId { get; set; }
    public long CourseId { get; set; }
    public string? LicenseKey { get; set; }
}

public class DesktopCourseCurriculumQri
{
    public long CourseId { get; set; }
    public string CourseTitle { get; set; } = string.Empty;
    public List<DesktopCourseSectionQri> Sections { get; set; } = [];
}

public class DesktopCourseSectionQri
{
    public long SectionId { get; set; }
    public string Title { get; set; } = string.Empty;
    public bool HasMaterials { get; set; }
    public List<DesktopCourseCurriculumMaterialQri> Materials { get; set; } = [];
    public List<DesktopCourseLessonQri> Lessons { get; set; } = [];
}

public class DesktopCourseLessonQri
{
    public long LessonId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? VideoTitle { get; set; }
    public int DurationSeconds { get; set; }
    public bool IsPublished { get; set; }
    public long? MediaAssetId { get; set; }
    public bool HasEncryptedVideo { get; set; }
    public bool IsLocked { get; set; }
    public bool HasMaterials { get; set; }
    public List<DesktopCourseCurriculumMaterialQri> Materials { get; set; } = [];
}

public class DesktopCourseCurriculumMaterialQri
{
    public long MaterialId { get; set; }
    public long MediaAssetId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string? OriginalFileName { get; set; }
    public long? FileSizeBytes { get; set; }
    public bool IsEncrypted { get; set; }
}
