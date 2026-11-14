using ArkaSoftwarePro.Src.Core.Contracts.Courses.CourseRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.AddCourseSections;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CoursesServices.Commands
{
    public class AddCourseSectionCommandHandler : CommandHandler<AddCourseSection, string>
    {
        private readonly ICourseCommandRepository _courseCommandRepository;
        public AddCourseSectionCommandHandler(ArkaSoftwareCMPOutServices mafiaOuterServices, ICourseCommandRepository courseCommandRepository) : base(mafiaOuterServices)
        {
            _courseCommandRepository = courseCommandRepository;
        }

        public override async Task<CommandResult<string>> Handle(AddCourseSection command)
        {
            try
            {
                var courseResult = await _courseCommandRepository.GetAsync(command.CourseId);
                if (courseResult is null)
                    return await ResultAsync($"Course With Id : {command.CourseId} Is Not Defind.", Framework.Src.Core.RequestResponse.Common.ApplicationServiceStatus.NotFound);
                var result = command.LessonTitles.Select(x => new CourseLesson(x)).ToList();
                courseResult.AddCourseSession(command.SectionTitle, result);
                await _courseCommandRepository.CommitAsync();
                return Ok("Course Section Added Success.");
            }
            catch (Exception ex)
            {
                return await ResultAsync(ex.Message, Framework.Src.Core.RequestResponse.Common.ApplicationServiceStatus.Exception);
            }
        }
    }
}
