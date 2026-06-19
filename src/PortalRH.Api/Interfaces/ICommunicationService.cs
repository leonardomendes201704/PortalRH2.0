using PortalRH.Api.Contracts.Communications;

namespace PortalRH.Api.Interfaces;

public interface ICommunicationService
{
    Task<IReadOnlyList<CommunicationDto>> GetAllAsync(CancellationToken cancellationToken);
    Task<CommunicationDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<CommunicationDto?> GetBySlugAsync(string slug, CancellationToken cancellationToken);
    Task<CommunicationDto> CreateAsync(UpsertCommunicationRequest request, CancellationToken cancellationToken);
    Task<CommunicationDto?> UpdateAsync(Guid id, UpsertCommunicationRequest request, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken);
}
