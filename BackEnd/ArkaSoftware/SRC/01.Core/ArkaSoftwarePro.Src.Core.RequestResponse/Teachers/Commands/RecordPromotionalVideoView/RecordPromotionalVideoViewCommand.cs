using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.RecordPromotionalVideoView;

public class RecordPromotionalVideoViewCommand : ICommand<string>, IWebRequest
{
    public long VideoId { get; set; }
    public string Path => "/api/Service/Teacher/RecordPromotionalVideoView";
}
