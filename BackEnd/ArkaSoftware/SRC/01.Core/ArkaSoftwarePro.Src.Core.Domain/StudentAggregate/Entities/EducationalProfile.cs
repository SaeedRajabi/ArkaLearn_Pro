using Framework.Src.Core.Domain.Entities;
using Framework.Src.Core.Domain.Exceptions;

namespace ArkaSoftwarePro.Src.Core.Domain.StudentAggregate.Entities
{
    /// <summary>
    /// Entity: EducationalProfile // شامل سوابق و وضعیت آموزشی
    /// </summary>
    public class EducationalProfile:Entity
    {
        #region References Properties
        /// <summary>
        /// لیست ثبت نام های فعال
        /// </summary>
        public IReadOnlyList<Guid> ActiveEnrollments => _activeEnrollments.AsReadOnly();
        private readonly List<Guid> _activeEnrollments = new();


        /// <summary>
        /// لیست دوره های تکمیل شده
        /// </summary>
        public IEnumerable<Guid> CompletedCourses => _completedCourses.AsReadOnly();
        private readonly List<Guid> _completedCourses = new();

        #endregion

        #region CTORs

        /// <summary>
        /// متد سازنده بدون پارامتر
        /// </summary>
        public EducationalProfile()
        {
            // Initializations if required
        }
        #endregion

        #region Methods

        /// <summary>
        /// این متد دوره های تکمیل شده را ثبت میکند
        /// </summary>
        /// <param name="courseId">شناسه دوره ای را که کامل شده به عنوان ورودی دریافت میکند </param>
        /// <exception cref="InvalidEntityStateException">پرتاب خطا در حالتی که دوره موجود باشه و کامل نشده باشه و بخواییم دوباره اضافش کنیم</exception>
        public void AddCompletedCourse(Guid courseId)
        {
            if (_completedCourses.Any(c => c == courseId))
                throw new InvalidEntityStateException("This course is already marked as completed." , nameof(AddCompletedCourse));

            _completedCourses.Add(courseId);
        }



        /// <summary>
        /// این متد دوره های رو که دانشجو ثبت نام کرده و هنوز فعال هستند رو ذخیره میکند 
        /// </summary>
        /// <param name="enrollmentId">شناسه ثبت نام ای رو که فعال هست به عنوان ورودی دریافت میکند</param>
        /// <exception cref="InvalidEntityStateException">پرتاب خطا در شرایطی که دوره جزو لیست دوره های فعال باشه</exception>
        public void AddActiveEnrollment(Guid enrollmentId)
        {
            if (_activeEnrollments.Any(e => e == enrollmentId))
                throw new InvalidEntityStateException("Already enrolled in this course." , nameof(AddActiveEnrollment));

            _activeEnrollments.Add(enrollmentId);
        }



        /// <summary>
        /// حذف و غیر فعال کردن دوره هایی که به عنوان فعال ثبت نام شده اند
        /// </summary>
        /// <param name="enrollmentId">به عنوان ورودی شناسه ثبت نام رو میگیره</param>
        public void RemoveActiveEnrollment(Guid enrollmentId)
        {
            var enrollment = _activeEnrollments.FirstOrDefault(e => e == enrollmentId);
            if (!string.IsNullOrEmpty(enrollment.ToString()))
            {
                _activeEnrollments.Remove(enrollment);
            }
        }
        #endregion
    }


}
