using MediatR;
using PortalRH.Api.Contracts.Communications;
using PortalRH.Api.Interfaces;

namespace PortalRH.Api.Features.Communications.Commands.UpdateCommunication;

public class UpdateCommunicationCommandHandler : IRequestHandler<UpdateCommunicationCommand, CommunicationDto?>
{
    private readonly ICommunicationService _communicationService;

    public UpdateCommunicationCommandHandler(ICommunicationService communicationService)
    {
        _communicationService = communicationService;
    }

    public Task<CommunicationDto?> Handle(UpdateCommunicationCommand request, CancellationToken cancellationToken)
    {
        return _communicationService.UpdateAsync(request.Id, request.Request, cancellationToken);
    }
}
