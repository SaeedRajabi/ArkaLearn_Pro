using ArkaSoftwarePro.Src.Core.Contracts.Tags.TagRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.TagAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.Tags.Commands.ChangeTagName;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TagsServices.Commands
{
    public class UpdateTagNameCommandHandler : CommandHandler<UpdateTagName, string>
    {
        private readonly ITagCommandRepository _tagCommandRepository;
        public UpdateTagNameCommandHandler(ArkaSoftwareCMPOutServices mafiaOuterServices, ITagCommandRepository tagCommandRepository) : base(mafiaOuterServices)
        {
            _tagCommandRepository = tagCommandRepository;
        }

        public override async Task<CommandResult<string>> Handle(UpdateTagName command)
        {
            Tag tagExist = await _tagCommandRepository.GetAsync(command.TagId);
            if (tagExist is null)
                return await ResultAsync(
                    $"Tag With Id : {command.TagId} Is Not Found.",
                    Framework.Src.Core.RequestResponse.Common.ApplicationServiceStatus.NotFound
                    );

            tagExist.ChangeTagName(new Domain.TagAggregate.ValueOBJs.TagName(command.TagName));
            await _tagCommandRepository.CommitAsync();
            return await ResultAsync(
                $"Tag Is Change New Name : {command.TagName}.",
                Framework.Src.Core.RequestResponse.Common.ApplicationServiceStatus.Ok
                );
        }
    }
}
