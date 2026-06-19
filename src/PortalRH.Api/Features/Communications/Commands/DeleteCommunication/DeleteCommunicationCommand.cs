using MediatR;

namespace PortalRH.Api.Features.Communications.Commands.DeleteCommunication;

public record DeleteCommunicationCommand(Guid Id) : IRequest<bool>;
