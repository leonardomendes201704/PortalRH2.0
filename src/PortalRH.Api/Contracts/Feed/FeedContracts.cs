namespace PortalRH.Api.Contracts.Feed;

public record FeedItemDto(
    Guid Id,
    string Source,
    Guid? CommunicationId,
    string Author,
    string Area,
    DateTime PublishedAtUtc,
    string Text,
    string? HighlightTitle,
    string? HighlightText,
    string? ImageUrl,
    int LikeCount,
    bool HasLiked);

public record FeedResponse(
    string Title,
    IReadOnlyList<FeedItemDto> Items);

public record CreateFeedPostRequest
{
    public string Text { get; set; } = string.Empty;
}

public record CreateFeedPostResponse(FeedItemDto Item);

public record ToggleFeedLikeRequest
{
    public string Source { get; set; } = string.Empty;
}

public record FeedLikeResponse(
    Guid ItemId,
    string Source,
    int LikeCount,
    bool HasLiked);
