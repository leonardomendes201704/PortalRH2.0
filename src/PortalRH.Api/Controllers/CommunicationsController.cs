using MediatR;
using Microsoft.AspNetCore.Mvc;
using PortalRH.Api.Contracts.Communications;
using PortalRH.Api.Features.Communications.Commands.CreateCommunication;
using PortalRH.Api.Features.Communications.Commands.DeleteCommunication;
using PortalRH.Api.Features.Communications.Commands.UpdateCommunication;
using PortalRH.Api.Features.Communications.Queries.GetCommunicationById;
using PortalRH.Api.Features.Communications.Queries.GetCommunicationBySlug;
using PortalRH.Api.Features.Communications.Queries.GetCommunications;
using PortalRH.Api.Security;

namespace PortalRH.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CommunicationsController : ControllerBase
{
    private readonly IMediator _mediator;

    public CommunicationsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<CommunicationDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetCommunicationsQuery(), cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(CommunicationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetCommunicationByIdQuery(id), cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpGet("slug/{slug}")]
    [ProducesResponseType(typeof(CommunicationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetBySlug(string slug, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetCommunicationBySlugQuery(slug), cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    [RequireCommunicationEditor]
    [ProducesResponseType(typeof(CommunicationDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Create([FromBody] UpsertCommunicationRequest request, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new CreateCommunicationCommand(request), cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    [RequireCommunicationEditor]
    [ProducesResponseType(typeof(CommunicationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpsertCommunicationRequest request, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new UpdateCommunicationCommand(id, request), cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [RequireCommunicationEditor]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var deleted = await _mediator.Send(new DeleteCommunicationCommand(id), cancellationToken);
        return deleted ? NoContent() : NotFound();
    }
}
