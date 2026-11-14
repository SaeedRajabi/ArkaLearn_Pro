using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.Common;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Events;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Entities;
using Framework.Src.Core.Domain.Aggregates;
using Framework.Src.Core.Domain.Exceptions;
using Framework.Src.Core.Domain.ValueOBJs;

namespace ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities
{
    /// <summary>
    /// شناخته میشود و با کاربر ارتباط دارد AggregateRoot موجودیت استاد که به عنوان 
    /// </summary>
    public class Teacher:AggregateRoot
    {
        #region Properties

        /// <summary>
        /// توضیحات تکمیلی و معرفی کلی استاد
        /// </summary>
        public LongDescription? LongDescription { get; private set; }

        /// <summary>
        /// معرفی کوتاه استاد برای کارت‌ها و لیست‌ها
        /// </summary>
        public string? ShortDescription { get; private set; }

        /// <summary>
        /// تصویر هدر پروفایل عمومی
        /// </summary>
        public string? HeaderImageUrl { get; private set; }

        public long? TeachingCategoryId { get; private set; }
        public TeacherTeachingCategory? TeachingCategory { get; private set; }

        public TeacherAdvertisingPlan AdvertisingPlan { get; private set; } = TeacherAdvertisingPlan.Free;
        public int ExperiencePoints { get; private set; }
        public int XpFreeMonthsRedeemed { get; private set; }
        public DateTime? XpFreePlanUntilUtc { get; private set; }
        public TeacherApprovalStatus ProfileApprovalStatus { get; private set; } = TeacherApprovalStatus.Draft;
        public string? ProfileRejectionNote { get; private set; }
        public DateTime? SubmittedAtUtc { get; private set; }
        public DateTime? ApprovedAtUtc { get; private set; }
        public TeacherAccountStatus AccountStatus { get; private set; } = TeacherAccountStatus.Active;
        public string? AccountStatusNote { get; private set; }
        public DateTime? AccountStatusChangedAtUtc { get; private set; }
        public string? ProfileApprovedSnapshotJson { get; private set; }
        public string? PayoutSheba { get; private set; }
        public string? PayoutCardNumber { get; private set; }
        public string? ZarinPalBankAccountId { get; private set; }
        public string? ZibalSubMerchantId { get; private set; }

        #endregion

        #region References Properties

        /// <summary>
        /// Identity Context ارتباط با هویت کاربری یا 
        /// موارد و مشخصات فردی رو از اینجا میگیره
        /// </summary>
        public long? UserId { get; private set; }
        public User? User { get; private set; }

        /// <summary>
        /// هر استاد میتونه چندین دوره آموزشی داشته باشه
        /// </summary>
        private readonly List<Course> _courses = new();
        public IEnumerable<Course> Courses => _courses.AsReadOnly();


        /// <summary>
        /// هر استاد میتونه چندین مدرک دانشگاهی داشته باشه
        /// </summary>
        private readonly List<TeacherEducation> _teacherEducations = new();
        public IEnumerable<TeacherEducation> TeacherEducations => _teacherEducations.AsReadOnly();


        /// <summary>
        /// هر استاد میتونه چندین مهارت در حوضه های تخصصی مختلف را داشته باشه
        /// </summary>
        private readonly List<TeacherExpertiseArea> _teacherExpertiseAreas = new();
        public IEnumerable<TeacherExpertiseArea> TeacherExpertiseAreas => _teacherExpertiseAreas.AsReadOnly();

        private readonly List<TeacherPromotionalVideo> _promotionalVideos = new();
        public IEnumerable<TeacherPromotionalVideo> PromotionalVideos => _promotionalVideos.AsReadOnly();

        private readonly List<TeacherBook> _books = new();
        public IEnumerable<TeacherBook> Books => _books.AsReadOnly();

        private readonly List<TeacherPortfolioArticle> _portfolioArticles = new();
        public IEnumerable<TeacherPortfolioArticle> PortfolioArticles => _portfolioArticles.AsReadOnly();

        public TeacherAdvertisement? Advertisement { get; private set; }
        public TeacherResume? Resume { get; private set; }
        #endregion

        #region CTORs

        private Teacher(long userId , LongDescription longDescription)
        {
            UserId = userId;
            LongDescription = longDescription;
            HeaderImageUrl = DashboardProfileDefaults.HeaderImageUrl;
            AddEvent(new TeacherAdded(userId , longDescription.Value!));
        }

        private Teacher()
        {
            
        }

        #endregion

        #region Methods

        public static Teacher Create(long userId,  string longDescription = "")
            => new Teacher(userId, new LongDescription(longDescription));


        public void AddCourses(Course course)
        {
            bool isExist = _courses.Any(x => x.Title! == course.Title! && x.BusinessId == course.BusinessId);
            if (isExist)
                throw new InvalidEntityStateException("Course Is Exist Fot This Teacher.", nameof(AddCourses));
            _courses.Add(course);
            AddEvent(new CourseAdded(course.Id));
        }

        public void AddTeacherExpertiseArea(string expertiseName, int rate)
        {
            var normalized = expertiseName.Trim();
            bool isExist = _teacherExpertiseAreas.Any(x =>
                string.Equals(x.Name!.Value, normalized, StringComparison.OrdinalIgnoreCase));
            if (isExist)
                throw new InvalidEntityStateException("Expertise Is Exist.", nameof(AddTeacherExpertiseArea));
            _teacherExpertiseAreas.Add(TeacherExpertiseArea.Create(normalized, rate));
            AddEvent(new ExpertiseAdded(normalized, rate));
        }

        public void AddTeacherEducation(string nameOfInstitutionOrUniversity, TeacherDegreeTypes typeOfDegree, Image degreeImage)
        {
            var isExist = _teacherEducations.Any(x =>
                string.Equals(x.NameOfInstitutionOrUniversity!.Value, nameOfInstitutionOrUniversity, StringComparison.OrdinalIgnoreCase)
                && x.TypeOfDegree == typeOfDegree);
            if (isExist)
                throw new InvalidEntityStateException("Teacher Education Is Exist.", nameof(AddTeacherEducation));
            _teacherEducations.Add(TeacherEducation.Create(nameOfInstitutionOrUniversity, typeOfDegree , degreeImage));
            AddEvent(new TeacherEducationAdded(nameOfInstitutionOrUniversity, typeOfDegree));
        }

        public void UpdateLongDescription(string? longDescription)
        {
            LongDescription = new LongDescription(longDescription ?? string.Empty);
        }

        public void ReplaceTeacherEducations(IReadOnlyList<(string University, TeacherDegreeTypes DegreeType, string DegreeImage)> items)
        {
            _teacherEducations.Clear();
            var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (var item in items)
            {
                if (string.IsNullOrWhiteSpace(item.University))
                    continue;

                var university = item.University.Trim();
                var key = $"{university}|{item.DegreeType}";
                if (!seen.Add(key))
                    throw new InvalidEntityStateException("Teacher Education Is Exist.", nameof(ReplaceTeacherEducations));

                var imagePath = string.IsNullOrWhiteSpace(item.DegreeImage)
                    ? "/icons/certificate-default-image.png"
                    : item.DegreeImage.Trim();
                _teacherEducations.Add(TeacherEducation.Create(university, item.DegreeType, new Image(imagePath)));
            }
        }

        public void ReplaceExpertiseAreas(IReadOnlyList<(string Name, int Rate)> items)
        {
            _teacherExpertiseAreas.Clear();
            var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (var item in items)
            {
                if (string.IsNullOrWhiteSpace(item.Name))
                    continue;

                var name = item.Name.Trim();
                if (!seen.Add(name))
                    continue;

                var rate = Math.Clamp(item.Rate, 0, 100);
                _teacherExpertiseAreas.Add(TeacherExpertiseArea.Create(name, rate));
            }
        }

        public void UpdateMarketplaceProfile(string? shortDescription, string? longDescription, string? headerImageUrl, long? teachingCategoryId)
        {
            ShortDescription = shortDescription?.Trim();
            LongDescription = new LongDescription(longDescription ?? string.Empty);
            HeaderImageUrl = string.IsNullOrWhiteSpace(headerImageUrl) ? null : headerImageUrl.Trim();
            TeachingCategoryId = teachingCategoryId is > 0 ? teachingCategoryId : null;
        }

        public void ReplacePromotionalVideos(IReadOnlyList<(string Title, string VideoUrl, string? ThumbnailUrl, int SortOrder)> items)
        {
            _promotionalVideos.Clear();
            foreach (var item in items.Where(i => !string.IsNullOrWhiteSpace(i.Title) && !string.IsNullOrWhiteSpace(i.VideoUrl)))
            {
                _promotionalVideos.Add(TeacherPromotionalVideo.Create(item.Title, item.VideoUrl, item.ThumbnailUrl, item.SortOrder));
            }
        }

        public TeacherPromotionalVideo AddPromotionalVideo(
            string title,
            string videoUrl,
            string? thumbnailUrl,
            int sortOrder,
            TeacherApprovalStatus approvalStatus)
        {
            var video = TeacherPromotionalVideo.Create(title, videoUrl, thumbnailUrl, sortOrder);
            video.SetApprovalStatus(approvalStatus);
            _promotionalVideos.Add(video);
            return video;
        }

        public TeacherPromotionalVideo UpdatePromotionalVideo(
            long videoId,
            string title,
            string videoUrl,
            string? thumbnailUrl,
            int sortOrder,
            TeacherApprovalStatus approvalStatus)
        {
            var video = _promotionalVideos.FirstOrDefault(v => v.Id == videoId)
                ?? throw new InvalidEntityStateException($"Promotional video {videoId} was not found.", nameof(videoId));
            video.Update(title, videoUrl, thumbnailUrl, sortOrder);
            video.SetApprovalStatus(approvalStatus);
            return video;
        }

        public void RemovePromotionalVideo(long videoId)
        {
            var video = _promotionalVideos.FirstOrDefault(v => v.Id == videoId);
            if (video != null)
                _promotionalVideos.Remove(video);
        }

        public void ReplaceBooks(IReadOnlyList<(string Title, string Description, string? CoverImageUrl, int SortOrder)> items)
        {
            _books.Clear();
            foreach (var item in items.Where(i => !string.IsNullOrWhiteSpace(i.Title)))
            {
                _books.Add(TeacherBook.Create(
                    item.Title,
                    item.Description ?? string.Empty,
                    string.Empty,
                    item.CoverImageUrl,
                    null,
                    null,
                    null,
                    null,
                    Array.Empty<string>(),
                    item.SortOrder));
            }
        }

        public TeacherBook AddBook(
            string title,
            string shortDescription,
            string longDescriptionHtml,
            string? coverImageUrl,
            TeacherBookFormatFiles? formatFiles,
            string? publisher,
            int? publicationYear,
            string? isbn,
            IReadOnlyList<string> tags,
            int sortOrder,
            TeacherApprovalStatus approvalStatus,
            long? categoryId = null)
        {
            var book = TeacherBook.Create(
                title,
                shortDescription,
                longDescriptionHtml,
                coverImageUrl,
                formatFiles,
                publisher,
                publicationYear,
                isbn,
                tags,
                sortOrder,
                categoryId);
            book.SetApprovalStatus(approvalStatus);
            _books.Add(book);
            return book;
        }

        public TeacherBook UpdateBook(
            long bookId,
            string title,
            string shortDescription,
            string longDescriptionHtml,
            string? coverImageUrl,
            TeacherBookFormatFiles? formatFiles,
            string? publisher,
            int? publicationYear,
            string? isbn,
            IReadOnlyList<string> tags,
            int sortOrder,
            TeacherApprovalStatus approvalStatus,
            long? categoryId = null)
        {
            var book = _books.FirstOrDefault(b => b.Id == bookId)
                ?? throw new InvalidEntityStateException($"Book {bookId} was not found.", nameof(bookId));
            book.Update(title, shortDescription, longDescriptionHtml, coverImageUrl, formatFiles, publisher, publicationYear, isbn, tags, sortOrder, categoryId);
            book.SetApprovalStatus(approvalStatus);
            return book;
        }

        public void RemoveBook(long bookId)
        {
            var book = _books.FirstOrDefault(b => b.Id == bookId);
            if (book != null)
                _books.Remove(book);
        }

        public void ReplacePortfolioArticles(IReadOnlyList<(string Title, string Summary, string Content, int SortOrder)> items)
        {
            _portfolioArticles.Clear();
            foreach (var item in items.Where(i => !string.IsNullOrWhiteSpace(i.Title)))
            {
                var article = TeacherPortfolioArticle.Create(item.Title, item.Summary ?? string.Empty, item.Content ?? string.Empty, item.SortOrder);
                article.SetApprovalStatus(TeacherApprovalStatus.Pending);
                _portfolioArticles.Add(article);
            }
        }

        public void SetAdvertisingPlan(TeacherAdvertisingPlan plan) => AdvertisingPlan = plan;

        public void AddExperiencePoints(int amount)
        {
            if (amount <= 0) return;
            ExperiencePoints += amount;
        }

        public void RedeemXpFreeMonth(int xpCost)
        {
            if (xpCost <= 0 || ExperiencePoints < xpCost)
                throw new InvalidEntityStateException("Not enough XP to redeem a free month.", nameof(ExperiencePoints));

            ExperiencePoints -= xpCost;
            XpFreeMonthsRedeemed++;
            var now = DateTime.UtcNow;
            var baseDate = XpFreePlanUntilUtc.HasValue && XpFreePlanUntilUtc.Value > now
                ? XpFreePlanUntilUtc.Value
                : now;
            XpFreePlanUntilUtc = baseDate.AddMonths(1);
            AdvertisingPlan = TeacherAdvertisingPlan.Paid;
        }

        public int GetXpThresholdForNextFreeMonth(int firstMonthThreshold, int incrementPerMonth) =>
            firstMonthThreshold + XpFreeMonthsRedeemed * incrementPerMonth;

        public bool HasXpFreePlanActive(DateTime utcNow) =>
            XpFreePlanUntilUtc.HasValue && XpFreePlanUntilUtc.Value > utcNow;

        public void SubmitProfileForReview()
        {
            ProfileApprovalStatus = TeacherApprovalStatus.Pending;
            ProfileRejectionNote = null;
            SubmittedAtUtc = DateTime.UtcNow;
        }

        public void ReviewProfile(TeacherApprovalStatus status, string? rejectionNote)
        {
            if (status is not (TeacherApprovalStatus.Approved or TeacherApprovalStatus.Rejected))
                throw new InvalidEntityStateException("Review status must be approved or rejected.", nameof(ReviewProfile));

            ProfileApprovalStatus = status;
            ProfileRejectionNote = status == TeacherApprovalStatus.Rejected ? rejectionNote?.Trim() : null;
            ApprovedAtUtc = status == TeacherApprovalStatus.Approved ? DateTime.UtcNow : null;
        }

        public void SetProfileApprovedSnapshot(string snapshotJson) =>
            ProfileApprovedSnapshotJson = snapshotJson;

        public void SetAccountStatus(TeacherAccountStatus status, string? note)
        {
            if (status == TeacherAccountStatus.Terminated && string.IsNullOrWhiteSpace(note))
                throw new InvalidEntityStateException("Termination requires an explanation.", nameof(note));

            AccountStatus = status;
            AccountStatusNote = status == TeacherAccountStatus.Active ? null : note?.Trim();
            AccountStatusChangedAtUtc = DateTime.UtcNow;

            if (status != TeacherAccountStatus.Active && Advertisement != null)
                Advertisement.SetApprovalStatus(TeacherApprovalStatus.Rejected, AccountStatusNote);
        }

        public bool CanManageContent() => AccountStatus == TeacherAccountStatus.Active;

        public bool CanPublishBooksAndArticles(DateTime utcNow, bool hasActivePaidSubscription) =>
            hasActivePaidSubscription || HasXpFreePlanActive(utcNow) || AdvertisingPlan == TeacherAdvertisingPlan.Paid;

        public bool CanShowContactPublicly(DateTime utcNow, bool hasActivePaidSubscription) =>
            hasActivePaidSubscription || HasXpFreePlanActive(utcNow) || AdvertisingPlan == TeacherAdvertisingPlan.Paid;

        /// <summary>Legacy helpers — prefer overloads with subscription check.</summary>
        public bool CanPublishBooksAndArticles() => AdvertisingPlan == TeacherAdvertisingPlan.Paid;

        public bool CanShowContactPublicly() => AdvertisingPlan == TeacherAdvertisingPlan.Paid;

        public void UpsertAdvertisement(
            string title,
            decimal? privateTeachingCost,
            decimal? hourlyTeachingCost,
            string? workExperience,
            string descriptionHtml,
            string? websiteUrl,
            string? websiteTitle,
            string? contactPhone,
            string? baleLink,
            string? telegramLink,
            string? whatsAppLink,
            string? gitHubLink,
            string? linkedInLink,
            IReadOnlyList<string> tags,
            bool infoAccuracyConfirmed,
            bool termsAccepted)
        {
            if (Advertisement is null)
            {
                Advertisement = TeacherAdvertisement.Create(
                    title,
                    privateTeachingCost,
                    hourlyTeachingCost,
                    workExperience,
                    descriptionHtml,
                    websiteUrl,
                    websiteTitle,
                    contactPhone,
                    baleLink,
                    telegramLink,
                    whatsAppLink,
                    gitHubLink,
                    linkedInLink,
                    tags,
                    infoAccuracyConfirmed,
                    termsAccepted,
                    isPublic: false);
                Advertisement.SubmitForReview();
                return;
            }

            Advertisement.Update(
                title,
                privateTeachingCost,
                hourlyTeachingCost,
                workExperience,
                descriptionHtml,
                websiteUrl,
                websiteTitle,
                contactPhone,
                baleLink,
                telegramLink,
                whatsAppLink,
                gitHubLink,
                linkedInLink,
                tags,
                infoAccuracyConfirmed,
                termsAccepted,
                isPublic: false);
            Advertisement.SubmitForReview();
        }

        public void UpsertResume(string title, string description, string pdfFileUrl, string? pdfFileName)
        {
            if (string.IsNullOrWhiteSpace(pdfFileUrl))
                throw new InvalidEntityStateException("Resume PDF is required.", nameof(pdfFileUrl));

            if (Resume is null)
            {
                Resume = TeacherResume.Create(title, description, pdfFileUrl, pdfFileName);
                Resume.SubmitForReview();
                return;
            }

            Resume.Update(title, description, pdfFileUrl, pdfFileName);
            Resume.SubmitForReview();
        }

        public void UpdatePayoutBankInfo(string sheba, string cardNumber)
        {
            var normalizedSheba = NormalizeSheba(sheba);
            var normalizedCard = NormalizeCardNumber(cardNumber);
            if (string.IsNullOrWhiteSpace(normalizedSheba))
                throw new InvalidEntityStateException("Sheba (IBAN) is required.", nameof(sheba));
            if (string.IsNullOrWhiteSpace(normalizedCard))
                throw new InvalidEntityStateException("Card number is required.", nameof(cardNumber));

            PayoutSheba = normalizedSheba;
            PayoutCardNumber = normalizedCard;
        }

        public bool HasCompletePayoutBankInfo()
            => !string.IsNullOrWhiteSpace(PayoutSheba) && !string.IsNullOrWhiteSpace(PayoutCardNumber);

        public void SetZarinPalBankAccountId(string? bankAccountId)
        {
            ZarinPalBankAccountId = string.IsNullOrWhiteSpace(bankAccountId) ? null : bankAccountId.Trim();
        }

        public void SetZibalSubMerchantId(string? subMerchantId)
        {
            ZibalSubMerchantId = string.IsNullOrWhiteSpace(subMerchantId) ? null : subMerchantId.Trim();
        }

        private static string? NormalizeSheba(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return null;
            var compact = value.Trim().ToUpperInvariant().Replace(" ", string.Empty);
            if (compact.StartsWith("IR", StringComparison.Ordinal))
                compact = compact[2..];
            var digits = new string(compact.Where(char.IsDigit).ToArray());
            return digits.Length == 24 ? "IR" + digits : null;
        }

        private static string? NormalizeCardNumber(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return null;
            var digits = new string(value.Where(char.IsDigit).ToArray());
            return digits.Length == 16 ? digits : null;
        }

        #endregion
    }

}
