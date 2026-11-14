using ArkaSoftwarePro.Src.Core.Contracts.AboutUs.AboutUsRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.AboutUsAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.AboutUs.Commands.UpsertAboutUs;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Utilities.OutService.Extensions;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.AboutUsServices.Commands
{
    public class UpsertAboutUsCommandHandler(
        ArkaSoftwareCMPOutServices mafiaOuterServices,
        IAboutUsCommandRepository aboutUsCommandRepository,
        ArkaSoftwarePro.Src.Core.ApplicationService.FileStorage.FileStoragePathSaver fileStoragePathSaver)
        : CommandHandler<UpsertAboutUsCommand, string>(mafiaOuterServices)
    {
        public override async Task<CommandResult<string>> Handle(UpsertAboutUsCommand command)
        {
            var page = await aboutUsCommandRepository.GetCurrentPageAsync();

            var heroImageUrl = await ResolveImageAsync(command.HeroImageFile, command.HeroImageUrl, page?.HeroImageUrl);
            var teamImageUrl = await ResolveImageAsync(command.TeamImageFile, command.TeamImageUrl, page?.TeamImageUrl);
            var teamMembers = await BuildTeamMembersAsync(command.TeamMembers);

            if (page is null)
            {
                page = new AboutUsPage(
                    command.HeroTitle,
                    command.HeroSubtitle,
                    heroImageUrl,
                    command.IntroTitle,
                    command.IntroContentHtml,
                    command.MissionTitle,
                    command.MissionContentHtml,
                    command.VisionTitle,
                    command.VisionContentHtml,
                    command.ValuesTitle,
                    command.ValuesContentHtml,
                    command.TeamTitle,
                    command.TeamContentHtml,
                    teamImageUrl,
                    command.CtaTitle,
                    command.CtaSubtitle,
                    command.CtaButtonText,
                    command.CtaButtonUrl);
                page.ReplaceTeamMembers(teamMembers);

                await aboutUsCommandRepository.InsertAsync(page);
                await aboutUsCommandRepository.CommitAsync();
                return await OkAsync("About us page created successfully.");
            }

            page.Update(
                command.HeroTitle,
                command.HeroSubtitle,
                heroImageUrl,
                command.IntroTitle,
                command.IntroContentHtml,
                command.MissionTitle,
                command.MissionContentHtml,
                command.VisionTitle,
                command.VisionContentHtml,
                command.ValuesTitle,
                command.ValuesContentHtml,
                command.TeamTitle,
                command.TeamContentHtml,
                teamImageUrl,
                command.CtaTitle,
                command.CtaSubtitle,
                command.CtaButtonText,
                command.CtaButtonUrl);
            page.ReplaceTeamMembers(teamMembers);

            await aboutUsCommandRepository.CommitAsync();
            return await OkAsync("About us page updated successfully.");
        }

        private async Task<List<AboutUsTeamMember>> BuildTeamMembersAsync(IEnumerable<UpsertAboutUsTeamMemberDto>? members)
        {
            var result = new List<AboutUsTeamMember>();
            if (members == null)
                return result;

            var index = 0;
            foreach (var member in members)
            {
                if (string.IsNullOrWhiteSpace(member.FullName) && string.IsNullOrWhiteSpace(member.SkillTitle))
                    continue;

                var imageUrl = await ResolveImageAsync(member.ImageFile, member.ImageUrl, null);

                result.Add(AboutUsTeamMember.Create(
                    member.FullName,
                    member.SkillTitle,
                    imageUrl,
                    member.GithubUrl ?? string.Empty,
                    member.LinkedinUrl ?? string.Empty,
                    member.TwitterUrl ?? string.Empty,
                    member.InstagramUrl ?? string.Empty,
                    member.WebsiteUrl ?? string.Empty,
                    member.DisplayOrder > 0 ? member.DisplayOrder : index));

                index++;
            }

            return result;
        }

        private async Task<string> ResolveImageAsync(IFormFile? newFile, string? payloadImageUrl, string? currentImageUrl)
        {
            if (newFile != null && newFile.Length > 0)
                return await fileStoragePathSaver.SavePublicAsync(newFile, "images/about-us");

            if (!string.IsNullOrWhiteSpace(payloadImageUrl))
                return payloadImageUrl.Trim();

            return currentImageUrl ?? string.Empty;
        }
    }
}
