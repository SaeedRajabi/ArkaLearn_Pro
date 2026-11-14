using ArkaSoftwarePro.Src.Core.Contracts.Exams.ExamRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.ExamAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.ExamAttemptAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Exams.Queries.GetCourseStudentsForExam;
using ArkaSoftwarePro.Src.Core.RequestResponse.Exams.Queries.GetExamById;
using ArkaSoftwarePro.Src.Core.RequestResponse.Exams.Queries.GetExamAttemptForGrading;
using ArkaSoftwarePro.Src.Core.RequestResponse.Exams.Queries.GetExamForTaking;
using ArkaSoftwarePro.Src.Core.RequestResponse.Exams.Queries.GetMyAssignedExams;
using ArkaSoftwarePro.Src.Core.RequestResponse.Exams.Queries.SearchTeacherExams;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Infrastructure.Data.MSSQL.Queries.QueryRepositories;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Repositories;

public class ExamQueryRepository(ArkaSoftwareQueryDbContext dbContext)
    : BaseQueryRepository<ArkaSoftwareQueryDbContext>(dbContext), IExamQueriesRepository
{
    public async Task<PagedData<SearchTeacherExamQri>> SearchTeacherExamsAsync(SearchTeacherExamsQuery query)
    {
        var teacherId = await GetTeacherIdByUserIdAsync(query.TeacherUserId);
        if (!teacherId.HasValue)
            return EmptyPage(query);

        var utcNow = DateTime.UtcNow;
        var q = from e in _dbContext.Exams.AsNoTracking()
                join c in _dbContext.Courses.AsNoTracking() on e.CourseId equals c.CourseId
                where e.TeacherId == teacherId.Value
                where !query.CourseId.HasValue || query.CourseId == 0 || e.CourseId == query.CourseId
                where string.IsNullOrWhiteSpace(query.InputValue) || e.Title.Contains(query.InputValue)
                orderby e.CreatedDateTime descending
                select new
                {
                    Exam = e,
                    CourseTitle = c.Title ?? "",
                    AssignedCount = _dbContext.ExamAssignments.Count(a => a.ExamId == e.Id),
                    SubmittedCount = _dbContext.ExamAttempts.Count(a =>
                        a.ExamId == e.Id && (a.Status == (byte)ExamAttemptStatus.Submitted || a.Status == (byte)ExamAttemptStatus.Abandoned)),
                    GradedCount = _dbContext.ExamAttempts.Count(a =>
                        a.ExamId == e.Id && a.Status == (byte)ExamAttemptStatus.Graded),
                };

        var result = new PagedData<SearchTeacherExamQri>();
        if (query.NeedTotalCount)
            result.TotalCount = await q.CountAsync();

        var rows = await q.Skip(query.SkipCount).Take(query.PageSize).ToListAsync();
        result.QueryResult = rows.Select(x => new SearchTeacherExamQri
        {
            Id = x.Exam.Id,
            Title = x.Exam.Title,
            CourseId = x.Exam.CourseId,
            CourseTitle = x.CourseTitle,
            Level = x.Exam.Level,
            EndsAtUtc = x.Exam.EndsAtUtc,
            DurationMinutes = x.Exam.DurationMinutes,
            Status = x.Exam.EndsAtUtc <= utcNow && x.Exam.Status == (byte)ExamStatus.Published
                ? (byte)ExamStatus.Closed
                : x.Exam.Status,
            TotalPoints = x.Exam.TotalPoints,
            AssignedCount = x.AssignedCount,
            SubmittedCount = x.SubmittedCount,
            GradedCount = x.GradedCount,
            CreatedAt = x.Exam.CreatedDateTime ?? DateTime.UtcNow,
        }).ToList();

        result.PageNumber = query.PageNumber;
        result.PageSize = query.PageSize;
        if (!query.NeedTotalCount)
            result.TotalCount = result.QueryResult.Count;
        return result;
    }

    public async Task<ExamDetailQri?> GetExamByIdAsync(long examId, long teacherId, bool includeCorrectAnswers)
    {
        var exam = await _dbContext.Exams
            .AsNoTracking()
            .Include(x => x.Questions)
                .ThenInclude(q => q.Options)
            .FirstOrDefaultAsync(x => x.Id == examId && x.TeacherId == teacherId);

        if (exam == null)
            return null;

        var course = await _dbContext.Courses.AsNoTracking()
            .FirstOrDefaultAsync(c => c.CourseId == exam.CourseId);

        var attempts = await GetExamAttemptSummariesAsync(examId, teacherId);

        return new ExamDetailQri
        {
            Id = exam.Id,
            Title = exam.Title,
            Description = exam.Description,
            CourseId = exam.CourseId,
            CourseTitle = course?.Title ?? "",
            Level = exam.Level,
            EndsAtUtc = exam.EndsAtUtc,
            DurationMinutes = exam.DurationMinutes,
            Status = exam.EndsAtUtc <= DateTime.UtcNow && exam.Status == (byte)ExamStatus.Published
                ? (byte)ExamStatus.Closed
                : exam.Status,
            TotalPoints = exam.TotalPoints,
            Questions = exam.Questions.OrderBy(q => q.OrderIndex).Select(q => new ExamQuestionQri
            {
                Id = q.Id,
                OrderIndex = q.OrderIndex,
                QuestionType = q.QuestionType,
                Prompt = q.Prompt,
                CodeSnippet = q.CodeSnippet,
                CodeLanguage = q.CodeLanguage,
                Points = q.Points,
                Options = q.Options.OrderBy(o => o.OrderIndex).Select(o => new ExamQuestionOptionQri
                {
                    Id = o.Id,
                    Text = o.Text,
                    IsCorrect = includeCorrectAnswers && o.IsCorrect,
                    OrderIndex = o.OrderIndex,
                }).ToList(),
            }).ToList(),
            Attempts = attempts,
        };
    }

    public async Task<List<ExamAttemptSummaryQri>> GetExamAttemptSummariesAsync(long examId, long teacherId)
    {
        var owned = await _dbContext.Exams.AsNoTracking()
            .AnyAsync(x => x.Id == examId && x.TeacherId == teacherId);
        if (!owned)
            return [];

        var attempts = await (
            from a in _dbContext.ExamAttempts.AsNoTracking()
            join s in _dbContext.Students.AsNoTracking() on a.StudentId equals s.StudentId
            join u in _dbContext.Users.AsNoTracking() on s.UserId equals u.Id
            where a.ExamId == examId
            orderby a.SubmittedAtUtc descending, a.StartedAtUtc descending
            select new ExamAttemptSummaryQri
            {
                AttemptId = a.Id,
                StudentId = a.StudentId,
                UserId = a.UserId,
                StudentName = ((u.FirstName ?? "") + " " + (u.LastName ?? "")).Trim(),
                Status = a.Status,
                StartedAtUtc = a.StartedAtUtc,
                SubmittedAtUtc = a.SubmittedAtUtc,
                AutoScore = a.AutoScore,
                FinalScore = a.FinalScore,
            }).ToListAsync();

        return attempts;
    }

    public async Task<List<AssignedExamQri>> GetMyAssignedExamsAsync(long userId)
    {
        var studentId = await GetStudentIdByUserIdAsync(userId);
        if (!studentId.HasValue)
            return [];

        var utcNow = DateTime.UtcNow;
        var list = await (
            from assign in _dbContext.ExamAssignments.AsNoTracking()
            join exam in _dbContext.Exams.AsNoTracking() on assign.ExamId equals exam.Id
            join course in _dbContext.Courses.AsNoTracking() on exam.CourseId equals course.CourseId
            join enroll in _dbContext.Enrollments.AsNoTracking()
                on new { assign.StudentId, exam.CourseId } equals new { enroll.StudentId, enroll.CourseId }
            where assign.UserId == userId && enroll.IsActive
            let attempt = _dbContext.ExamAttempts
                .Where(a => a.ExamId == exam.Id && a.StudentId == studentId.Value)
                .FirstOrDefault()
            orderby exam.EndsAtUtc descending
            select new AssignedExamQri
            {
                ExamId = exam.Id,
                AttemptId = attempt != null ? attempt.Id : null,
                Title = exam.Title,
                CourseTitle = course.Title ?? "",
                Level = exam.Level,
                EndsAtUtc = exam.EndsAtUtc,
                DurationMinutes = exam.DurationMinutes,
                TotalPoints = exam.TotalPoints,
                AttemptStatus = attempt != null ? attempt.Status : (byte)ExamAttemptStatus.Pending,
                FinalScore = attempt != null ? attempt.FinalScore : null,
                ExpiresAtUtc = attempt != null ? attempt.ExpiresAtUtc : null,
            }).ToListAsync();

        foreach (var item in list)
        {
            if (item.EndsAtUtc <= utcNow && item.AttemptStatus == (byte)ExamAttemptStatus.Pending)
                item.AttemptStatus = (byte)ExamAttemptStatus.Abandoned;
        }

        return list;
    }

    public async Task<ExamTakingQri?> GetExamForTakingAsync(long examId, long userId)
    {
        var studentId = await GetStudentIdByUserIdAsync(userId);
        if (!studentId.HasValue)
            return null;

        var assigned = await IsStudentAssignedAsync(examId, studentId.Value);
        if (!assigned)
            return null;

        var exam = await _dbContext.Exams.AsNoTracking()
            .Include(x => x.Questions)
                .ThenInclude(q => q.Options)
            .FirstOrDefaultAsync(x => x.Id == examId);

        if (exam == null)
            return null;

        var course = await _dbContext.Courses.AsNoTracking()
            .FirstOrDefaultAsync(c => c.CourseId == exam.CourseId);

        var attempt = await _dbContext.ExamAttempts.AsNoTracking()
            .Include(x => x.Answers)
            .FirstOrDefaultAsync(x => x.ExamId == examId && x.StudentId == studentId.Value);

        var utcNow = DateTime.UtcNow;
        var examEnded = exam.EndsAtUtc <= utcNow;

        // Pending with no attempt (or never started) after deadline: closed for taking.
        if (examEnded && (attempt == null || attempt.Status == (byte)ExamAttemptStatus.Pending))
            return null;

        var questions = exam.Questions.OrderBy(q => q.OrderIndex).Select(q => new ExamTakingQuestionQri
        {
            Id = q.Id,
            OrderIndex = q.OrderIndex,
            QuestionType = q.QuestionType,
            Prompt = q.Prompt,
            CodeSnippet = q.CodeSnippet,
            CodeLanguage = q.CodeLanguage,
            Points = q.Points,
            Options = q.Options.OrderBy(o => o.OrderIndex).Select(o => new ExamTakingOptionQri
            {
                Id = o.Id,
                Text = o.Text,
                OrderIndex = o.OrderIndex,
            }).ToList(),
        }).ToList();

        // Assigned but attempt row missing (legacy / partial create): still open for start before deadline.
        if (attempt == null)
        {
            return new ExamTakingQri
            {
                ExamId = exam.Id,
                AttemptId = 0,
                Title = exam.Title,
                CourseTitle = course?.Title ?? "",
                DurationMinutes = exam.DurationMinutes,
                EndsAtUtc = exam.EndsAtUtc,
                ExpiresAtUtc = null,
                AttemptStatus = (byte)ExamAttemptStatus.Pending,
                TotalPoints = exam.TotalPoints,
                FinalScore = null,
                ProfessorFeedback = null,
                AllowPaste = exam.AllowPaste,
                Questions = questions,
                Answers = [],
            };
        }

        return new ExamTakingQri
        {
            ExamId = exam.Id,
            AttemptId = attempt.Id,
            Title = exam.Title,
            CourseTitle = course?.Title ?? "",
            DurationMinutes = exam.DurationMinutes,
            EndsAtUtc = exam.EndsAtUtc,
            ExpiresAtUtc = attempt.ExpiresAtUtc,
            AttemptStatus = attempt.Status,
            TotalPoints = exam.TotalPoints,
            FinalScore = attempt.FinalScore,
            ProfessorFeedback = attempt.ProfessorFeedback,
            AllowPaste = exam.AllowPaste,
            Questions = questions,
            Answers = attempt.Answers.Select(a => new ExamTakingAnswerQri
            {
                QuestionId = a.ExamQuestionId,
                SelectedOptionIdsJson = a.SelectedOptionIdsJson,
                TextAnswer = a.TextAnswer,
                PasteCount = a.PasteCount,
                PointsAwarded = a.PointsAwarded,
            }).ToList(),
        };
    }

    public async Task<ExamAttemptGradingQri?> GetAttemptForGradingAsync(long attemptId, long teacherId)
    {
        var attempt = await _dbContext.ExamAttempts.AsNoTracking()
            .Include(x => x.Answers)
            .Include(x => x.Exam!)
                .ThenInclude(e => e!.Questions)
                    .ThenInclude(q => q.Options)
            .FirstOrDefaultAsync(x => x.Id == attemptId);

        if (attempt?.Exam == null || attempt.Exam.TeacherId != teacherId)
            return null;

        var student = await (
            from s in _dbContext.Students.AsNoTracking()
            join u in _dbContext.Users.AsNoTracking() on s.UserId equals u.Id
            where s.StudentId == attempt.StudentId
            select new { Name = ((u.FirstName ?? "") + " " + (u.LastName ?? "")).Trim() }
        ).FirstOrDefaultAsync();

        return new ExamAttemptGradingQri
        {
            AttemptId = attempt.Id,
            ExamId = attempt.ExamId,
            ExamTitle = attempt.Exam.Title,
            StudentName = student?.Name ?? "",
            Status = attempt.Status,
            TotalPoints = attempt.Exam.TotalPoints,
            AutoScore = attempt.AutoScore,
            FinalScore = attempt.FinalScore,
            ProfessorFeedback = attempt.ProfessorFeedback,
            StartedAtUtc = attempt.StartedAtUtc,
            SubmittedAtUtc = attempt.SubmittedAtUtc,
            AllowPaste = attempt.Exam.AllowPaste,
            Questions = attempt.Exam.Questions.OrderBy(q => q.OrderIndex).Select(q =>
            {
                var answer = attempt.Answers.FirstOrDefault(a => a.ExamQuestionId == q.Id);
                return new GradingQuestionQri
                {
                    QuestionId = q.Id,
                    OrderIndex = q.OrderIndex,
                    QuestionType = q.QuestionType,
                    Prompt = q.Prompt,
                    CodeSnippet = q.CodeSnippet,
                    CodeLanguage = q.CodeLanguage,
                    Points = q.Points,
                    Options = q.Options.OrderBy(o => o.OrderIndex).Select(o => new GradingQuestionOptionQri
                    {
                        Id = o.Id,
                        Text = o.Text,
                        IsCorrect = o.IsCorrect,
                        OrderIndex = o.OrderIndex,
                    }).ToList(),
                    SelectedOptionIdsJson = answer?.SelectedOptionIdsJson,
                    TextAnswer = answer?.TextAnswer,
                    PointsAwarded = answer?.PointsAwarded,
                    IsAutoGraded = answer?.IsAutoGraded,
                    PasteCount = answer?.PasteCount ?? 0,
                };
            }).ToList(),
        };
    }

    public async Task<List<CourseStudentForExamQri>> GetCourseStudentsAsync(long courseId, long teacherId)
    {
        var owned = await IsCourseOwnedByTeacherAsync(courseId, teacherId);
        if (!owned)
            return [];

        return await (
            from e in _dbContext.Enrollments.AsNoTracking()
            join s in _dbContext.Students.AsNoTracking() on e.StudentId equals s.StudentId
            join u in _dbContext.Users.AsNoTracking() on s.UserId equals u.Id
            where e.CourseId == courseId && e.IsActive
            orderby u.FirstName, u.LastName
            select new CourseStudentForExamQri
            {
                StudentId = s.StudentId,
                UserId = u.Id,
                FullName = ((u.FirstName ?? "") + " " + (u.LastName ?? "")).Trim(),
                UserName = u.UserName,
                Email = u.Email,
            }).ToListAsync();
    }

    public async Task<long?> GetStudentIdByUserIdAsync(long userId)
    {
        var student = await _dbContext.Students.AsNoTracking()
            .FirstOrDefaultAsync(s => s.UserId == userId);
        return student?.StudentId;
    }

    public async Task<long?> GetTeacherIdByUserIdAsync(long userId)
    {
        var teacher = await _dbContext.Teachers.AsNoTracking()
            .FirstOrDefaultAsync(t => t.UserId == userId);
        return teacher?.Id;
    }

    public async Task<bool> IsStudentAssignedAsync(long examId, long studentId)
    {
        return await _dbContext.ExamAssignments.AsNoTracking()
            .AnyAsync(x => x.ExamId == examId && x.StudentId == studentId);
    }

    public async Task<bool> IsCourseOwnedByTeacherAsync(long courseId, long teacherId)
    {
        return await _dbContext.Courses.AsNoTracking()
            .AnyAsync(c => c.CourseId == courseId && c.TeacherId == teacherId);
    }

    private static PagedData<SearchTeacherExamQri> EmptyPage(SearchTeacherExamsQuery query)
    {
        return new PagedData<SearchTeacherExamQri>
        {
            QueryResult = [],
            PageNumber = query.PageNumber,
            PageSize = query.PageSize,
            TotalCount = 0,
        };
    }
}
