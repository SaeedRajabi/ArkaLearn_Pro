using ArkaSoftwarePro.Src.Core.Contracts.ContactUs.ContactUsRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.ContactUsAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.ContactUs.Commands.UpsertContactUs;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ContactUsServices.Commands
{
    public class UpsertContactUsCommandHandler(
        ArkaSoftwareCMPOutServices mafiaOuterServices,
        IContactUsCommandRepository contactUsCommandRepository)
        : CommandHandler<UpsertContactUsCommand, string>(mafiaOuterServices)
    {
        public override async Task<CommandResult<string>> Handle(UpsertContactUsCommand command)
        {
            var page = await contactUsCommandRepository.GetCurrentPageAsync();

            if (page is null)
            {
                page = new ContactUsPage(
                    command.PageTitle,
                    command.PageSubtitle,
                    command.HeroTitle,
                    command.HeroSubtitle,
                    command.HeadquartersTitle,
                    command.HeadquartersAddress,
                    command.HeadquartersPhone,
                    command.HeadquartersEmail,
                    command.ContactInfoTitle,
                    command.ContactInfoPhone,
                    command.ContactInfoEmail,
                    command.SalesSupportTitle,
                    command.SalesSupportPhone,
                    command.SalesSupportEmail,
                    command.FormTitle,
                    command.FormDescription,
                    command.MapEmbedUrl,
                    command.FacebookUrl,
                    command.TwitterUrl,
                    command.InstagramUrl,
                    command.LinkedInUrl);

                await contactUsCommandRepository.InsertAsync(page);
                await contactUsCommandRepository.CommitAsync();
                return await OkAsync("Contact us page created successfully.");
            }

            page.Update(
                command.PageTitle,
                command.PageSubtitle,
                command.HeroTitle,
                command.HeroSubtitle,
                command.HeadquartersTitle,
                command.HeadquartersAddress,
                command.HeadquartersPhone,
                command.HeadquartersEmail,
                command.ContactInfoTitle,
                command.ContactInfoPhone,
                command.ContactInfoEmail,
                command.SalesSupportTitle,
                command.SalesSupportPhone,
                command.SalesSupportEmail,
                command.FormTitle,
                command.FormDescription,
                command.MapEmbedUrl,
                command.FacebookUrl,
                command.TwitterUrl,
                command.InstagramUrl,
                command.LinkedInUrl);

            await contactUsCommandRepository.CommitAsync();
            return await OkAsync("Contact us page updated successfully.");
        }
    }
}
