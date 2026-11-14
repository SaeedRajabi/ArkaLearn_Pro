using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Commands.Favorites
{
    public class AddSeminarToFavoritesCommand : ICommand<string>, IWebRequest
    {
        public long SeminarId { get; set; }
        public string Path => "/api/Service/Seminar/AddToFavorites";
    }
}
