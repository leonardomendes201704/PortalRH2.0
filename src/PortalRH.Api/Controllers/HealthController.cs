using Microsoft.AspNetCore.Mvc;

namespace PortalRH.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new { status = "ok", service = "PortalRH.Api" });
    }
}
