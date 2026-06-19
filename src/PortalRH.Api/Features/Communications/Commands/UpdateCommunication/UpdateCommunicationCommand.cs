using MediatR;
using PortalRH.Api.Contracts.Communications;

namespace PortalRH.Api.Features.Communications.Commands.UpdateCommunication;

public record UpdateCommunicationCommand(Guid Id, UpsertCommunicationRequest Request) : IRequest<CommunicationDto?>;
