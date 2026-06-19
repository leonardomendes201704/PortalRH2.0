using MediatR;
using PortalRH.Api.Contracts.Admin.Ldap;
using PortalRH.Api.Interfaces;

namespace PortalRH.Api.Features.Admin.Ldap.SaveConfiguration;

public class SaveAdminLdapConfigurationCommandHandler : IRequestHandler<SaveAdminLdapConfigurationCommand, LdapConfigurationDto>
{
    private readonly ILdapConfigurationService _ldapConfigurationService;

    public SaveAdminLdapConfigurationCommandHandler(ILdapConfigurationService ldapConfigurationService)
    {
        _ldapConfigurationService = ldapConfigurationService;
    }

    public Task<LdapConfigurationDto> Handle(SaveAdminLdapConfigurationCommand request, CancellationToken cancellationToken)
    {
        return _ldapConfigurationService.SaveAsync(request.Request, cancellationToken);
    }
}
