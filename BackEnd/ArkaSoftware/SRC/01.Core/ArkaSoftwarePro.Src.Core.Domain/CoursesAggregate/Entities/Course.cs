using ArkaSoftwarePro.Src.Core.Domain.Common;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;
using Framework.Src.Core.Domain.Aggregates;
using Framework.Src.Core.Domain.Exceptions;
using Framework.Src.Core.Domain.ValueOBJs;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Events;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Services;
using ArkaSoftwarePro.Src.Core.Domain.CategoryAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.TagAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Entities
{
    public class Course : AggregateRoot
    {
        #region Properties
        public Title? Title { get; private set; }
        public CourseStatus? Status { get; private set; }
        public Price? Price { get; private set; }
        /// <summary>قیمت اصلی قبل از تخفیف؛ اختیاری و باید بیشتر از Price باشد.</summary>
        public Price? OriginalPrice { get; private set; }
        public AverageRating? AverageRating { get; private set; }
        public Image? TitleImage { get; private set; }
        public CourseLevel? CourseLevel { get; private set; }
        public Description? Description { get; private set; }
        public LongDescription? LongDescription { get; private set; }
        public bool IsCompleted { get; private set; }
        public bool IsPublish { get; private set; }
        public TeacherApprovalStatus ModerationStatus { get; private set; } = TeacherApprovalStatus.Draft;
        public string? ModerationRejectionNote { get; private set; }
        public DateTime? ModerationSubmittedAtUtc { get; private set; }
        public bool IsCertificate { get; private set; }
        public CourseDeliveryMode DeliveryMode { get; private set; } = CourseDeliveryMode.DirectDownload;
        public string? SpotPlayerCourseKey { get; private set; }
        public CourseLifecyclePhase LifecyclePhase { get; private set; } = CourseLifecyclePhase.NotStarted;
        public DateTime? RegistrationDeadlineUtc { get; private set; }
        public DateTime? CourseStartUtc { get; private set; }
        public DateTime? CourseEndUtc { get; private set; }
        public bool IsRegistrationClosed { get; private set; }
        public string? SeoTitle { get; private set; }
        public string? MetaDescription { get; private set; }
        public string? OgImageUrl { get; private set; }
        /// <summary>fa | en</summary>
        public string CourseLanguage { get; private set; } = "fa";
        public CoursePaymentType PaymentType { get; private set; } = CoursePaymentType.Cash;
        #endregion

        #region References Properties

        public long? TeacherId { get; private set; }
        public Teacher? Teacher { get; private set; }


        public long? CategoryId { get; private set; }
        public Category? Category { get; private set; }

        // Many Relation
        public IReadOnlyList<Tag> Tags => _tags;
        private readonly List<Tag> _tags = new List<Tag>();
        public IReadOnlyList<CourseComment> CourseComments => _courseComment;
        private readonly List<CourseComment> _courseComment = new List<CourseComment>();

        //public IReadOnlyList<CoursePlan> CoursePlans => _coursePlans;
        //private List<CoursePlan> _coursePlans = new List<CoursePlan>();

        public IReadOnlyList<CourseSection> CourseSessions => _courseSessions;
        private readonly List<CourseSection> _courseSessions = new List<CourseSection>();

        

        public IReadOnlyList<CourseDependency> CourseDependencies => _courseDependencies;
        private readonly List<CourseDependency> _courseDependencies = new List<CourseDependency>();

        public IReadOnlyList<CourseVideo> CourseVideos => _courseVideos;
        private readonly List<CourseVideo> _courseVideos = new List<CourseVideo>();


        public IReadOnlyList<CourseFaq> CourseFaqs => _courseFaqs;
        private readonly List<CourseFaq> _courseFaqs = new List<CourseFaq>();

        public IReadOnlyList<CourseInstallmentPlan> InstallmentPlans => _installmentPlans;
        private readonly List<CourseInstallmentPlan> _installmentPlans = new List<CourseInstallmentPlan>();
        #endregion

        #region CTORs
        public Course(Title title,
            CourseStatus status,
            Price price,
            Image titleImage,
            Description description,
            LongDescription longDescription,
            CourseLevel courseLevel,
            long categoryId,
            long teacherId,
            bool isPublish = false,
            bool isCertificate = false,
            CourseDeliveryMode deliveryMode = CourseDeliveryMode.DirectDownload,
            string? spotPlayerCourseKey = null,
            CourseLifecyclePhase lifecyclePhase = CourseLifecyclePhase.NotStarted,
            DateTime? registrationDeadlineUtc = null,
            DateTime? courseStartUtc = null,
            DateTime? courseEndUtc = null)
        {
            Title = title;
            Status = status;
            Price = price;
            TitleImage = titleImage;
            Description = description;
            LongDescription = longDescription;
            CourseLevel = courseLevel;
            IsCompleted = true;
            AverageRating = AverageRating?.AddNewRating(1);
            CategoryId = categoryId;
            TeacherId = teacherId;
            IsPublish = isPublish;
            IsCertificate = isCertificate;
            DeliveryMode = deliveryMode;
            SpotPlayerCourseKey = NormalizeSpotPlayerCourseKey(spotPlayerCourseKey);
            LifecyclePhase = lifecyclePhase;
            RegistrationDeadlineUtc = registrationDeadlineUtc;
            CourseStartUtc = courseStartUtc;
            CourseEndUtc = courseEndUtc;
            AddEvent(new CourseAdded(
                title.Value!,
                status,
                price.Amount,
                titleImage.ImageURL!,
                description.Value,
                longDescription.Value!,
                courseLevel,
                categoryId,
                teacherId,
                isPublish,
                isCertificate
                ));
        }
        public Course() { }
        #endregion

        #region Behaviors IMP

        public void AddCourseFaq(string question, string answer)
        {
            if (_courseFaqs.Any(x => x.Question!.Content == question))
                throw new InvalidEntityStateException("Question Is Exist.", nameof(AddCourseFaq));
            _courseFaqs.Add(CourseFaq.Create(question , answer));
            AddEvent(new CourseFaqAdded(question , answer));
        }

        public void AddCourseVideo(string title, string videoPath , TimeSpan duration)
        {
            var introTitle = string.IsNullOrWhiteSpace(title) ? "intro" : title.Trim();
            if (introTitle.Length > 100)
                introTitle = introTitle[..100];

            if (_courseVideos.Any(x => x.Title!.Value == introTitle))
                throw new InvalidEntityStateException("Video Is Exist.", nameof(AddCourseVideo));
            _courseVideos.Add(CourseVideo.Create(Id , introTitle , videoPath, duration));
            AddEvent(new CourseVideoAdded(introTitle , videoPath, duration));
        }

        public void AddCourseSession(Title title, List<CourseLesson> courseLessons)
        {
            CourseSection courseSession = new CourseSection(title, Id, courseLessons);
            if (_courseSessions.Any(x => x.SessionTitle! == title && x.CourseId == Id))
                throw new InvalidEntityStateException("Course Session Is Exist Please another One.", nameof(courseSession));
            _courseSessions.Add(courseSession);
            AddEvent(new CourseSessionAdded(title.Value!, courseLessons));
        }

        public CourseComment AddCourseComment(long userId, CommentContent content,int rating , int like , long? parentId)
        {
            CourseComment courseComment = CourseComment.Create(userId, Id, content,rating,like,parentId);
            _courseComment.Add(courseComment);
            AddEvent(new CourseCommentAdded(userId, content.Value ?? "",rating , like , parentId));
            return courseComment;
        }

        public void ApproveComment(long commentId, bool isApproved)
        {
            var comment = _courseComment.FirstOrDefault(c => c.Id == commentId);
            if (comment == null)
                throw new InvalidEntityStateException($"Course comment {commentId} was not found.", nameof(comment));
            comment.ChangeApproved(isApproved);
        }

        public void AddTags(string tagName)
        {
            var tag = new Tag(tagName);
            _tags.Add(tag);
        }

        public void AddCourseDependencies(string dependencyTitle)
        {
            var dependency = new CourseDependency(Id, dependencyTitle);
            _courseDependencies.Add(dependency);
            AddEvent(new CourseDependencyAdded(Id , dependencyTitle));
        }


        public void ChangeCourseTitleImage(string newTitleImage)
        {
            TitleImage = Image.Create(newTitleImage);
            AddEvent(new CourseTitleImageChanged(Id, newTitleImage));

        }

        public void UpdateAdminDetails(
            Title title,
            CourseStatus status,
            Price price,
            Description description,
            LongDescription longDescription,
            CourseLevel courseLevel,
            long categoryId,
            bool isPublish,
            bool isCertificate,
            CourseDeliveryMode deliveryMode,
            string? spotPlayerCourseKey,
            CourseLifecyclePhase lifecyclePhase,
            DateTime? registrationDeadlineUtc,
            DateTime? courseStartUtc,
            DateTime? courseEndUtc)
        {
            Title = title;
            Status = status;
            Price = price;
            Description = description;
            LongDescription = longDescription;
            CourseLevel = courseLevel;
            CategoryId = categoryId;
            IsPublish = isPublish;
            IsCertificate = isCertificate;
            DeliveryMode = deliveryMode;
            SpotPlayerCourseKey = NormalizeSpotPlayerCourseKey(spotPlayerCourseKey);
            LifecyclePhase = lifecyclePhase;
            RegistrationDeadlineUtc = registrationDeadlineUtc;
            CourseStartUtc = courseStartUtc;
            CourseEndUtc = courseEndUtc;
        }

        public void SetCourseLanguage(string? language)
        {
            var normalized = (language ?? "fa").Trim().ToLowerInvariant();
            CourseLanguage = normalized is "en" or "english" ? "en" : "fa";
        }

        public void SetRegistrationClosed(bool isRegistrationClosed) => IsRegistrationClosed = isRegistrationClosed;

        public bool IsPubliclyVisible => IsPublish && ModerationStatus == TeacherApprovalStatus.Approved;

        public void ApplyModerationOnSave(bool requestedPublish, bool isAdmin)
        {
            if (!requestedPublish)
            {
                if (!isAdmin)
                    ModerationStatus = TeacherApprovalStatus.Draft;
                return;
            }

            if (isAdmin)
            {
                ModerationStatus = TeacherApprovalStatus.Approved;
                ModerationRejectionNote = null;
                return;
            }

            ModerationStatus = TeacherApprovalStatus.Pending;
            ModerationRejectionNote = null;
            ModerationSubmittedAtUtc = DateTime.UtcNow;
        }

        public void SetModerationStatus(TeacherApprovalStatus status, string? rejectionNote = null)
        {
            ModerationStatus = status;
            ModerationRejectionNote = status == TeacherApprovalStatus.Rejected ? rejectionNote?.Trim() : null;
            if (status == TeacherApprovalStatus.Pending)
                ModerationSubmittedAtUtc = DateTime.UtcNow;
        }

        public void SetOriginalPrice(Price? originalPrice) => OriginalPrice = originalPrice;

        /// <summary>
        /// تنظیم نوع پرداخت و جدول اقساط دوره. برای نقدی، لیست خالی می‌شود.
        /// </summary>
        public void ConfigurePayment(
            CoursePaymentType paymentType,
            IReadOnlyList<(int Number, decimal AmountToman, DateTime? DueDateUtc)>? installments)
        {
            if (paymentType == CoursePaymentType.Cash)
            {
                PaymentType = CoursePaymentType.Cash;
                _installmentPlans.Clear();
                return;
            }

            if (installments is null || installments.Count < CourseInstallmentPlan.MinInstallmentCount)
                throw new InvalidEntityStateException("Installment courses require between 2 and 6 installments.");
            if (installments.Count > CourseInstallmentPlan.MaxInstallmentCount)
                throw new InvalidEntityStateException("Installment courses cannot have more than 6 installments.");

            var ordered = installments.OrderBy(x => x.Number).ToList();
            for (var i = 0; i < ordered.Count; i++)
            {
                if (ordered[i].Number != i + 1)
                    throw new InvalidEntityStateException("Installment numbers must be consecutive starting from 1.");
                if (ordered[i].AmountToman <= 0)
                    throw new InvalidEntityStateException("Each installment amount must be positive.");
                if (i > 0 && ordered[i].DueDateUtc is null)
                    throw new InvalidEntityStateException("Installments after the first require a due date.");
            }

            var sum = ordered.Sum(x => x.AmountToman);
            var coursePrice = Price?.Amount ?? 0m;
            if (coursePrice > 0 && Math.Abs(sum - coursePrice) > 0.5m)
                throw new InvalidEntityStateException("Sum of installment amounts must equal the course price.");

            PaymentType = CoursePaymentType.Installment;
            _installmentPlans.Clear();
            foreach (var row in ordered)
                _installmentPlans.Add(CourseInstallmentPlan.Create(row.Number, row.AmountToman, row.DueDateUtc));
        }

        public decimal GetCheckoutAmount()
        {
            if (PaymentType == CoursePaymentType.Installment && _installmentPlans.Count > 0)
            {
                var first = _installmentPlans.OrderBy(x => x.InstallmentNumber).FirstOrDefault();
                if (first != null) return first.AmountToman;
            }
            return Price?.Amount ?? 0m;
        }

        public void UpdateSeo(string? seoTitle, string? metaDescription, string? ogImageUrl)
        {
            SeoTitle = SeoMetadata.NormalizeTitle(seoTitle);
            MetaDescription = SeoMetadata.NormalizeDescription(metaDescription);
            OgImageUrl = SeoMetadata.NormalizeOgImageUrl(ogImageUrl);
        }

        public void ApplyLifecycleTransition(CourseLifecyclePhase phase) => LifecyclePhase = phase;

        public CourseLifecyclePhase GetEffectiveLifecyclePhase(DateTime utcNow) =>
            CourseLifecycleRules.ResolveEffectivePhase(
                LifecyclePhase,
                RegistrationDeadlineUtc,
                CourseStartUtc,
                CourseEndUtc,
                utcNow);

        public bool TrySyncLifecycleFromSchedule(DateTime utcNow, out CourseLifecyclePhase syncedPhase)
        {
            syncedPhase = GetEffectiveLifecyclePhase(utcNow);
            if (syncedPhase == LifecyclePhase)
                return false;

            LifecyclePhase = syncedPhase;
            if (syncedPhase == CourseLifecyclePhase.Ended)
                IsCompleted = true;

            return true;
        }

        private static string? NormalizeSpotPlayerCourseKey(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return null;

            var trimmed = value.Trim();
            return trimmed.Length > 100 ? trimmed[..100] : trimmed;
        }

        public bool UsesSpotPlayerLicense() => DeliveryMode == CourseDeliveryMode.SpotPlayerLicense;

        public bool UsesDesktopLicense() => DeliveryMode == CourseDeliveryMode.DesktopLicense;

        public void ReplaceDependencies(IReadOnlyList<string> dependencyTitles)
        {
            _courseDependencies.Clear();
            foreach (var title in dependencyTitles)
                AddCourseDependencies(title);
        }

        public void ReplaceFaqs(IReadOnlyList<(string Question, string Answer)> faqs)
        {
            _courseFaqs.Clear();
            foreach (var (question, answer) in faqs)
                AddCourseFaq(question, answer);
        }

        public void ReplaceSessions(
            IReadOnlyList<(long SectionId, string Title, IReadOnlyList<CourseLessonReplaceItem> Lessons)> sessions,
            bool isAdmin = false)
        {
            var existingSections = _courseSessions.ToList();
            var sectionsById = existingSections.Where(s => s.Id > 0).ToDictionary(s => s.Id);
            var allExistingLessons = existingSections
                .SelectMany(s => s._courseLessons)
                .Where(l => l.Id > 0)
                .GroupBy(l => l.Id)
                .ToDictionary(g => g.Key, g => g.First());

            var preservedVideos = existingSections
                .OrderBy(s => s.Id)
                .SelectMany((section, sectionIndex) =>
                    section._courseLessons
                        .OrderBy(l => l.SortOrder)
                        .ThenBy(l => l.Id)
                        .Select((lesson, lessonIndex) => new PreservedLessonSnapshot(
                            sectionIndex,
                            lessonIndex,
                            section.SessionTitle?.Value ?? string.Empty,
                            lesson.LessonTitle?.Value ?? string.Empty,
                            lesson.Id,
                            lesson.VideoTitle?.Value,
                            lesson.VideoPath?.Value,
                            lesson.MediaAssetId,
                            lesson.DurationSeconds,
                            lesson.IsPublished,
                            lesson.PublishedAtUtc,
                            lesson.VideoModerationStatus,
                            lesson.VideoRejectionNote,
                            lesson.VideoSubmittedAtUtc)))
                .ToList();

            var keptSections = new List<CourseSection>();
            var keptLessonIds = new HashSet<long>();
            var sectionIndexNew = 0;

            foreach (var session in sessions)
            {
                CourseSection section;
                if (session.SectionId > 0 && sectionsById.TryGetValue(session.SectionId, out var existingSection))
                {
                    section = existingSection;
                    section.Rename(new Title(session.Title));
                }
                else
                {
                    // Fallback: keep section that already owns one of the incoming lesson ids.
                    section = session.Lessons
                        .Where(l => l.Id > 0 && allExistingLessons.ContainsKey(l.Id))
                        .Select(l => allExistingLessons[l.Id].CourseSection)
                        .FirstOrDefault(s => s is not null)
                        ?? new CourseSection(new Title(session.Title), Id, []);
                    section.Rename(new Title(session.Title));
                }

                var reconciledLessons = new List<CourseLesson>();
                var lessonIndex = 0;
                foreach (var lessonItem in session.Lessons)
                {
                    CourseLesson lesson;
                    if (lessonItem.Id > 0 && allExistingLessons.TryGetValue(lessonItem.Id, out var existingLesson))
                    {
                        lesson = existingLesson;
                        lesson.Rename(new Title(lessonItem.Title));
                        lesson.SetSortOrder(lessonIndex);
                        keptLessonIds.Add(lesson.Id);
                    }
                    else
                    {
                        lesson = new CourseLesson(new Title(lessonItem.Title), lessonIndex);
                    }

                    var preserved = preservedVideos.FirstOrDefault(v =>
                        (lessonItem.Id > 0 && v.LessonId == lessonItem.Id) ||
                        (string.Equals(v.SectionTitle, session.Title, StringComparison.OrdinalIgnoreCase) &&
                         string.Equals(v.LessonTitle, lessonItem.Title, StringComparison.OrdinalIgnoreCase)) ||
                        (v.SectionIndex == sectionIndexNew && v.LessonIndex == lessonIndex));

                    ApplyLessonVideoOnReplace(lesson, lessonItem, preserved, isAdmin);

                    reconciledLessons.Add(lesson);
                    lessonIndex++;
                }

                var obsoleteLessons = section._courseLessons
                    .Where(l => !reconciledLessons.Contains(l))
                    .ToList();
                foreach (var obsolete in obsoleteLessons)
                    section.RemoveLesson(obsolete);

                foreach (var lesson in reconciledLessons)
                {
                    if (!section._courseLessons.Contains(lesson))
                        section.AddLesson(lesson);
                }

                keptSections.Add(section);
                sectionIndexNew++;
            }

            var obsoleteSections = _courseSessions.Where(s => !keptSections.Contains(s)).ToList();
            foreach (var obsolete in obsoleteSections)
                _courseSessions.Remove(obsolete);

            foreach (var section in keptSections)
            {
                if (!_courseSessions.Contains(section))
                    _courseSessions.Add(section);
            }
        }

        private static void ApplyLessonVideoOnReplace(
            CourseLesson lesson,
            CourseLessonReplaceItem lessonItem,
            PreservedLessonSnapshot? preserved,
            bool isAdmin)
        {
            var videoPath = lessonItem.VideoPath;
            var videoTitle = lessonItem.VideoTitle;
            var duration = lessonItem.DurationSeconds;

            if (string.IsNullOrWhiteSpace(videoPath) && lessonItem.KeepExistingVideo && !string.IsNullOrWhiteSpace(preserved?.VideoPath))
            {
                videoPath = preserved!.VideoPath;
                videoTitle = preserved.VideoTitle ?? lessonItem.Title;
                duration = preserved.DurationSeconds;
            }

            if (lessonItem.MediaAssetId is > 0)
            {
                lesson.SetEncryptedLessonVideo(
                    videoTitle ?? lessonItem.Title,
                    lessonItem.MediaAssetId.Value,
                    duration);
            }
            else if (preserved?.MediaAssetId is > 0 && lessonItem.KeepExistingVideo)
            {
                lesson.SetEncryptedLessonVideo(
                    preserved.VideoTitle ?? lessonItem.Title,
                    preserved.MediaAssetId.Value,
                    preserved.DurationSeconds);
            }
            else if (!string.IsNullOrWhiteSpace(videoPath))
            {
                lesson.SetLessonVideo(videoTitle ?? lessonItem.Title, videoPath, duration);
            }
            else if (!lessonItem.KeepExistingVideo)
            {
                lesson.ClearLessonVideo();
            }

            var isPublished = lessonItem.IsPublished ?? preserved?.IsPublished ?? false;
            lesson.SetPublished(isPublished, isPublished ? preserved?.PublishedAtUtc : null);

            var hasVideo = lesson.IsDesktopEncryptedLesson || !string.IsNullOrWhiteSpace(lesson.VideoPath?.Value);
            if (preserved != null && lessonItem.KeepExistingVideo && hasVideo)
            {
                if (isAdmin)
                {
                    lesson.ApplyVideoModerationOnSave(hasVideo, isPublished, isAdmin: true, videoChanged: false);
                }
                else
                {
                    lesson.RestoreVideoModerationState(
                        preserved.VideoModerationStatus,
                        preserved.VideoRejectionNote,
                        preserved.VideoSubmittedAtUtc);
                }
            }
            else
            {
                lesson.ApplyVideoModerationOnSave(hasVideo, isPublished, isAdmin, videoChanged: hasVideo);
            }
        }

        private sealed record PreservedLessonSnapshot(
            int SectionIndex,
            int LessonIndex,
            string SectionTitle,
            string LessonTitle,
            long LessonId,
            string? VideoTitle,
            string? VideoPath,
            long? MediaAssetId,
            int DurationSeconds,
            bool IsPublished,
            DateTime? PublishedAtUtc,
            TeacherApprovalStatus VideoModerationStatus,
            string? VideoRejectionNote,
            DateTime? VideoSubmittedAtUtc);

        public CourseLesson? FindLesson(long lessonId) =>
            _courseSessions.SelectMany(s => s._courseLessons).FirstOrDefault(l => l.Id == lessonId);

        public IReadOnlyList<CourseLesson> GetAllLessons() =>
            _courseSessions.SelectMany(s => s._courseLessons).OrderBy(s => s.SortOrder).ThenBy(s => s.Id).ToList();

        /// <summary>Section-major order (matches SessionsJson / form lesson list).</summary>
        public IReadOnlyList<CourseLesson> GetAllLessonsInSectionOrder() =>
            _courseSessions
                .SelectMany(s => s._courseLessons.OrderBy(l => l.SortOrder).ThenBy(l => l.Id))
                .ToList();

        public record CourseLessonReplaceItem(
            long Id,
            string Title,
            string? VideoTitle,
            string? VideoPath,
            int DurationSeconds,
            bool KeepExistingVideo,
            bool? IsPublished,
            long? MediaAssetId = null);

        public void ReplaceIntroVideo(string extension, string videoPath, TimeSpan duration)
        {
            _courseVideos.Clear();
            // Title must be a real label — never pass file extension (e.g. ".mp4") as Title.
            AddCourseVideo("intro", videoPath, duration);
        }

        public int GetCourseVideoCount()
        {
            return _courseVideos.Count();
        }

        public int GetSumVideoDurationTimeByMinute()
        {
            return _courseVideos.Sum(x => x.Duration.Minutes);
        }

        #endregion
    }
}
