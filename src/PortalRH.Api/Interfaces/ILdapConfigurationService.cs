using PortalRH.Api.Contracts.Admin.Ldap;

namespace PortalRH.Api.Interfaces;

public interface ILdapConfigurationService
{
    Task<LdapConfigurationDto> GetAsync(CancellationToken cancellationToken);
    Task<LdapConfigurationDto> SaveAsync(UpsertLdapConfigurationRequest request, CancellationToken cancellationToken);
    Task EnsureDefaultConfigurationAsync(CancellationToken cancellationToken);
}
