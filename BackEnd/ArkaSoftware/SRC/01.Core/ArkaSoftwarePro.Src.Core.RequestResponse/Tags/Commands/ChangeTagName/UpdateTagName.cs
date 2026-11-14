using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Tags.Commands.ChangeTagName
{
    public class UpdateTagName : ICommand<string>, IWebRequest
    {
        public long TagId { get; set; }
        public string TagName { get; set; } = string.Empty;

        public string Path => "api/Service/Tag/UpdateTagName";
    }
}
