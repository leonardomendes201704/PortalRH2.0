using MediatR;
using Microsoft.AspNetCore.Mvc;
using PortalRH.Api.Contracts.Auth;
using PortalRH.Api.Features.Auth.LdapLogin;

namespace PortalRH.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;

    public AuthController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("ldap/login")]
    [ProducesResponseType(typeof(PortalLoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> LoginWithLdap([FromBody] LdapLoginRequest request, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new LdapLoginCommand(request), cancellationToken);

        if (result is null)
        {
            return Unauthorized(new
            {
                message = "Nao foi possivel autenticar com o LDAP. Revise as credenciais ou a configuracao ativa."
            });
        }

        return Ok(result);
    }
}
