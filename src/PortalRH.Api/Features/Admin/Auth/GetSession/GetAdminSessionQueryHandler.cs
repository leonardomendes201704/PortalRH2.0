using MediatR;
using PortalRH.Api.Contracts.Admin.Auth;
using PortalRH.Api.Interfaces;

namespace PortalRH.Api.Features.Admin.Auth.GetSession;

public class GetAdminSessionQueryHandler : IRequestHandler<GetAdminSessionQuery, AdminSessionDto?>
{
    private readonly IAdminAuthService _adminAuthService;

    public GetAdminSessionQueryHandler(IAdminAuthService adminAuthService)
    {
        _adminAuthService = adminAuthService;
    }

    public Task<AdminSessionDto?> Handle(GetAdminSessionQuery request, CancellationToken cancellationToken)
    {
        return _adminAuthService.GetActiveSessionAsync(request.Token, cancellationToken);
    }
}
