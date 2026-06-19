using MediatR;
using PortalRH.Api.Contracts.Admin.Ldap;

namespace PortalRH.Api.Features.Admin.Ldap.GetConfiguration;

public sealed record GetAdminLdapConfigurationQuery() : IRequest<LdapConfigurationDto>;
