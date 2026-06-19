using MediatR;
using PortalRH.Api.Contracts.Auth;
using PortalRH.Api.Interfaces;

namespace PortalRH.Api.Features.Auth.LdapLogin;

public class LdapLoginCommandHandler : IRequestHandler<LdapLoginCommand, PortalLoginResponse?>
{
    private readonly IPortalAuthService _portalAuthService;

    public LdapLoginCommandHandler(IPortalAuthService portalAuthService)
    {
        _portalAuthService = portalAuthService;
    }

    public Task<PortalLoginResponse?> Handle(LdapLoginCommand request, CancellationToken cancellationToken)
    {
        return _portalAuthService.LoginWithLdapAsync(request.Request, cancellationToken);
    }
}
