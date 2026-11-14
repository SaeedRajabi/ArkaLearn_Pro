using ArkaSoftwarePro.Src.Core.Domain.Common;
using ArkaSoftwarePro.Src.Core.Domain.ArticleAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Core.Domain.ProjectAggregate.Events;
using ArkaSoftwarePro.Src.Core.Domain.ProjectAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Core.Domain.TagAggregate.Entities;
using Framework.Src.Core.Domain.Aggregates;

namespace ArkaSoftwarePro.Src.Core.Domain.ProjectAggregate.Entities;

public class Project : AggregateRoot
{
    public ProjectTitle? Title { get; private set; }
    public Slug? Slug { get; private set; }
    public ProjectShortDescription? ShortDescription { get; private set; }
    public ProjectLongDescription? LongDescription { get; private set; }
    public string? ThumbnailUrl { get; private set; }
    public string? IntroVideoUrl { get; private set; }
    public string? GitHubUrl { get; private set; }
    public string? ProjectUrl { get; private set; }
    public string? TechnologiesJson { get; private set; }
    public string? GalleryJson { get; private set; }
    public bool IsPublished { get; private set; }
    public DateTime? PublishedAt { get; private set; }
    public long AuthorUserId { get; private set; }
    public string? SeoTitle { get; private set; }
    public string? MetaDescription { get; private set; }
    public string? OgImageUrl { get; private set; }

    public IReadOnlyList<Tag> Tags => _tags;
    private readonly List<Tag> _tags = new();

    private Project() { }

    public Project(
        ProjectTitle title,
        Slug slug,
        ProjectShortDescription shortDescription,
        ProjectLongDescription longDescription,
        string? thumbnailUrl,
        string? introVideoUrl,
        string? gitHubUrl,
        string? projectUrl,
        string? technologiesJson,
        string? galleryJson,
        long authorUserId,
        bool isPublished = false)
    {
        Title = title;
        Slug = slug;
        ShortDescription = shortDescription;
        LongDescription = longDescription;
        ThumbnailUrl = thumbnailUrl;
        IntroVideoUrl = introVideoUrl;
        GitHubUrl = gitHubUrl;
        ProjectUrl = projectUrl;
        TechnologiesJson = technologiesJson;
        GalleryJson = galleryJson;
        AuthorUserId = authorUserId;
        IsPublished = isPublished;
        if (isPublished)
            PublishedAt = DateTime.UtcNow;
        AddEvent(new ProjectAdded(authorUserId, title.Value!, slug.Value!, isPublished));
    }

    public void AddTag(Tag tag) => _tags.Add(tag);

    public void Publish()
    {
        IsPublished = true;
        PublishedAt = DateTime.UtcNow;
    }

    public void Unpublish() => IsPublished = false;

    public void UpdateContent(
        ProjectTitle? title,
        ProjectShortDescription? shortDescription,
        ProjectLongDescription? longDescription,
        string? thumbnailUrl,
        string? introVideoUrl,
        string? gitHubUrl,
        string? projectUrl,
        string? technologiesJson,
        string? galleryJson)
    {
        if (title != null) Title = title;
        if (shortDescription != null) ShortDescription = shortDescription;
        if (longDescription != null) LongDescription = longDescription;
        if (thumbnailUrl != null) ThumbnailUrl = thumbnailUrl;
        if (introVideoUrl != null) IntroVideoUrl = introVideoUrl;
        if (gitHubUrl != null) GitHubUrl = gitHubUrl;
        if (projectUrl != null) ProjectUrl = projectUrl;
        if (technologiesJson != null) TechnologiesJson = technologiesJson;
        if (galleryJson != null) GalleryJson = galleryJson;
    }

    public void UpdateSlug(Slug slug) => Slug = slug;

    public void UpdateSeo(string? seoTitle, string? metaDescription, string? ogImageUrl)
    {
        SeoTitle = SeoMetadata.NormalizeTitle(seoTitle);
        MetaDescription = SeoMetadata.NormalizeDescription(metaDescription);
        OgImageUrl = SeoMetadata.NormalizeOgImageUrl(ogImageUrl);
    }
}
