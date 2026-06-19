using MediatR;
using PortalRH.Api.Contracts.Admin.Auth;

namespace PortalRH.Api.Features.Admin.Auth.Login;

public sealed record LoginAdminCommand(AdminLoginRequest Request) : IRequest<AdminLoginResponse?>;
