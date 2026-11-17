using ArkaSoftware.Extensions.ObjectMappers.Abstractions;
using ArkaSoftware.Extensions.Serializers.Abstractions;
using ArkaSoftware.Extensions.Translations.Abstractions;
using ArkaSoftware.Extensions.UsersManagement.Abstractions;
using Framework.Src.Utilities.OutService.ContextCarriers;

namespace Framework.Src.Utilities.OutService.Services
{
    public class ArkaSoftwareCMPOutServices
    {
        public readonly ITranslator Translator;
        public readonly IMapperAdapter MapperFacade;
        public readonly IUserInfoService UserInfoService;
        public readonly IJsonSerializer Serialize;
        public readonly ICurrentUserContext CurrentUserContext;
        public ArkaSoftwareCMPOutServices(ITranslator translator, IUserInfoService userInfoService, IJsonSerializer serialize, IMapperAdapter mapperFacade, ICurrentUserContext currentUserContext)
        {
            Translator = translator;
            UserInfoService = userInfoService;
            Serialize = serialize;
            MapperFacade = mapperFacade;
            CurrentUserContext = currentUserContext;
        }
    }
}
