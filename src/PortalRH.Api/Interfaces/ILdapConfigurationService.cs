using PortalRH.Api.Contracts.Admin.Ldap;
using PortalRH.Api.Services;

namespace PortalRH.Api.Interfaces;

public interface ILdapConfigurationService
{
    Task<LdapConfigurationDto> GetAsync(CancellationToken cancellationToken);
    Task<LdapConfigurationDto> SaveAsync(UpsertLdapConfigurationRequest request, CancellationToken cancellationToken);
    Task<LdapRuntimeConfiguration> GetRuntimeConfigurationAsync(CancellationToken cancellationToken);
    Task EnsureDefaultConfigurationAsync(CancellationToken cancellationToken);
}
