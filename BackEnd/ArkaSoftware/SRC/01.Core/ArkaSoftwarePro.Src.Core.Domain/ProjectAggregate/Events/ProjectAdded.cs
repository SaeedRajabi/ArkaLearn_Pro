using Framework.Src.Core.Domain.Events;

namespace ArkaSoftwarePro.Src.Core.Domain.ProjectAggregate.Events;

public record ProjectAdded(long AuthorUserId, string Title, string Slug, bool IsPublished) : IDomainEvent;
