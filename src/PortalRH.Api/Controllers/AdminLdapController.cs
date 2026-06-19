using MediatR;
using Microsoft.AspNetCore.Mvc;
using PortalRH.Api.Contracts.Admin.Ldap;
using PortalRH.Api.Features.Admin.Ldap.GetConfiguration;
using PortalRH.Api.Features.Admin.Ldap.SaveConfiguration;
using PortalRH.Api.Security;

namespace PortalRH.Api.Controllers;

[ApiController]
[Route("api/admin/ldap")]
[RequireAdminSession]
public class AdminLdapController : ControllerBase
{
    private readonly IMediator _mediator;

    public AdminLdapController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    [ProducesResponseType(typeof(LdapConfigurationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetAdminLdapConfigurationQuery(), cancellationToken);
        return Ok(result);
    }

    [HttpPut]
    [ProducesResponseType(typeof(LdapConfigurationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Save([FromBody] UpsertLdapConfigurationRequest request, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new SaveAdminLdapConfigurationCommand(request), cancellationToken);
        return Ok(result);
    }
}
