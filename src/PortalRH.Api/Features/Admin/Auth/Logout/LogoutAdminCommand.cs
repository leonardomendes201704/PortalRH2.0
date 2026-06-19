using MediatR;

namespace PortalRH.Api.Features.Admin.Auth.Logout;

public sealed record LogoutAdminCommand(string Token) : IRequest<bool>;
