using Microsoft.AspNetCore.Mvc;
using PortalRH.Api.Contracts.Admin.Polls;
using PortalRH.Api.Interfaces;
using PortalRH.Api.Security;

namespace PortalRH.Api.Controllers;

[ApiController]
[Route("api/admin/polls")]
[RequireSuperAdminSession]
public class AdminPollsController : ControllerBase
{
    private readonly IPollService _pollService;

    public AdminPollsController(IPollService pollService)
    {
        _pollService = pollService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(PollAdminListResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var items = await _pollService.GetAdminListAsync(cancellationToken);
        return Ok(items);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(PollAdminDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var item = await _pollService.GetAdminByIdAsync(id, cancellationToken);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    [ProducesResponseType(typeof(PollAdminDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] UpsertPollRequest request, CancellationToken cancellationToken)
    {
        var actor = AdminSessionHttpContext.Get(HttpContext)?.User;
        if (actor is null)
        {
            return Unauthorized();
        }

        try
        {
            var item = await _pollService.CreateAsync(request, actor, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(PollAdminDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpsertPollRequest request, CancellationToken cancellationToken)
    {
        var actor = AdminSessionHttpContext.Get(HttpContext)?.User;
        if (actor is null)
        {
            return Unauthorized();
        }

        try
        {
            var item = await _pollService.UpdateAsync(id, request, actor, cancellationToken);
            return item is null ? NotFound() : Ok(item);
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }

    [HttpPatch("{id:guid}/status")]
    [ProducesResponseType(typeof(PollAdminDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdatePollStatusRequest request, CancellationToken cancellationToken)
    {
        var actor = AdminSessionHttpContext.Get(HttpContext)?.User;
        if (actor is null)
        {
            return Unauthorized();
        }

        var item = await _pollService.UpdateStatusAsync(id, request.Status, actor, cancellationToken);
        return item is null ? NotFound() : Ok(item);
    }
}
