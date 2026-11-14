using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.AddTeacher;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Commands
{
    public class AddTeacherCommandHandler(
        ArkaSoftwareCMPOutServices mafiaOuterServices,
        ITeacherCommandRepository teacherCommandRepository)
        : CommandHandler<AddTeacherCommand, string>(mafiaOuterServices)
    {
        public override async Task<CommandResult<string>> Handle(AddTeacherCommand command)
        {
            try
            {
                var teacher = Teacher.Create(command.UserId , command.LongDescription);
                await teacherCommandRepository.InsertAsync(teacher);
                await teacherCommandRepository.CommitAsync();
                return await ResultAsync("Teacher Added Success.", ApplicationServiceStatus.Ok);
            }
            catch (Exception)
            {
                return await ResultAsync("Teacher Not Added And Exception.", ApplicationServiceStatus.Exception);
            }
        }
    }
}
