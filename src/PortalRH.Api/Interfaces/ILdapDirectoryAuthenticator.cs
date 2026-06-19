using PortalRH.Api.Services;

namespace PortalRH.Api.Interfaces;

public interface ILdapDirectoryAuthenticator
{
    Task<LdapAuthenticatedUser?> AuthenticateAsync(
        LdapRuntimeConfiguration configuration,
        string login,
        string password,
        CancellationToken cancellationToken);
}
