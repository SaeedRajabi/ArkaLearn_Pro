using ArkaSoftwarePro.Src.Core.Domain.Common;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.SeminarAggregate.Events;
using ArkaSoftwarePro.Src.Core.Domain.SeminarAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.SeminarAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Core.Domain.TagAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.TagAggregate.ValueOBJs;
using Framework.Src.Core.Domain.Aggregates;
using Framework.Src.Core.Domain.Exceptions;

namespace ArkaSoftwarePro.Src.Core.Domain.SeminarAggregate.Entities
{
    public class Seminar : AggregateRoot
    {
        public SeminarTitle? Title { get; private set; }
        public SeminarDescription? Description { get; private set; }
        public DateTime StartTime { get; private set; }
        public DateTime EndTime { get; private set; }
        public int Capacity { get; private set; }
        public int RegisteredCount => _registrations.Count;
        public Price? Price { get; private set; }
        public bool IsFree { get; private set; }
        public SeminarStatus Status { get; private set; }
        public SeminarEntryLink? EntryLink { get; private set; }
        public string? ThumbnailUrl { get; private set; }
        /// <summary>ویدیو معرفی سمینار (قابل نمایش در صفحه جزئیات)</summary>
        public string? VideoUrl { get; private set; }
        /// <summary>ویدیو ضبط‌شده پس از پایان سمینار (فقط برای ثبت‌نام‌شده‌ها)</summary>
        public string? RecordingVideoUrl { get; private set; }
        /// <summary>نمایش در وب‌سایت مشتری</summary>
        public bool IsPublic { get; private set; } = true;
        public string? Prerequisites { get; private set; }
        public string? FaqsJson { get; private set; }
        public string? SeoTitle { get; private set; }
        public string? MetaDescription { get; private set; }
        public string? OgImageUrl { get; private set; }

        public long? RoomId { get; private set; }
        public Room? Room { get; private set; }

        public IReadOnlyList<Tag> Tags => _tags;
        private readonly List<Tag> _tags = new();
        public IReadOnlyList<SeminarRegistration> Registrations => _registrations;
        private readonly List<SeminarRegistration> _registrations = new();
        public IReadOnlyList<SeminarComment> SeminarComments => _seminarComments;
        private readonly List<SeminarComment> _seminarComments = new();

        private Seminar() { }

        public Seminar(
            SeminarTitle title,
            SeminarDescription description,
            DateTime startTime,
            DateTime endTime,
            int capacity,
            Price price,
            bool isFree,
            SeminarStatus status,
            SeminarEntryLink? entryLink,
            string? thumbnailUrl,
            string? videoUrl,
            long? roomId,
            string? prerequisites = null,
            string? faqsJson = null,
            string? recordingVideoUrl = null,
            bool isPublic = true)
        {
            if (endTime <= startTime)
                throw new InvalidEntityStateException("EndTime must be after StartTime.", nameof(Seminar));
            if (capacity <= 0)
                throw new InvalidEntityStateException("Capacity must be positive.", nameof(Seminar));

            Title = title;
            Description = description;
            StartTime = startTime;
            EndTime = endTime;
            Capacity = capacity;
            Price = price;
            IsFree = isFree;
            Status = status;
            EntryLink = entryLink;
            ThumbnailUrl = thumbnailUrl;
            VideoUrl = videoUrl;
            RecordingVideoUrl = recordingVideoUrl;
            IsPublic = isPublic;
            RoomId = roomId;
            Prerequisites = prerequisites;
            FaqsJson = faqsJson;
            AddEvent(new SeminarCreated(title.Value!, startTime, endTime, capacity, price.Amount, isFree, roomId));
        }

        public void AddTag(string tagName)
        {
            if (string.IsNullOrWhiteSpace(tagName)) return;
            var tag = new Tag(new TagName(tagName.Trim()));
            _tags.Add(tag);
        }

        public void ClearTags()
        {
            _tags.Clear();
        }

        public void RegisterUser(long userId, bool hasPaid)
        {
            if (_registrations.Any(r => r.UserId == userId))
                throw new InvalidEntityStateException("User already registered for this seminar.", nameof(RegisterUser));
            if (RegisteredCount >= Capacity)
                throw new InvalidEntityStateException("Seminar is full.", nameof(RegisterUser));
            if (!IsFree && !hasPaid)
                throw new InvalidEntityStateException("Payment required for paid seminar.", nameof(RegisterUser));

            _registrations.Add(SeminarRegistration.Create(userId, Id, hasPaid));
            AddEvent(new SeminarRegistrationAdded(userId, Id, hasPaid));
        }

        public void CancelRegistration(long userId)
        {
            var reg = _registrations.FirstOrDefault(r => r.UserId == userId);
            if (reg == null)
                throw new InvalidEntityStateException("User is not registered.", nameof(CancelRegistration));
            _registrations.Remove(reg);
        }

        public bool CanUserEnter(long userId)
        {
            var reg = _registrations.FirstOrDefault(r => r.UserId == userId);
            if (reg == null) return false;
            return IsFree || reg.HasPaid;
        }

        public void AddComment(long userId, CommentContent content, int rating, int like, long? parentId)
        {
            var comment = SeminarComment.Create(userId, Id, content, rating, like, parentId);
            _seminarComments.Add(comment);
            AddEvent(new SeminarCommentAdded(userId, content.Value ?? "", rating, like, parentId));
        }

        public void ApproveComment(long commentId, bool isApproved)
        {
            var comment = _seminarComments.FirstOrDefault(c => c.Id == commentId);
            if (comment == null) return;
            comment.ChangeApproved(isApproved);
            AddEvent(new SeminarCommentApproved(commentId, isApproved));
        }

        public void SetStatus(SeminarStatus status) => Status = status;
        public void SetEntryLink(SeminarEntryLink link) => EntryLink = link;
        public void SetRoom(long? roomId) => RoomId = roomId;
        public void SetMediaUrls(string? thumbnailUrl, string? videoUrl, string? recordingVideoUrl = null)
        {
            if (thumbnailUrl != null) ThumbnailUrl = thumbnailUrl;
            if (videoUrl != null) VideoUrl = videoUrl;
            if (recordingVideoUrl != null) RecordingVideoUrl = recordingVideoUrl;
        }

        public void SetRecordingVideoUrl(string? recordingVideoUrl) => RecordingVideoUrl = recordingVideoUrl;
        public void SetIsPublic(bool isPublic) => IsPublic = isPublic;

        public bool IsExpiredUtc(DateTime utcNow) => utcNow > EndTime;

        public bool CanAcceptRegistration(DateTime utcNow)
        {
            if (IsExpiredUtc(utcNow)) return false;
            if (Status is SeminarStatus.Cancelled or SeminarStatus.Completed or SeminarStatus.Draft) return false;
            if (!IsPublic) return false;
            return RegisteredCount < Capacity;
        }

        /// <summary>
        /// به‌روزرسانی اطلاعات سمینار (از جمله اتاق گفتگو).
        /// </summary>
        public void UpdateDetails(
            SeminarTitle title,
            SeminarDescription description,
            DateTime startTime,
            DateTime endTime,
            int capacity,
            Price price,
            bool isFree,
            SeminarStatus status,
            SeminarEntryLink? entryLink,
            string? thumbnailUrl,
            string? videoUrl,
            long? roomId,
            string? prerequisites = null,
            string? faqsJson = null,
            string? recordingVideoUrl = null,
            bool? isPublic = null)
        {
            if (endTime <= startTime)
                throw new InvalidEntityStateException("EndTime must be after StartTime.", nameof(UpdateDetails));
            if (capacity <= 0)
                throw new InvalidEntityStateException("Capacity must be positive.", nameof(UpdateDetails));
            if (capacity < RegisteredCount)
                throw new InvalidEntityStateException("Capacity cannot be less than current registrations.", nameof(UpdateDetails));

            Title = title;
            Description = description;
            StartTime = startTime;
            EndTime = endTime;
            Capacity = capacity;
            Price = price;
            IsFree = isFree;
            Status = status;
            EntryLink = entryLink;
            ThumbnailUrl = thumbnailUrl;
            VideoUrl = videoUrl;
            if (recordingVideoUrl != null) RecordingVideoUrl = recordingVideoUrl;
            if (isPublic.HasValue) IsPublic = isPublic.Value;
            RoomId = roomId;
            Prerequisites = prerequisites;
            FaqsJson = faqsJson;
        }

        public void UpdateSeo(string? seoTitle, string? metaDescription, string? ogImageUrl)
        {
            SeoTitle = SeoMetadata.NormalizeTitle(seoTitle);
            MetaDescription = SeoMetadata.NormalizeDescription(metaDescription);
            OgImageUrl = SeoMetadata.NormalizeOgImageUrl(ogImageUrl);
        }
    }
}
