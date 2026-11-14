using System.Text.Json;
using ArkaSoftwarePro.Src.Core.Contracts.Rooms.RoomRepositoriesContract.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Services;
using ArkaSoftwarePro.Src.Core.Contracts.Seminars.SeminarRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Core.Domain.SeminarAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.SeminarAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.SeminarAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Commands.UpdateSeminar;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using System.Text.RegularExpressions;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SeminarsServices.Commands
{
    public class UpdateSeminarCommandHandler(
        ArkaSoftwareCMPOutServices mafiaOuterServices,
        ISeminarCommandRepository seminarCommandRepository,
        IRoomCommandRepository roomCommandRepository,
        IEntityTitleUniquenessChecker titleUniquenessChecker)
        : CommandHandler<UpdateSeminar, string>(mafiaOuterServices)
    {
        public override async Task<CommandResult<string>> Handle(UpdateSeminar command)
        {
            var seminar = await seminarCommandRepository.GetAsync(command.Id);
            if (seminar == null)
                return await ResultAsync("Seminar not found.", ApplicationServiceStatus.NotFound);

            if (await titleUniquenessChecker.SeminarTitleExistsAsync(command.Title, command.Id))
            {
                AddMessage("A seminar with this title already exists.");
                return await ResultAsync(string.Empty, ApplicationServiceStatus.Exist);
            }

            var roomId = command.RoomId is > 0 ? command.RoomId : null;
            if (roomId.HasValue)
            {
                var room = await roomCommandRepository.GetAsync(roomId.Value);
                if (room == null)
                {
                    AddMessage("Selected room was not found. Choose another room or leave it empty.");
                    return await ResultAsync(string.Empty, ApplicationServiceStatus.ValidationError);
                }
            }

            var status = (SeminarStatus)command.Status;
            seminar.UpdateDetails(
                SeminarTitle.Create(command.Title),
                SeminarDescription.Create(command.Description),
                command.StartTime,
                command.EndTime,
                command.Capacity,
                new Price(command.Price),
                command.IsFree,
                status,
                string.IsNullOrEmpty(command.EntryLink) ? null : SeminarEntryLink.Create(command.EntryLink),
                command.ThumbnailUrl,
                command.VideoUrl,
                roomId,
                command.Prerequisites,
                command.FaqsJson,
                command.RecordingVideoUrl,
                command.IsPublic);

            seminar.UpdateSeo(command.SeoTitle, command.MetaDescription, command.OgImageUrl);

            var tagNames = ParseTagNames(command.TagsJson);
            await seminarCommandRepository.SyncTagsAsync(seminar.Id, tagNames);

            await seminarCommandRepository.CommitAsync();
            return await OkAsync("Seminar updated successfully.");
        }

        private static List<string> ParseTagNames(string? tagsJson)
        {
            if (string.IsNullOrWhiteSpace(tagsJson)) return new List<string>();
            try
            {
                var list = JsonSerializer.Deserialize<List<string>>(tagsJson) ?? new List<string>();
                return list
                    .SelectMany(SplitLooseList)
                    .Select(x => x.Trim().TrimStart('#'))
                    .Where(x => x.Length >= 2)
                    .Select(x => x.Length > 100 ? x[..100].Trim() : x)
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();
            }
            catch
            {
                return SplitLooseList(tagsJson)
                    .Select(x => x.Trim().TrimStart('#'))
                    .Where(x => x.Length >= 2)
                    .Select(x => x.Length > 100 ? x[..100].Trim() : x)
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();
            }
        }

        private static IEnumerable<string> SplitLooseList(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return Array.Empty<string>();

            return Regex
                .Split(value, @"[\r\n;؛,،]+")
                .Select(x => x.Trim())
                .Where(x => x.Length > 0);
        }
    }
}
