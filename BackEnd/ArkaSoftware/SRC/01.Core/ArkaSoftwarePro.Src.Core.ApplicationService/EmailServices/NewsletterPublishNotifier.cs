using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Email;
using ArkaSoftwarePro.Src.Core.Contracts.Newsletter.NewsletterRepositoryContracts.Commands;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.EmailServices;

public sealed class NewsletterPublishNotifier(
    INewsletterSubscriberCommandRepository subscriberRepository,
    ICourseQueriesRepository courseQueriesRepository,
    TransactionalEmailSender sender,
    IConfiguration configuration,
    ILogger<NewsletterPublishNotifier> logger) : INewsletterPublishNotifier
{
    private string ClientBaseUrl =>
        configuration["PaymentGateway:ClientBaseUrl"]?.Trim().TrimEnd('/')
        ?? "https://arkasoftware.ir";

    public async Task NotifyContentPublishedAsync(
        NewsletterContentKind kind,
        string title,
        string relativeUrl,
        long? teacherId = null,
        long? teacherUserId = null,
        string? authorDisplayName = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var recipients = await ResolveRecipientsAsync(kind, teacherId, teacherUserId, cancellationToken);
            if (recipients.Count == 0)
                return;

            var contentTitle = string.IsNullOrWhiteSpace(title) ? "محتوای جدید" : title.Trim();
            var link = ToAbsoluteUrl(relativeUrl);
            var typeLabel = DescribeTypeLabel(kind);
            var author = string.IsNullOrWhiteSpace(authorDisplayName) ? "آرکا نرم افزار" : authorDisplayName.Trim();

            foreach (var email in recipients)
            {
                try
                {
                    await sender.SendAsync(
                        EmailTemplateKeys.NewsletterNewContent,
                        email,
                        email,
                        new Dictionary<string, string?>
                        {
                            ["recipientName"] = email,
                            ["contentTypeLabel"] = typeLabel,
                            ["contentTitle"] = contentTitle,
                            ["contentLink"] = link,
                            ["authorName"] = author
                        },
                        cancellationToken);
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "Failed to send newsletter email to {Email} for {Kind}", email, kind);
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Newsletter publish notify failed for {Kind}: {Title}", kind, title);
        }
    }

    private async Task<IReadOnlyList<string>> ResolveRecipientsAsync(
        NewsletterContentKind kind,
        long? teacherId,
        long? teacherUserId,
        CancellationToken cancellationToken)
    {
        if (kind is NewsletterContentKind.Article or NewsletterContentKind.Book)
            return await subscriberRepository.GetActiveVerifiedEmailsAsync(cancellationToken);

        if (kind is not (NewsletterContentKind.Course or NewsletterContentKind.Seminar))
            return Array.Empty<string>();

        if (teacherUserId is not > 0 && teacherId is not > 0)
            return Array.Empty<string>();

        var students = await courseQueriesRepository.GetTeacherStudentsPagedAsync(
            teacherId,
            teacherUserId ?? 0,
            searchTerm: null,
            pageNumber: 1,
            pageSize: 10_000);

        var emails = (students.QueryResult ?? [])
            .Select(x => x.Email)
            .Where(e => !string.IsNullOrWhiteSpace(e))
            .Select(e => e!)
            .Distinct(StringComparer.OrdinalIgnoreCase);

        return await subscriberRepository.FilterActiveVerifiedEmailsAsync(emails, cancellationToken);
    }

    private string ToAbsoluteUrl(string relativeUrl)
    {
        if (string.IsNullOrWhiteSpace(relativeUrl))
            return ClientBaseUrl;
        if (relativeUrl.StartsWith("http", StringComparison.OrdinalIgnoreCase))
            return relativeUrl;
        return $"{ClientBaseUrl}{(relativeUrl.StartsWith('/') ? relativeUrl : $"/{relativeUrl}")}";
    }

    private static string DescribeTypeLabel(NewsletterContentKind kind) =>
        kind switch
        {
            NewsletterContentKind.Article => "مقاله",
            NewsletterContentKind.Book => "کتاب",
            NewsletterContentKind.Course => "دوره",
            NewsletterContentKind.Seminar => "سمینار",
            _ => "محتوا"
        };
}
