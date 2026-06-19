using PortalRH.Api.Contracts.Auth;

namespace PortalRH.Api.Interfaces;

public interface IPortalAuthService
{
    Task<PortalLoginResponse?> LoginWithLdapAsync(LdapLoginRequest request, CancellationToken cancellationToken);
}
