using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;

internal static class TeacherContentPublicAccess
{
    public static bool IsTeacherActiveForPublic(Teacher? teacher) =>
        teacher?.AccountStatus == TeacherAccountStatus.Active;

    public static bool IsAdvertisementPubliclyVisible(TeacherAdvertisement advertisement, Teacher? teacher)
    {
        if (!IsTeacherActiveForPublic(teacher) || advertisement.IsDelete)
            return false;

        return advertisement.IsPublic && advertisement.ApprovalStatus == TeacherApprovalStatus.Approved;
    }

    public static bool IsPromotionalVideoPubliclyVisible(TeacherPromotionalVideo video, Teacher? teacher)
    {
        if (!IsTeacherActiveForPublic(teacher))
            return false;

        return video.ApprovalStatus == TeacherApprovalStatus.Approved;
    }

    public static bool IsBookPubliclyVisible(TeacherBook book, Teacher? teacher)
    {
        if (!IsTeacherActiveForPublic(teacher) || book.IsDelete)
            return false;

        return book.ApprovalStatus == TeacherApprovalStatus.Approved;
    }

    public static bool IsPortfolioArticlePubliclyVisible(TeacherPortfolioArticle article, Teacher? teacher)
    {
        if (!IsTeacherActiveForPublic(teacher))
            return false;

        return article.ApprovalStatus == TeacherApprovalStatus.Approved;
    }
}
