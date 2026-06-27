using PortalRH.Api.Contracts.Admin.Auth;
using PortalRH.Api.Contracts.Admin.Polls;
using PortalRH.Api.Contracts.Polls;

namespace PortalRH.Api.Interfaces;

public interface IPollService
{
    Task<IReadOnlyList<PollDto>> GetPublishedAsync(Guid? portalUserId, CancellationToken cancellationToken);
    Task<PollDto?> GetPublishedBySlugAsync(string slug, Guid? portalUserId, CancellationToken cancellationToken);
    Task<PollDto?> SubmitVoteAsync(Guid pollId, Guid portalUserId, IReadOnlyCollection<Guid> optionIds, CancellationToken cancellationToken);
    Task<PollAdminListResponse> GetAdminListAsync(CancellationToken cancellationToken);
    Task<PollAdminDto?> GetAdminByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<PollAdminDto> CreateAsync(UpsertPollRequest request, AdminProfileDto actor, CancellationToken cancellationToken);
    Task<PollAdminDto?> UpdateAsync(Guid id, UpsertPollRequest request, AdminProfileDto actor, CancellationToken cancellationToken);
    Task<PollAdminDto?> UpdateStatusAsync(Guid id, string status, AdminProfileDto actor, CancellationToken cancellationToken);
}
