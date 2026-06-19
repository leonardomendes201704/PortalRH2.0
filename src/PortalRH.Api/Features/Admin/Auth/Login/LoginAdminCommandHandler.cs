using MediatR;
using PortalRH.Api.Contracts.Admin.Auth;
using PortalRH.Api.Interfaces;

namespace PortalRH.Api.Features.Admin.Auth.Login;

public class LoginAdminCommandHandler : IRequestHandler<LoginAdminCommand, AdminLoginResponse?>
{
    private readonly IAdminAuthService _adminAuthService;

    public LoginAdminCommandHandler(IAdminAuthService adminAuthService)
    {
        _adminAuthService = adminAuthService;
    }

    public Task<AdminLoginResponse?> Handle(LoginAdminCommand request, CancellationToken cancellationToken)
    {
        return _adminAuthService.LoginAsync(request.Request, cancellationToken);
    }
}
