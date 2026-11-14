using ArkaSoftwarePro.Src.Core.Contracts.Email;
using ArkaSoftwarePro.Src.Core.Contracts.Rooms.RoomRepositoriesContract.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Seminars.SeminarRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.SeminarAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Commands.UpdateSeminarStatus;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SeminarsServices.Commands
{
    public class UpdateSeminarStatusCommandHandler(
        ArkaSoftwareCMPOutServices mafiaOuterServices,
        ISeminarCommandRepository seminarCommandRepository,
        IRoomCommandRepository roomCommandRepository,
        ITeacherCommandRepository teacherCommandRepository,
        INewsletterPublishNotifier newsletterPublishNotifier)
        : CommandHandler<UpdateSeminarStatus, string>(mafiaOuterServices)
    {
        public override async Task<CommandResult<string>> Handle(UpdateSeminarStatus command)
        {
            var seminar = await seminarCommandRepository.GetAsync(command.Id);
            if (seminar == null)
                return await ResultAsync("Seminar not found.", ApplicationServiceStatus.NotFound);

            var previousStatus = seminar.Status;
            seminar.SetStatus((SeminarStatus)command.Status);
            if (command.IsPublic.HasValue)
                seminar.SetIsPublic(command.IsPublic.Value);

            await seminarCommandRepository.CommitAsync();

            var becamePublished =
                previousStatus != SeminarStatus.Published &&
                seminar.Status == SeminarStatus.Published;

            if (becamePublished && seminar.RoomId is > 0)
            {
                var room = await roomCommandRepository.GetAsync(seminar.RoomId.Value);
                var teacherUserId = room?.UserId ?? 0;
                long? teacherId = null;
                string? teacherName = null;
                if (teacherUserId > 0)
                {
                    var teacher = await teacherCommandRepository.GetByUserIdWithDetailsAsync(teacherUserId);
                    teacherId = teacher?.Id;
                    if (teacher?.User != null)
                    {
                        teacherName =
                            $"{teacher.User.UserFullName?.FirstName} {teacher.User.UserFullName?.LastName}".Trim();
                    }
                }

                var title = seminar.Title?.Value ?? string.Empty;
                var url = $"/seminars/{seminar.Id}";
                await newsletterPublishNotifier.NotifyContentPublishedAsync(
                    NewsletterContentKind.Seminar,
                    title,
                    url,
                    teacherId,
                    teacherUserId > 0 ? teacherUserId : null,
                    teacherName);
            }

            return await OkAsync("Seminar status updated.");
        }
    }
}
