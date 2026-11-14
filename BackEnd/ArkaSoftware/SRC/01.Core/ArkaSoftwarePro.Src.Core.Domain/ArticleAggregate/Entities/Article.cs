using ArkaSoftwarePro.Src.Core.Domain.Common;
using ArkaSoftwarePro.Src.Core.Domain.ArticleAggregate.Events;
using ArkaSoftwarePro.Src.Core.Domain.ArticleAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Core.Domain.CategoryAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.TagAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;
using Framework.Src.Core.Domain.Aggregates;

namespace ArkaSoftwarePro.Src.Core.Domain.ArticleAggregate.Entities
{
    public class Article : AggregateRoot
    {
        public ArticleTitle? Title { get; private set; }
        public ArticleSummary? Summary { get; private set; }
        public ArticleContent? Content { get; private set; }
        public Slug? Slug { get; private set; }
        public string? ThumbnailUrl { get; private set; }
        public string? SeoTitle { get; private set; }
        public string? MetaDescription { get; private set; }
        public string? OgImageUrl { get; private set; }
        public bool IsPublished { get; private set; }
        public DateTime? PublishedAt { get; private set; }
        public TeacherApprovalStatus ModerationStatus { get; private set; } = TeacherApprovalStatus.Draft;
        public string? ModerationRejectionNote { get; private set; }
        public DateTime? ModerationSubmittedAtUtc { get; private set; }

        public long? CategoryId { get; private set; }
        public Category? Category { get; private set; }
        public long AuthorUserId { get; private set; }

        public IReadOnlyList<ArticleComment> ArticleComments => _articleComments;
        private readonly List<ArticleComment> _articleComments = new();
        public IReadOnlyList<Tag> Tags => _tags;
        private readonly List<Tag> _tags = new();
        public IReadOnlyList<Category> Categories => _categories;
        private readonly List<Category> _categories = new();

        private Article() { }

        public Article(
            ArticleTitle title,
            ArticleSummary summary,
            ArticleContent content,
            Slug slug,
            string? thumbnailUrl,
            long authorUserId,
            long? categoryId,
            bool isPublished = false)
        {
            Title = title;
            Summary = summary;
            Content = content;
            Slug = slug;
            ThumbnailUrl = thumbnailUrl;
            AuthorUserId = authorUserId;
            CategoryId = categoryId;
            IsPublished = isPublished;
            if (isPublished)
                PublishedAt = DateTime.UtcNow;
            AddEvent(new ArticleAdded(authorUserId, title.Value!, slug.Value!, categoryId, isPublished));
        }

        public ArticleComment AddComment(long userId, CommentContent content, int rating, int like, long? parentId)
        {
            var comment = ArticleComment.Create(userId, Id, content, rating, like, parentId);
            _articleComments.Add(comment);
            AddEvent(new ArticleCommentAdded(userId, content.Value ?? "", rating, like, parentId));
            return comment;
        }


        public void AddCategories(Category category)
        {
            _categories.Add(category);
        }
        
        public void AddTag(Tag tag)
        {
            _tags.Add(tag);
        }
        
        public void ApproveComment(long commentId, bool isApproved)
        {
            var comment = _articleComments.FirstOrDefault(c => c.Id == commentId);
            if (comment! == null!)
                return;
            comment.ChangeApproved(isApproved);
            AddEvent(new ArticleCommentApproved(commentId, isApproved));
        }

        public void Publish()
        {
            IsPublished = true;
            PublishedAt = DateTime.UtcNow;
        }

        public void Unpublish()
        {
            IsPublished = false;
        }

        public void SubmitForModeration()
        {
            ModerationStatus = TeacherApprovalStatus.Pending;
            ModerationRejectionNote = null;
            ModerationSubmittedAtUtc = DateTime.UtcNow;
            IsPublished = false;
            PublishedAt = null;
        }

        public void ApproveModeration()
        {
            ModerationStatus = TeacherApprovalStatus.Approved;
            ModerationRejectionNote = null;
            IsPublished = true;
            PublishedAt = DateTime.UtcNow;
        }

        public void RejectModeration(string? rejectionNote)
        {
            ModerationStatus = TeacherApprovalStatus.Rejected;
            ModerationRejectionNote = rejectionNote?.Trim();
            IsPublished = false;
            PublishedAt = null;
        }

        public bool IsPubliclyVisible() =>
            IsPublished && ModerationStatus == TeacherApprovalStatus.Approved;

        public void UpdateContent(ArticleTitle? title, ArticleSummary? summary, ArticleContent? content, string? thumbnailUrl)
        {
            if (title! != null!) Title = title;
            if (summary! != null!) Summary = summary;
            if (content! != null!) Content = content;
            if (thumbnailUrl != null) ThumbnailUrl = thumbnailUrl;
        }

        public void UpdateSlug(Slug slug)
        {
            Slug = slug;
        }

        public void UpdateCategory(long? categoryId)
        {
            CategoryId = categoryId;
        }

        public void UpdateSeo(string? seoTitle, string? metaDescription, string? ogImageUrl)
        {
            SeoTitle = SeoMetadata.NormalizeTitle(seoTitle);
            MetaDescription = SeoMetadata.NormalizeDescription(metaDescription);
            OgImageUrl = SeoMetadata.NormalizeOgImageUrl(ogImageUrl);
        }
    }
}
