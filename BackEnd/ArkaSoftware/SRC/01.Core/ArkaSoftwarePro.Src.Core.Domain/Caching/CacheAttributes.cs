namespace ArkaSoftwarePro.Src.Core.Domain.Caching;

public enum CacheRegion
{
    Courses = 1,
    Articles = 2,
    Seminars = 3,
    Books = 4,
    Software = 5,
    TeacherAds = 6,
    Files = 7,
    Categories = 8,
    Teachers = 9,
    Projects = 10,
    General = 99,
}

[AttributeUsage(AttributeTargets.Class, Inherited = false)]
public sealed class CacheableQueryAttribute(CacheRegion region) : Attribute
{
    public CacheRegion Region { get; } = region;
}

[AttributeUsage(AttributeTargets.Class, Inherited = false)]
public sealed class InvalidatesCacheAttribute : Attribute
{
    public InvalidatesCacheAttribute(params CacheRegion[] regions)
    {
        Regions = regions.Length > 0 ? regions : [CacheRegion.General];
    }

    public CacheRegion[] Regions { get; }
}
