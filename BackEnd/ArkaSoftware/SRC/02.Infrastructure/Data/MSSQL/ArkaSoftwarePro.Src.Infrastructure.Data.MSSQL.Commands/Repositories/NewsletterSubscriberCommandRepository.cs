using ArkaSoftwarePro.Src.Core.Contracts.Newsletter.NewsletterRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.NewsletterAggregate.Entities;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories;

public class NewsletterSubscriberCommandRepository(ArkaSoftwareCommandDbContext dbContext)
    : BaseCommandRepository<NewsletterSubscriber, ArkaSoftwareCommandDbContext>(dbContext),
      INewsletterSubscriberCommandRepository
{
    public async Task<NewsletterSubscriber?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        var normalized = NewsletterSubscriber.NormalizeEmail(email);
        if (string.IsNullOrWhiteSpace(normalized))
            return null;

        return await _dbContext.NewsletterSubscribers
            .FirstOrDefaultAsync(x => x.Email == normalized, cancellationToken);
    }

    public async Task<IReadOnlyList<string>> GetActiveVerifiedEmailsAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.NewsletterSubscribers
            .AsNoTracking()
            .Where(x => x.IsVerified && x.UnsubscribedAtUtc == null)
            .Select(x => x.Email)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<string>> FilterActiveVerifiedEmailsAsync(
        IEnumerable<string> emails,
        CancellationToken cancellationToken = default)
    {
        var normalized = emails
            .Select(NewsletterSubscriber.NormalizeEmail)
            .Where(e => !string.IsNullOrWhiteSpace(e))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (normalized.Count == 0)
            return Array.Empty<string>();

        return await _dbContext.NewsletterSubscribers
            .AsNoTracking()
            .Where(x =>
                x.IsVerified &&
                x.UnsubscribedAtUtc == null &&
                normalized.Contains(x.Email))
            .Select(x => x.Email)
            .ToListAsync(cancellationToken);
    }
}
