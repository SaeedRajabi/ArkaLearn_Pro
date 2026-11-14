using ArkaSoftwarePro.Src.Core.Domain.OrderAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.Common;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Entities;
using Framework.Src.Core.Domain.Aggregates;

namespace ArkaSoftwarePro.Src.Core.Domain.StudentAggregate.Entities
{
    public class Student:AggregateRoot
    {
        #region References Properties
        /// <summary>
        /// Child Entities
        /// وضعیت آموزشی و مالی
        /// </summary>
        public EducationalProfile? EducationalProfile { get; private set; }


        /// <summary>
        /// (Identity Context) ارتباط با هویت کاربری یا 
        /// </summary>
        public long UserId { get; private set; }
        public User User { get; private set; }


        // References to other Aggregates (by IDs)
        private readonly List<Guid> _enrollmentIds = new();
        private readonly List<Guid> _classScheduleIds = new();

        public IEnumerable<Guid> EnrollmentIds => _enrollmentIds.AsReadOnly();
        public IEnumerable<Guid> ClassScheduleIds => _classScheduleIds.AsReadOnly();

        private readonly List<Order> _orders = new();
        public IReadOnlyList<Order> Orders => _orders.AsReadOnly();

        /// <summary>
        /// تصویر سربرگ داشبورد دانشجو
        /// </summary>
        public string? HeaderImageUrl { get; private set; }

        #endregion


        #region CTORs
        /// <summary>
        /// متد سازنده برای ساخت یک دانشجو
        /// </summary>
        /// <param name="userId">به عنوان ورودی شناسه کاربر که قبلا ثبت نام کرده و احراض هویت شده رو دریافت میکنه</param>
        public Student(long userId)
        {
            UserId = userId;
            HeaderImageUrl = DashboardProfileDefaults.HeaderImageUrl;

            // Entities مقدار دهی اولیه فرزنهای 
            EducationalProfile = new EducationalProfile();
        }

        /// <summary>
        /// Entity Framework Core متد سازنده بدون پارامتر و مورد نیاز برای 
        /// </summary>
        public Student()
        {
            
        }
        #endregion


        public void CompleteCourse(Guid courseId)
        {
            EducationalProfile!.AddCompletedCourse(courseId);
        }
        // Methods to manage Enrollments & Schedules
        public void AddActiveEnrollment(Guid enrollmentId)
        {
            EducationalProfile!.AddActiveEnrollment(enrollmentId);
        }
        public void AddClassSchedule(Guid classScheduleId)
        {
            _classScheduleIds.Add(classScheduleId);
        }

        public void UpdateHeaderImageUrl(string? headerImageUrl)
        {
            HeaderImageUrl = string.IsNullOrWhiteSpace(headerImageUrl) ? null : headerImageUrl.Trim();
        }

    }
}
