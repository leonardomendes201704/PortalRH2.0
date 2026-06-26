using PortalRH.Api.Contracts.Feed;

namespace PortalRH.Api.Interfaces;

public interface IFeedService
{
    Task<FeedResponse> GetFeedAsync(Guid? portalUserId, CancellationToken cancellationToken);
    Task<FeedItemDto> CreatePostAsync(
        Guid portalUserId,
        string text,
        IReadOnlyList<CreateFeedPostMediaItem> media,
        FeedAuditContext auditContext,
        CancellationToken cancellationToken);
    Task<FeedLikeResponse?> ToggleLikeAsync(
        Guid itemId,
        string source,
        Guid portalUserId,
        FeedAuditContext auditContext,
        CancellationToken cancellationToken);
    Task<FeedMediaCommentsResponse?> GetMediaCommentsAsync(Guid mediaId, CancellationToken cancellationToken);
    Task<FeedMediaCommentDto?> CreateMediaCommentAsync(
        Guid mediaId,
        Guid portalUserId,
        string text,
        FeedAuditContext auditContext,
        CancellationToken cancellationToken);
    Task<FeedPostCommentsResponse?> GetPostCommentsAsync(Guid feedPostId, CancellationToken cancellationToken);
    Task<FeedPostCommentDto?> CreatePostCommentAsync(
        Guid feedPostId,
        Guid portalUserId,
        string text,
        IReadOnlyList<Guid> mentionedUserIds,
        FeedAuditContext auditContext,
        CancellationToken cancellationToken);
    Task<FeedMentionSuggestionsResponse> SuggestMentionsAsync(string query, CancellationToken cancellationToken);
}

public sealed record FeedAuditContext(
    string ActorLogin,
    string ActorDisplayName,
    string? IpAddress,
    string? Origin,
    string? UserAgent);
