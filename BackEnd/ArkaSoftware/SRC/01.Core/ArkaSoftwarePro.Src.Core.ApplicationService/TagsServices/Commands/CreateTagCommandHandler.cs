using ArkaSoftwarePro.Src.Core.Contracts.Tags.TagRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.TagAggregate.Entities;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Utilities.OutService.Services;
using ArkaSoftwarePro.Src.Core.Domain.TagAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Core.RequestResponse.Tags.Commands.AddTags;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TagsServices.Commands
{
    public class CreateTagCommandHandler : CommandHandler<AddTag, string>
    {
        private readonly ITagCommandRepository _tagCommandRepository;
        public CreateTagCommandHandler(ArkaSoftwareCMPOutServices mafiaOuterServices, ITagCommandRepository tagCommandRepository) : base(mafiaOuterServices)
        {
            _tagCommandRepository = tagCommandRepository;
        }

        public override async Task<CommandResult<string>> Handle(AddTag command)
        {

            Tag tag = new(new TagName(command.TagName));
            await _tagCommandRepository.InsertAsync(tag);
            await _tagCommandRepository.CommitAsync();
            return Ok($"Tag With Name :{command.TagName} Is Success Added.");
        }
    }
}
