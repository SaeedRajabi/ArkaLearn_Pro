using Microsoft.AspNetCore.Mvc;

namespace ArkaSoftwarePro.Src.Endpoints.API.Controllers;

[ApiController]
[Route("[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get() =>
        Ok(new { status = "ok", utc = DateTime.UtcNow });
}
