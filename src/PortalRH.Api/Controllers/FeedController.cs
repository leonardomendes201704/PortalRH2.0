using Microsoft.AspNetCore.Mvc;
using PortalRH.Api.Contracts.Feed;
using PortalRH.Api.Interfaces;
using PortalRH.Api.Security;

namespace PortalRH.Api.Controllers;

[ApiController]
[Route("api/feed")]
public class FeedController : ControllerBase
{
    private readonly IFeedService _feedService;
    private readonly IPortalAuthService _portalAuthService;

    public FeedController(IFeedService feedService, IPortalAuthService portalAuthService)
    {
        _feedService = feedService;
        _portalAuthService = portalAuthService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(FeedResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFeed(CancellationToken cancellationToken)
    {
        var portalUserId = await ResolvePortalUserIdAsync(cancellationToken);
        var payload = await _feedService.GetFeedAsync(portalUserId, cancellationToken);
        return Ok(payload);
    }

    [HttpPost]
    [RequirePortalSession]
    [ProducesResponseType(typeof(CreateFeedPostResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreatePost([FromBody] CreateFeedPostRequest request, CancellationToken cancellationToken)
    {
        var session = PortalSessionHttpContext.Get(HttpContext);
        if (session?.PortalUser is null)
        {
            return Unauthorized(new { message = "Sessao do portal nao encontrada." });
        }

        try
        {
            var item = await _feedService.CreatePostAsync(
                session.PortalUserId,
                request.Text,
                request.Media ?? [],
                BuildAuditContext(session.PortalUser.Login, session.PortalUser.DisplayName),
                cancellationToken);

            return Created("/api/feed", new CreateFeedPostResponse(item));
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpPost("{id:guid}/like")]
    [RequirePortalSession]
    [ProducesResponseType(typeof(FeedLikeResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ToggleLike(Guid id, [FromBody] ToggleFeedLikeRequest request, CancellationToken cancellationToken)
    {
        var session = PortalSessionHttpContext.Get(HttpContext);
        if (session?.PortalUser is null)
        {
            return Unauthorized(new { message = "Sessao do portal nao encontrada." });
        }

        try
        {
            var result = await _feedService.ToggleLikeAsync(
                id,
                request.Source,
                session.PortalUserId,
                BuildAuditContext(session.PortalUser.Login, session.PortalUser.DisplayName),
                cancellationToken);

            return result is null ? NotFound() : Ok(result);
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    private async Task<Guid?> ResolvePortalUserIdAsync(CancellationToken cancellationToken)
    {
        var token = ResolvePortalToken();
        if (string.IsNullOrWhiteSpace(token))
        {
            return null;
        }

        var session = await _portalAuthService.GetActiveSessionEntityAsync(token, cancellationToken);
        return session?.PortalUserId;
    }

    private string ResolvePortalToken()
    {
        if (Request.Headers.TryGetValue("X-Portal-Token", out var portalToken))
        {
            return portalToken.ToString();
        }

        if (Request.Headers.Authorization.Count > 0)
        {
            var header = Request.Headers.Authorization.ToString();
            const string prefix = "Bearer ";
            if (header.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            {
                return header[prefix.Length..].Trim();
            }
        }

        return string.Empty;
    }

    private FeedAuditContext BuildAuditContext(string actorLogin, string actorDisplayName)
    {
        string? ipAddress = Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (string.IsNullOrWhiteSpace(ipAddress))
        {
            ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        }

        if (!string.IsNullOrWhiteSpace(ipAddress) && ipAddress.Contains(','))
        {
            ipAddress = ipAddress.Split(',')[0].Trim();
        }

        var origin = Request.Headers.Origin.FirstOrDefault();
        if (string.IsNullOrWhiteSpace(origin) && Request.Host.HasValue)
        {
            origin = $"{Request.Scheme}://{Request.Host}";
        }

        var userAgent = Request.Headers.UserAgent.ToString();
        return new FeedAuditContext(actorLogin, actorDisplayName, ipAddress, origin, userAgent);
    }
}
