namespace ArkaSoftwarePro.Src.Core.Contracts.Email;

public enum NewsletterContentKind
{
    Article = 1,
    Book = 2,
    Course = 3,
    Seminar = 4
}

public interface INewsletterPublishNotifier
{
    /// <summary>
    /// Article/Book → all active newsletter subscribers.
    /// Course/Seminar → active subscribers who are students of the given teacher.
    /// </summary>
    Task NotifyContentPublishedAsync(
        NewsletterContentKind kind,
        string title,
        string relativeUrl,
        long? teacherId = null,
        long? teacherUserId = null,
        string? authorDisplayName = null,
        CancellationToken cancellationToken = default);
}
