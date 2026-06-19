using MediatR;
using PortalRH.Api.Contracts.Admin.Ldap;

namespace PortalRH.Api.Features.Admin.Ldap.SaveConfiguration;

public sealed record SaveAdminLdapConfigurationCommand(UpsertLdapConfigurationRequest Request) : IRequest<LdapConfigurationDto>;
