using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Tags.Commands.AddTags
{
    public class AddTag : ICommand<string>, IWebRequest
    {
        public string TagName { get; set; } = string.Empty;
        public string Path => "api/Service/Tag/Add";
    }
}
