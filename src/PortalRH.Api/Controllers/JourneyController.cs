using Microsoft.AspNetCore.Mvc;
using PortalRH.Api.Contracts.Journey;
using PortalRH.Api.Interfaces;
using PortalRH.Api.Security;

namespace PortalRH.Api.Controllers;

[ApiController]
[Route("api/journey")]
[RequirePortalSession]
public class JourneyController : ControllerBase
{
    private readonly IJourneyService _journeyService;

    public JourneyController(IJourneyService journeyService)
    {
        _journeyService = journeyService;
    }

    [HttpGet("summary")]
    [ProducesResponseType(typeof(JourneySummaryResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSummary(CancellationToken cancellationToken)
    {
        var session = PortalSessionHttpContext.Get(HttpContext);
        if (session?.PortalUser is null)
        {
            return Unauthorized(new { message = "Sessao do portal nao encontrada." });
        }

        var payload = await _journeyService.GetSummaryAsync(session.PortalUser, cancellationToken);
        return Ok(payload);
    }
}
