using PortalRH.Api.Contracts.Agenda;

namespace PortalRH.Api.Interfaces;

public interface IMicrosoftGraphUserPhotoService
{
    Task<IReadOnlyList<MicrosoftGraphCalendarEvent>> EnrichEventsWithParticipantPhotosAsync(
        string accessToken,
        IReadOnlyList<MicrosoftGraphCalendarEvent> events,
        CancellationToken cancellationToken);
}
