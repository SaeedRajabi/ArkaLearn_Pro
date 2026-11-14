using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.ApplicationService.LiveMediaTransportSettingsServices.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.LiveMediaTransportSettings.LiveMediaTransportSettingsRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Security;
using ArkaSoftwarePro.Src.Core.RequestResponse.LiveMediaTransportSettings.Commands.UpsertLiveMediaTransportSettings;
using Extensions.Translations.Abstractions;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;
using Moq;
using Xunit;

namespace ArkaSoftwarePro.Tests.Services;

public class LiveMediaSettingsTests
{
    [Fact]
    public async Task Missing_master_key_returns_validation_error_without_touching_database()
    {
        var translator = new Mock<ITranslator>();
        translator.Setup(t => t[It.IsAny<string>()]).Returns((string text) => text);
        var outer = new ArkaSoftwareCMPOutServices(translator.Object, null!, null!, null!, null!);
        var context = new HttpContextAccessor { HttpContext = new DefaultHttpContext() };
        context.HttpContext.User = new ClaimsPrincipal(new ClaimsIdentity(
            new[] { new Claim(ClaimTypes.Role, "admin") }, "test"));
        var repository = new Mock<ILiveMediaTransportSettingsCommandRepository>(MockBehavior.Strict);
        var protector = new Mock<ISecretProtector>(MockBehavior.Strict);
        protector.SetupGet(p => p.HasConfiguredMasterKey).Returns(false);
        var handler = new UpsertLiveMediaTransportSettingsCommandHandler(outer, repository.Object, protector.Object, context);
        var result = await handler.Handle(new UpsertLiveMediaTransportSettingsCommand
        {
            TransportMode = "LiveKit", LiveKitUrl = "wss://example.test", LiveKitApiKey = "key", LiveKitApiSecret = "secret"
        });
        Assert.Equal(ApplicationServiceStatus.ValidationError, result.Status);
        repository.VerifyNoOtherCalls();
    }
}