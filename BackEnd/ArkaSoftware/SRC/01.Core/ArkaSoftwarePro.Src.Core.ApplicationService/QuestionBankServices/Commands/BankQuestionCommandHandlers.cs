using ArkaSoftwarePro.Src.Core.Contracts.Exams.QuestionBankRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.ExamAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.QuestionBankAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.QuestionBankAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.QuestionBank.Commands.ClassifyBankQuestion;
using ArkaSoftwarePro.Src.Core.RequestResponse.QuestionBank.Commands.CreateBankQuestion;
using ArkaSoftwarePro.Src.Core.RequestResponse.QuestionBank.Commands.DeleteBankQuestion;
using ArkaSoftwarePro.Src.Core.RequestResponse.QuestionBank.Commands.UpdateBankQuestion;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.QuestionBankServices.Commands;

public class CreateBankQuestionCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IBankQuestionCommandRepository bankQuestionCommandRepository,
    ITeacherQueryRepository teacherQueryRepository)
    : CommandHandler<CreateBankQuestion, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(CreateBankQuestion command)
    {
        if (command.OwnerUserId <= 0)
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);

        var teacherId = await teacherQueryRepository.GetTeacherIdByUserIdAsync(command.OwnerUserId);
        var options = command.Options
            .OrderBy(o => o.OrderIndex)
            .Select(o => (o.Text, o.IsCorrect));

        var hash = BankQuestion.ComputeContentHashFromDraft(
            (ExamQuestionType)command.QuestionType,
            command.Prompt,
            command.CodeSnippet,
            options);

        var existing = await bankQuestionCommandRepository.FindActiveByContentHashAsync(hash);
        if (existing != null)
            return await OkAsync(existing.Id.ToString());

        try
        {
            var bank = BankQuestion.Create(
                (ExamQuestionType)command.QuestionType,
                command.Prompt,
                command.DefaultPoints,
                command.OwnerUserId,
                teacherId,
                options,
                command.CodeSnippet,
                command.CodeLanguage,
                command.Category,
                command.Topic,
                command.Tags,
                command.CourseId,
                command.ManualDifficulty.HasValue
                    ? (QuestionDifficulty)command.ManualDifficulty.Value
                    : null);

            await bankQuestionCommandRepository.InsertAsync(bank);
            await bankQuestionCommandRepository.CommitAsync();
            return await OkAsync(bank.Id.ToString());
        }
        catch (Exception ex)
        {
            AddMessage(ex.Message);
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
        }
    }
}

public class UpdateBankQuestionCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IBankQuestionCommandRepository bankQuestionCommandRepository)
    : CommandHandler<UpdateBankQuestion, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(UpdateBankQuestion command)
    {
        var bank = await bankQuestionCommandRepository.GetByIdWithOptionsAsync(command.Id);
        if (bank == null || !bank.IsActive)
            return await ResultAsync(string.Empty, ApplicationServiceStatus.NotFound);

        if (!command.IsAdmin && bank.OwnerUserId != command.ActorUserId)
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);

        try
        {
            bank.Update(
                command.Prompt,
                command.DefaultPoints,
                command.Options.OrderBy(o => o.OrderIndex).Select(o => (o.Text, o.IsCorrect)),
                command.CodeSnippet,
                command.CodeLanguage,
                command.Category,
                command.Topic,
                command.Tags,
                command.CourseId,
                command.ManualDifficulty.HasValue
                    ? (QuestionDifficulty)command.ManualDifficulty.Value
                    : null);

            await bankQuestionCommandRepository.CommitAsync();
            return await OkAsync(bank.Id.ToString());
        }
        catch (Exception ex)
        {
            AddMessage(ex.Message);
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
        }
    }
}

public class DeleteBankQuestionCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IBankQuestionCommandRepository bankQuestionCommandRepository)
    : CommandHandler<DeleteBankQuestion, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(DeleteBankQuestion command)
    {
        var bank = await bankQuestionCommandRepository.GetByIdWithOptionsAsync(command.Id);
        if (bank == null || !bank.IsActive)
            return await ResultAsync(string.Empty, ApplicationServiceStatus.NotFound);

        if (!command.IsAdmin && bank.OwnerUserId != command.ActorUserId)
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);

        bank.Deactivate();
        await bankQuestionCommandRepository.CommitAsync();
        return await OkAsync(bank.Id.ToString());
    }
}

public class ClassifyBankQuestionCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IBankQuestionCommandRepository bankQuestionCommandRepository)
    : CommandHandler<ClassifyBankQuestion, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(ClassifyBankQuestion command)
    {
        var bank = await bankQuestionCommandRepository.GetByIdWithOptionsAsync(command.Id);
        if (bank == null || !bank.IsActive)
            return await ResultAsync(string.Empty, ApplicationServiceStatus.NotFound);

        if (!command.IsAdmin && bank.OwnerUserId != command.ActorUserId)
            return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);

        QuestionDifficulty? manual = command.ClearManualDifficulty
            ? null
            : command.ManualDifficulty.HasValue
                ? (QuestionDifficulty)command.ManualDifficulty.Value
                : bank.ManualDifficulty;

        bank.Classify(command.Category, command.Topic, command.Tags, manual);
        await bankQuestionCommandRepository.CommitAsync();
        return await OkAsync(bank.Id.ToString());
    }
}
