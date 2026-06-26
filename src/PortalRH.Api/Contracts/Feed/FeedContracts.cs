namespace PortalRH.Api.Contracts.Feed;

public record FeedMediaItemDto(
    string Url,
    string Description,
    string AspectRatio,
    int SortOrder);

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
    bool HasLiked,
    IReadOnlyList<FeedMediaItemDto> Media);

public record FeedResponse(
    string Title,
    IReadOnlyList<FeedItemDto> Items);

public record CreateFeedPostMediaItem
{
    public string Url { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string AspectRatio { get; set; } = "free";
}

public record CreateFeedPostRequest
{
    public string Text { get; set; } = string.Empty;
    public List<CreateFeedPostMediaItem> Media { get; set; } = [];
}

public record CreateFeedPostResponse(FeedItemDto Item);

public record FeedAssetUploadResponse(
    string FileName,
    string ContentType,
    long Size,
    string Url);

public record ToggleFeedLikeRequest
{
    public string Source { get; set; } = string.Empty;
}

public record FeedLikeResponse(
    Guid ItemId,
    string Source,
    int LikeCount,
    bool HasLiked);
