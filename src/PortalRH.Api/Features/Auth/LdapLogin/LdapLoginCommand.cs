using MediatR;
using PortalRH.Api.Contracts.Auth;

namespace PortalRH.Api.Features.Auth.LdapLogin;

public sealed record LdapLoginCommand(LdapLoginRequest Request) : IRequest<PortalLoginResponse?>;
