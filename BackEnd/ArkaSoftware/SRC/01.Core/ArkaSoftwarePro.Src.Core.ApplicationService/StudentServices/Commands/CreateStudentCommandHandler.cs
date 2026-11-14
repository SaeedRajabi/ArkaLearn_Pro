using ArkaSoftwarePro.Src.Core.Contracts.Students.StudentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.StudentAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.Students.Commands.CreateStudents;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.StudentServices.Commands
{
    public class CreateStudentCommandHandler(
        ArkaSoftwareCMPOutServices mafiaOuterServices,
        IStudentCommandRepository studentCommandRepository
        )
        : CommandHandler<CreateStudentCommand, string>(mafiaOuterServices)
    {
        public override async Task<CommandResult<string>> Handle(CreateStudentCommand command)
        {
            try
            {
                var student = new Student(command.UserId);
                await studentCommandRepository.InsertAsync(student);
                await studentCommandRepository.CommitAsync();
                return await OkAsync("Student Is Register Success");
            }
            catch (Exception e)
            {
                return await ResultAsync("Student Register Has Error.", ApplicationServiceStatus.Exception);
            }
        }
    }
}
