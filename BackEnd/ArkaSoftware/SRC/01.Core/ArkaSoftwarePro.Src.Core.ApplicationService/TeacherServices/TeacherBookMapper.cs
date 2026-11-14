using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetTeacherBooks;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.SearchTeacherBooks;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;

internal static class TeacherBookMapper
{
    public static string MapStatus(TeacherApprovalStatus status) => status switch
    {
        TeacherApprovalStatus.Pending => "pending",
        TeacherApprovalStatus.Approved => "approved",
        TeacherApprovalStatus.Rejected => "rejected",
        _ => "draft",
    };

    public static TeacherBookPublicQri ToPublicQri(
        TeacherBook book,
        Teacher teacher,
        bool includeLongDescription = true)
    {
        var user = teacher.User;
        var displayName = user != null
            ? $"{user.UserFullName?.FirstName} {user.UserFullName?.LastName}".Trim()
            : string.Empty;

        return new TeacherBookPublicQri
        {
            Id = book.Id,
            TeacherId = teacher.Id,
            Title = book.Title,
            ShortDescription = book.Description,
            LongDescriptionHtml = includeLongDescription ? book.LongDescriptionHtml : string.Empty,
            CoverImageUrl = book.CoverImageUrl,
            BookFileUrl = book.BookFileUrl,
            BookFileName = book.BookFileName,
            PdfFileUrl = book.PdfFileUrl,
            PdfFileName = book.PdfFileName,
            EpubFileUrl = book.EpubFileUrl,
            EpubFileName = book.EpubFileName,
            WordFileUrl = book.WordFileUrl,
            WordFileName = book.WordFileName,
            Publisher = book.Publisher,
            PublicationYear = book.PublicationYear,
            Isbn = book.Isbn,
            CategoryId = book.CategoryId,
            CategoryName = book.Category?.Title?.Value,
            Slug = book.Slug,
            Tags = book.GetTags().ToList(),
            ApprovalStatus = MapStatus(book.ApprovalStatus),
            SortOrder = book.SortOrder,
            TeacherUserId = teacher.UserId,
            TeacherDisplayName = string.IsNullOrWhiteSpace(displayName) ? user?.UserName?.Value : displayName,
            TeacherUserName = user?.UserName?.Value,
            TeacherAvatarUrl = user?.ProfileImage?.ImageURL,
            SeoTitle = book.SeoTitle,
            MetaDescription = book.MetaDescription,
            OgImageUrl = book.OgImageUrl,
        };
    }

    public static TeacherBookListItemQri ToListItem(TeacherBookPublicQri source) => new()
    {
        Id = source.Id,
        TeacherId = source.TeacherId,
        Title = source.Title,
        ShortDescription = source.ShortDescription,
        CoverImageUrl = source.CoverImageUrl,
        HasBookFile = !string.IsNullOrWhiteSpace(source.PdfFileUrl)
            || !string.IsNullOrWhiteSpace(source.EpubFileUrl)
            || !string.IsNullOrWhiteSpace(source.WordFileUrl)
            || !string.IsNullOrWhiteSpace(source.BookFileUrl),
        Publisher = source.Publisher,
        PublicationYear = source.PublicationYear,
        Isbn = source.Isbn,
        Slug = source.Slug,
        Tags = source.Tags,
        CategoryId = source.CategoryId,
        CategoryName = source.CategoryName,
        CategoryPath = source.CategoryPath,
        TeacherDisplayName = source.TeacherDisplayName,
        TeacherUserName = source.TeacherUserName,
        TeacherAvatarUrl = source.TeacherAvatarUrl,
    };
}
