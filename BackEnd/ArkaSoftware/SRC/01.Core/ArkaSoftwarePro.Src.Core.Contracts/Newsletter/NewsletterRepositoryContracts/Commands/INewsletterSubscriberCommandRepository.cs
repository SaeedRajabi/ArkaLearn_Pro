using Framework.Src.Core.Contracts.Data.Commands;
using NewsletterSubscriberEntity = ArkaSoftwarePro.Src.Core.Domain.NewsletterAggregate.Entities.NewsletterSubscriber;

namespace ArkaSoftwarePro.Src.Core.Contracts.Newsletter.NewsletterRepositoryContracts.Commands;

public interface INewsletterSubscriberCommandRepository : ICommandRepository<NewsletterSubscriberEntity, long>
{
    Task<NewsletterSubscriberEntity?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<string>> GetActiveVerifiedEmailsAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyList<string>> FilterActiveVerifiedEmailsAsync(
        IEnumerable<string> emails,
        CancellationToken cancellationToken = default);
}
