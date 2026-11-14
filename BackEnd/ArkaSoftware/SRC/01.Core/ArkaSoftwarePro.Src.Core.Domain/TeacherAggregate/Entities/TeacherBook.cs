using ArkaSoftwarePro.Src.Core.Domain.CategoryAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.Common;

using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;

using Framework.Src.Core.Domain.Entities;



namespace ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;



public class TeacherBook : Entity

{

    public long TeacherId { get; private set; }

    public Teacher? Teacher { get; private set; }

    public string Title { get; private set; } = string.Empty;

    /// <summary>Short description for cards and SEO meta.</summary>

    public string Description { get; private set; } = string.Empty;

    public string LongDescriptionHtml { get; private set; } = string.Empty;

    public string? CoverImageUrl { get; private set; }

    /// <summary>Relative URL to downloadable book file (legacy primary file).</summary>

    public string? BookFileUrl { get; private set; }

    /// <summary>Original uploaded file name for download (legacy primary file).</summary>

    public string? BookFileName { get; private set; }

    public string? PdfFileUrl { get; private set; }

    public string? PdfFileName { get; private set; }

    public string? EpubFileUrl { get; private set; }

    public string? EpubFileName { get; private set; }

    public string? WordFileUrl { get; private set; }

    public string? WordFileName { get; private set; }

    public string? Publisher { get; private set; }

    public int? PublicationYear { get; private set; }

    public string? Isbn { get; private set; }
    public long? CategoryId { get; private set; }
    public Category? Category { get; private set; }
    public string Slug { get; private set; } = string.Empty;

    /// <summary>JSON array of tag strings.</summary>

    public string TagsJson { get; private set; } = "[]";

    public TeacherApprovalStatus ApprovalStatus { get; private set; } = TeacherApprovalStatus.Draft;

    public string? RejectionNote { get; private set; }

    public DateTime? SubmittedAtUtc { get; private set; }

    public int SortOrder { get; private set; }

    public string? ApprovedSnapshotJson { get; private set; }

    public string? SeoTitle { get; private set; }

    public string? MetaDescription { get; private set; }

    public string? OgImageUrl { get; private set; }



    private TeacherBook() { }



    public static TeacherBook Create(

        string title,

        string shortDescription,

        string longDescriptionHtml,

        string? coverImageUrl,

        TeacherBookFormatFiles? formatFiles,

        string? publisher,

        int? publicationYear,

        string? isbn,

        IReadOnlyList<string> tags,
        int sortOrder = 0,
        long? categoryId = null)

    {

        var book = new TeacherBook

        {

            Title = title.Trim(),

            Description = shortDescription.Trim(),

            LongDescriptionHtml = longDescriptionHtml?.Trim() ?? string.Empty,

            CoverImageUrl = coverImageUrl?.Trim(),

            Publisher = string.IsNullOrWhiteSpace(publisher) ? null : publisher.Trim(),

            PublicationYear = publicationYear is > 0 ? publicationYear : null,

            Isbn = string.IsNullOrWhiteSpace(isbn) ? null : isbn.Trim(),

            SortOrder = sortOrder,

            TagsJson = SerializeTags(tags),

            ApprovalStatus = TeacherApprovalStatus.Draft,
            CategoryId = categoryId is > 0 ? categoryId : null,
        };

        book.ApplyFormatFiles(formatFiles);

        book.Slug = SlugHelper.Generate(book.Title);

        return book;

    }



    public void Update(

        string title,

        string shortDescription,

        string longDescriptionHtml,

        string? coverImageUrl,

        TeacherBookFormatFiles? formatFiles,

        string? publisher,

        int? publicationYear,

        string? isbn,

        IReadOnlyList<string> tags,

        int sortOrder,
        long? categoryId = null)

    {

        Title = title.Trim();

        Description = shortDescription.Trim();

        LongDescriptionHtml = longDescriptionHtml?.Trim() ?? string.Empty;

        CoverImageUrl = coverImageUrl?.Trim();

        if (formatFiles != null)

            ApplyFormatFiles(formatFiles);

        Publisher = string.IsNullOrWhiteSpace(publisher) ? null : publisher.Trim();

        PublicationYear = publicationYear is > 0 ? publicationYear : null;

        Isbn = string.IsNullOrWhiteSpace(isbn) ? null : isbn.Trim();

        SortOrder = sortOrder;

        TagsJson = SerializeTags(tags);
        CategoryId = categoryId is > 0 ? categoryId : null;

        if (string.IsNullOrWhiteSpace(Slug))

            Slug = SlugHelper.Generate(Title, Id > 0 ? Id : null);

    }



    public bool HasAnyBookFile() =>

        !string.IsNullOrWhiteSpace(PdfFileUrl)

        || !string.IsNullOrWhiteSpace(EpubFileUrl)

        || !string.IsNullOrWhiteSpace(WordFileUrl)

        || !string.IsNullOrWhiteSpace(BookFileUrl);



    private void ApplyFormatFiles(TeacherBookFormatFiles? formatFiles)

    {

        if (formatFiles == null)

            return;



        PdfFileUrl = NormalizeOptional(formatFiles.PdfFileUrl);

        PdfFileName = NormalizeOptional(formatFiles.PdfFileName);

        EpubFileUrl = NormalizeOptional(formatFiles.EpubFileUrl);

        EpubFileName = NormalizeOptional(formatFiles.EpubFileName);

        WordFileUrl = NormalizeOptional(formatFiles.WordFileUrl);

        WordFileName = NormalizeOptional(formatFiles.WordFileName);

        SyncLegacyBookFile();

    }



    private void SyncLegacyBookFile()

    {

        if (!string.IsNullOrWhiteSpace(PdfFileUrl))

        {

            BookFileUrl = PdfFileUrl;

            BookFileName = PdfFileName;

            return;

        }



        if (!string.IsNullOrWhiteSpace(EpubFileUrl))

        {

            BookFileUrl = EpubFileUrl;

            BookFileName = EpubFileName;

            return;

        }



        if (!string.IsNullOrWhiteSpace(WordFileUrl))

        {

            BookFileUrl = WordFileUrl;

            BookFileName = WordFileName;

            return;

        }



        BookFileUrl = null;

        BookFileName = null;

    }



    private static string? NormalizeOptional(string? value) =>

        string.IsNullOrWhiteSpace(value) ? null : value.Trim();



    public void EnsureSlug(long bookId)

    {

        if (string.IsNullOrWhiteSpace(Slug) || !Slug.EndsWith($"-{bookId}", StringComparison.Ordinal))

            Slug = SlugHelper.Generate(Title, bookId);

    }



    public void SetApprovalStatus(TeacherApprovalStatus status, string? rejectionNote = null)
    {
        ApprovalStatus = status;
        RejectionNote = status == TeacherApprovalStatus.Rejected ? rejectionNote?.Trim() : null;
        if (status == TeacherApprovalStatus.Pending)
            SubmittedAtUtc = DateTime.UtcNow;
    }



    public void SetApprovedSnapshot(string snapshotJson) => ApprovedSnapshotJson = snapshotJson;



    public void UpdateSeo(string? seoTitle, string? metaDescription, string? ogImageUrl)

    {

        SeoTitle = SeoMetadata.NormalizeTitle(seoTitle);

        MetaDescription = SeoMetadata.NormalizeDescription(metaDescription);

        OgImageUrl = SeoMetadata.NormalizeOgImageUrl(ogImageUrl);

    }



    public IReadOnlyList<string> GetTags() => ParseTags(TagsJson);



    public static string SerializeTags(IReadOnlyList<string>? tags)

    {

        if (tags == null || tags.Count == 0) return "[]";

        var cleaned = tags

            .Select(t => t?.Trim())

            .Where(t => !string.IsNullOrWhiteSpace(t))

            .Distinct(StringComparer.OrdinalIgnoreCase)

            .Take(20)

            .ToList();

        return System.Text.Json.JsonSerializer.Serialize(cleaned);

    }



    public static IReadOnlyList<string> ParseTags(string? json)

    {

        if (string.IsNullOrWhiteSpace(json)) return Array.Empty<string>();

        try

        {

            var list = System.Text.Json.JsonSerializer.Deserialize<List<string>>(json);

            return list?.Where(t => !string.IsNullOrWhiteSpace(t)).Select(t => t.Trim()).ToList()

                   ?? (IReadOnlyList<string>)Array.Empty<string>();

        }

        catch

        {

            return Array.Empty<string>();

        }

    }

}


