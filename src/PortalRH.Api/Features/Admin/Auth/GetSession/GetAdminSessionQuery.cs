using MediatR;
using PortalRH.Api.Contracts.Admin.Auth;

namespace PortalRH.Api.Features.Admin.Auth.GetSession;

public sealed record GetAdminSessionQuery(string Token) : IRequest<AdminSessionDto?>;
