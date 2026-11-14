using ArkaSoftwarePro.Src.Core.ApplicationService.MediaServices;
using ArkaSoftwarePro.Src.Core.Contracts.Articles.ArticleRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Email;
using ArkaSoftwarePro.Src.Core.Contracts.Services;
using ArkaSoftwarePro.Src.Core.Contracts.Software.SoftwareRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.ReviewTeacherContent;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Commands;

public class ReviewTeacherContentCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ITeacherCommandRepository teacherCommandRepository,
    IArticleCommandRepository articleCommandRepository,
    ISoftwareCommandRepository softwareCommandRepository,
    TeacherAdvertisementNotifier advertisementNotifier,
    TeacherContentNotifier contentNotifier,
    TeacherFollowNotifier teacherFollowNotifier,
    INewsletterPublishNotifier newsletterPublishNotifier,
    IVideoWatermarkQueue videoWatermarkQueue)
    : CommandHandler<ReviewTeacherContentCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(ReviewTeacherContentCommand command)
    {
        if (!TryParseContentType(command.ContentType, out var contentType))
            return await ResultAsync("Invalid content type.", ApplicationServiceStatus.ValidationError);

        if (!command.Approve && string.IsNullOrWhiteSpace(command.RejectionNote))
            return await ResultAsync("Rejection note is required.", ApplicationServiceStatus.ValidationError);

        var approvalStatus = command.Approve ? TeacherApprovalStatus.Approved : TeacherApprovalStatus.Rejected;

        switch (contentType)
        {
            case TeacherContentType.Advertisement:
            {
                var teacher = await teacherCommandRepository.GetByIdWithDetailsAsync(command.ContentId);
                if (teacher?.Advertisement == null)
                    return await ResultAsync("Advertisement not found.", ApplicationServiceStatus.NotFound);

                var adTitle = teacher.Advertisement.Title;
                var teacherUserId = teacher.UserId;
                teacher.Advertisement.SetApprovalStatus(approvalStatus, command.RejectionNote);
                if (command.Approve)
                {
                    teacher.Advertisement.SetApprovedSnapshot(
                        TeacherReviewSnapshotService.BuildAdvertisementSnapshot(teacher.Advertisement));
                }
                await teacherCommandRepository.CommitAsync();

                if (teacherUserId is > 0)
                {
                    await advertisementNotifier.NotifyTeacherAdvertisementReviewedAsync(
                        teacherUserId.Value,
                        command.Approve,
                        command.RejectionNote,
                        adTitle);
                }

                break;
            }
            case TeacherContentType.PromotionalVideo:
            {
                var teacher = await teacherCommandRepository.GetByPromotionalVideoIdAsync(command.ContentId);
                var video = teacher?.PromotionalVideos.FirstOrDefault(v => v.Id == command.ContentId);
                if (video == null)
                    return await ResultAsync("Video not found.", ApplicationServiceStatus.NotFound);

                video.SetApprovalStatus(approvalStatus, command.RejectionNote);
                if (command.Approve)
                {
                    video.SetApprovedSnapshot(TeacherReviewSnapshotService.BuildVideoSnapshot(video));
                }
                await teacherCommandRepository.CommitAsync();
                if (teacher.UserId is > 0)
                {
                    await contentNotifier.NotifyTeacherContentReviewedAsync(
                        teacher.UserId.Value,
                        command.Approve,
                        command.RejectionNote,
                        "video",
                        video.Title,
                        TeacherContentNotifier.ResolveProfessorLink("video"));
                }
                if (command.Approve && teacher != null)
                {
                    videoWatermarkQueue.EnqueuePromotionalVideoWatermark(video.Id, video.VideoUrl);
                    await teacherFollowNotifier.NotifyFollowersContentPublishedAsync(
                        teacher.Id,
                        teacher.UserId,
                        "teacher_new_video",
                        BuildTeacherDisplayName(teacher),
                        video.Title,
                        BuildTeacherProfileLink(teacher),
                        video.Id);
                }
                break;
            }
            case TeacherContentType.Book:
            {
                var teacher = await teacherCommandRepository.GetByBookIdAsync(command.ContentId);
                var book = teacher?.Books.FirstOrDefault(b => b.Id == command.ContentId);
                if (book == null)
                    return await ResultAsync("Book not found.", ApplicationServiceStatus.NotFound);

                book.SetApprovalStatus(approvalStatus, command.RejectionNote);
                if (command.Approve)
                {
                    book.SetApprovedSnapshot(TeacherReviewSnapshotService.BuildBookSnapshot(book));
                }
                await teacherCommandRepository.CommitAsync();
                if (teacher.UserId is > 0)
                {
                    await contentNotifier.NotifyTeacherContentReviewedAsync(
                        teacher.UserId.Value,
                        command.Approve,
                        command.RejectionNote,
                        "book",
                        book.Title,
                        TeacherContentNotifier.ResolveProfessorLink("book"));
                }
                if (command.Approve && teacher != null)
                {
                    await teacherFollowNotifier.NotifyFollowersContentPublishedAsync(
                        teacher.Id,
                        teacher.UserId,
                        "teacher_new_book",
                        BuildTeacherDisplayName(teacher),
                        book.Title,
                        $"/books/{Uri.EscapeDataString(book.Slug)}",
                        book.Id);
                    await newsletterPublishNotifier.NotifyContentPublishedAsync(
                        NewsletterContentKind.Book,
                        book.Title,
                        $"/books/{Uri.EscapeDataString(book.Slug)}",
                        teacher.Id,
                        teacher.UserId,
                        BuildTeacherDisplayName(teacher));
                }
                break;
            }
            case TeacherContentType.Software:
            {
                var software = await softwareCommandRepository.GetWithTeacherAsync(command.ContentId);
                if (software == null || software.IsPlatformOwned)
                    return await ResultAsync("Software not found.", ApplicationServiceStatus.NotFound);

                software.SetApprovalStatus(approvalStatus);
                if (command.Approve)
                {
                    software.SetApprovedSnapshot(TeacherReviewSnapshotService.BuildSoftwareSnapshot(software));
                }
                await softwareCommandRepository.CommitAsync();
                if (command.Approve && software.Teacher != null)
                {
                    await teacherFollowNotifier.NotifyFollowersContentPublishedAsync(
                        software.Teacher.Id,
                        software.Teacher.UserId,
                        "teacher_new_software",
                        BuildTeacherDisplayName(software.Teacher),
                        software.Title,
                        $"/software/{Uri.EscapeDataString(software.Slug)}",
                        software.Id);
                }
                break;
            }
            case TeacherContentType.PortfolioArticle:
            {
                var teacher = await teacherCommandRepository.GetByPortfolioArticleIdAsync(command.ContentId);
                var article = teacher?.PortfolioArticles.FirstOrDefault(a => a.Id == command.ContentId);
                if (article == null)
                    return await ResultAsync("Portfolio article not found.", ApplicationServiceStatus.NotFound);

                article.SetApprovalStatus(approvalStatus);
                if (command.Approve)
                {
                    article.SetApprovedSnapshot(TeacherReviewSnapshotService.BuildPortfolioArticleSnapshot(article));
                }
                await teacherCommandRepository.CommitAsync();
                if (command.Approve && teacher != null)
                {
                    await teacherFollowNotifier.NotifyFollowersContentPublishedAsync(
                        teacher.Id,
                        teacher.UserId,
                        "teacher_new_portfolio_article",
                        BuildTeacherDisplayName(teacher),
                        article.Title,
                        BuildTeacherProfileLink(teacher),
                        article.Id);
                }
                break;
            }
            case TeacherContentType.PlatformArticle:
            {
                var article = await articleCommandRepository.GetAsync(command.ContentId);
                if (article == null)
                    return await ResultAsync("Article not found.", ApplicationServiceStatus.NotFound);

                if (command.Approve)
                    article.ApproveModeration();
                else
                    article.RejectModeration(command.RejectionNote);

                await articleCommandRepository.CommitAsync();
                if (command.Approve)
                {
                    var articleTitle = article.Title?.Value ?? string.Empty;
                    var articleUrl = $"/articles/{Uri.EscapeDataString(article.Slug?.Value ?? command.ContentId.ToString())}";
                    var authorTeacher = await teacherCommandRepository.GetByUserIdWithDetailsAsync(article.AuthorUserId);
                    if (authorTeacher != null)
                    {
                        await teacherFollowNotifier.NotifyFollowersContentPublishedAsync(
                            authorTeacher.Id,
                            authorTeacher.UserId,
                            "teacher_new_article",
                            BuildTeacherDisplayName(authorTeacher),
                            articleTitle,
                            articleUrl,
                            article.Id);
                    }

                    await newsletterPublishNotifier.NotifyContentPublishedAsync(
                        NewsletterContentKind.Article,
                        articleTitle,
                        articleUrl,
                        authorTeacher?.Id,
                        authorTeacher?.UserId,
                        authorTeacher != null ? BuildTeacherDisplayName(authorTeacher) : null);
                }
                break;
            }
            case TeacherContentType.Resume:
            {
                var teacher = await teacherCommandRepository.GetByIdWithDetailsAsync(command.ContentId);
                if (teacher?.Resume == null)
                    return await ResultAsync("Resume not found.", ApplicationServiceStatus.NotFound);

                teacher.Resume.SetApprovalStatus(approvalStatus);
                if (command.Approve)
                {
                    teacher.Resume.SetApprovedSnapshot(
                        TeacherReviewSnapshotService.BuildResumeSnapshot(teacher.Resume));
                }
                await teacherCommandRepository.CommitAsync();
                break;
            }
            default:
                return await ResultAsync("Unsupported content type.", ApplicationServiceStatus.ValidationError);
        }

        return await ResultAsync(command.Approve ? "Content approved." : "Content rejected.", ApplicationServiceStatus.Ok);
    }

    private static bool TryParseContentType(string? raw, out TeacherContentType contentType)
    {
        contentType = TeacherContentType.Advertisement;
        if (string.IsNullOrWhiteSpace(raw))
            return false;

        return raw.Trim().ToLowerInvariant() switch
        {
            "advertisement" or "ad" => Assign(TeacherContentType.Advertisement, out contentType),
            "video" or "promotionalvideo" or "promotional_video" => Assign(TeacherContentType.PromotionalVideo, out contentType),
            "book" => Assign(TeacherContentType.Book, out contentType),
            "software" => Assign(TeacherContentType.Software, out contentType),
            "portfolio_article" or "portfolioarticle" => Assign(TeacherContentType.PortfolioArticle, out contentType),
            "article" or "platform_article" or "platformarticle" => Assign(TeacherContentType.PlatformArticle, out contentType),
            "resume" or "cv" => Assign(TeacherContentType.Resume, out contentType),
            _ => false,
        };
    }

    private static bool Assign(TeacherContentType value, out TeacherContentType contentType)
    {
        contentType = value;
        return true;
    }

    private static string BuildTeacherDisplayName(Teacher teacher)
    {
        var user = teacher.User;
        if (user == null)
            return string.Empty;
        return $"{user.UserFullName?.FirstName} {user.UserFullName?.LastName}".Trim();
    }

    private static string BuildTeacherProfileLink(Teacher teacher)
    {
        var userName = teacher.User?.UserName?.Value;
        return string.IsNullOrWhiteSpace(userName)
            ? $"/teachers/{teacher.Id}"
            : $"/teachers/{Uri.EscapeDataString(userName)}";
    }
}
