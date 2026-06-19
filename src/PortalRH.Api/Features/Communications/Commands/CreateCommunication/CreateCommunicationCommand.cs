using MediatR;
using PortalRH.Api.Contracts.Communications;

namespace PortalRH.Api.Features.Communications.Commands.CreateCommunication;

public record CreateCommunicationCommand(UpsertCommunicationRequest Request) : IRequest<CommunicationDto>;
