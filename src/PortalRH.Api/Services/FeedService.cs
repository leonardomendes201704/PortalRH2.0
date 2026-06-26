using Microsoft.EntityFrameworkCore;
using PortalRH.Api.Contracts.Feed;
using PortalRH.Api.Data;
using PortalRH.Api.Domain;
using PortalRH.Api.Interfaces;
using PortalRH.Api.Models;

namespace PortalRH.Api.Services;

public class FeedService : IFeedService
{
    private const string FeedTitle = "FEED LIOCONNECTA";
    private const int MaxPostLength = 2000;
    private const int MaxMediaPerPost = 10;
    private const int MaxMediaDescriptionLength = 500;

    private const int MaxMediaCommentLength = 1000;

    private static readonly HashSet<string> AllowedAspectRatios = new(StringComparer.OrdinalIgnoreCase)
    {
        "1:1", "16:9", "9:16", "free"
    };

    private readonly PortalRhDbContext _dbContext;
    private readonly ICommunicationService _communicationService;

    public FeedService(PortalRhDbContext dbContext, ICommunicationService communicationService)
    {
        _dbContext = dbContext;
        _communicationService = communicationService;
    }

    public async Task<FeedResponse> GetFeedAsync(Guid? portalUserId, CancellationToken cancellationToken)
    {
        var userPosts = await _dbContext.FeedPosts
            .AsNoTracking()
            .Include(item => item.PortalUser)
            .Include(item => item.Media)
            .OrderByDescending(item => item.CreatedAtUtc)
            .ToListAsync(cancellationToken);

        var communications = await _dbContext.Communications
            .AsNoTracking()
            .Where(item => item.Status.ToLower() == "publicado")
            .OrderByDescending(item => item.PublishedAt)
            .ThenByDescending(item => item.CreatedAtUtc)
            .ToListAsync(cancellationToken);

        var userPostIds = userPosts.Select(item => item.Id).ToList();
        var communicationIds = communications.Select(item => item.Id).ToList();

        var userPostLikeCounts = await LoadFeedPostLikeCountsAsync(userPostIds, cancellationToken);
        var communicationLikeCounts = await LoadCommunicationLikeCountsAsync(communicationIds, cancellationToken);
        var likedUserPostIds = portalUserId.HasValue
            ? await LoadLikedFeedPostIdsAsync(userPostIds, portalUserId.Value, cancellationToken)
            : [];
        var likedCommunicationIds = portalUserId.HasValue
            ? await LoadLikedCommunicationIdsAsync(communicationIds, portalUserId.Value, cancellationToken)
            : [];

        var mediaIds = userPosts.SelectMany(item => item.Media).Select(item => item.Id).ToList();
        var mediaCommentCounts = await LoadMediaCommentCountsAsync(mediaIds, cancellationToken);

        var items = new List<FeedItemDto>();

        items.AddRange(userPosts.Select(item =>
        {
            var media = MapMediaItems(item.Media, mediaCommentCounts);
            return new FeedItemDto(
                item.Id,
                FeedItemSources.UserPost,
                null,
                item.PortalUser?.DisplayName ?? "Colaborador",
                item.PortalUser?.Department ?? "Companhia",
                item.CreatedAtUtc,
                item.Text,
                null,
                null,
                media.FirstOrDefault()?.Url,
                userPostLikeCounts.GetValueOrDefault(item.Id),
                likedUserPostIds.Contains(item.Id),
                media);
        }));

        items.AddRange(communications.Select(item => new FeedItemDto(
            item.Id,
            FeedItemSources.Communication,
            item.Id,
            item.Owner,
            item.Category,
            item.PublishedAt,
            item.Summary,
            item.Title,
            item.Summary,
            item.ImageUrl,
            communicationLikeCounts.GetValueOrDefault(item.Id),
            likedCommunicationIds.Contains(item.Id),
            [])));

        return new FeedResponse(
            FeedTitle,
            items
                .OrderByDescending(item => item.PublishedAtUtc)
                .ToList());
    }

    public async Task<FeedItemDto> CreatePostAsync(
        Guid portalUserId,
        string text,
        IReadOnlyList<CreateFeedPostMediaItem> media,
        FeedAuditContext auditContext,
        CancellationToken cancellationToken)
    {
        var normalizedText = text?.Trim() ?? string.Empty;
        var normalizedMedia = NormalizeMediaItems(media);

        if (string.IsNullOrWhiteSpace(normalizedText) && normalizedMedia.Count == 0)
        {
            throw new InvalidOperationException("Informe um texto ou ao menos uma foto para publicar no feed.");
        }

        if (normalizedText.Length > MaxPostLength)
        {
            throw new InvalidOperationException($"A publicacao pode ter no maximo {MaxPostLength} caracteres.");
        }

        if (normalizedMedia.Count > MaxMediaPerPost)
        {
            throw new InvalidOperationException($"A publicacao pode ter no maximo {MaxMediaPerPost} fotos.");
        }

        var user = await _dbContext.PortalUsers
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == portalUserId, cancellationToken);

        if (user is null)
        {
            throw new InvalidOperationException("Usuario do portal nao encontrado.");
        }

        var now = DateTime.UtcNow;
        var entity = new FeedPost
        {
            Id = Guid.NewGuid(),
            PortalUserId = portalUserId,
            Text = normalizedText,
            CreatedAtUtc = now,
            IpAddress = auditContext.IpAddress,
            Origin = auditContext.Origin
        };

        for (var index = 0; index < normalizedMedia.Count; index++)
        {
            var mediaItem = normalizedMedia[index];
            entity.Media.Add(new FeedPostMedia
            {
                Id = Guid.NewGuid(),
                FeedPostId = entity.Id,
                Url = mediaItem.Url,
                Description = mediaItem.Description,
                AspectRatio = mediaItem.AspectRatio,
                SortOrder = index,
                CreatedAtUtc = now
            });
        }

        _dbContext.FeedPosts.Add(entity);
        _dbContext.FeedPostAuditLogs.Add(new FeedPostAuditLog
        {
            Id = Guid.NewGuid(),
            FeedPostId = entity.Id,
            PortalUserId = portalUserId,
            ActionType = FeedPostAuditActionTypes.PostCreated,
            ActorLogin = auditContext.ActorLogin,
            ActorDisplayName = auditContext.ActorDisplayName,
            IpAddress = auditContext.IpAddress,
            Origin = auditContext.Origin,
            UserAgent = auditContext.UserAgent,
            CreatedAtUtc = now
        });

        await _dbContext.SaveChangesAsync(cancellationToken);

        var mappedMedia = MapMediaItems(entity.Media, new Dictionary<Guid, int>());

        return new FeedItemDto(
            entity.Id,
            FeedItemSources.UserPost,
            null,
            user.DisplayName,
            user.Department ?? "Companhia",
            entity.CreatedAtUtc,
            entity.Text,
            null,
            null,
            mappedMedia.FirstOrDefault()?.Url,
            0,
            false,
            mappedMedia);
    }

    public async Task<FeedLikeResponse?> ToggleLikeAsync(
        Guid itemId,
        string source,
        Guid portalUserId,
        FeedAuditContext auditContext,
        CancellationToken cancellationToken)
    {
        var normalizedSource = source?.Trim() ?? string.Empty;

        if (string.Equals(normalizedSource, FeedItemSources.Communication, StringComparison.OrdinalIgnoreCase))
        {
            var communicationResult = await _communicationService.ToggleLikeAsync(
                itemId,
                portalUserId,
                MapAuditContext(auditContext),
                cancellationToken);

            return communicationResult is null
                ? null
                : new FeedLikeResponse(itemId, FeedItemSources.Communication, communicationResult.LikeCount, communicationResult.HasLiked);
        }

        if (string.Equals(normalizedSource, FeedItemSources.UserPost, StringComparison.OrdinalIgnoreCase))
        {
            return await ToggleUserPostLikeAsync(itemId, portalUserId, auditContext, cancellationToken);
        }

        throw new InvalidOperationException("Origem da publicacao invalida para curtida.");
    }

    public async Task<FeedMediaCommentsResponse?> GetMediaCommentsAsync(Guid mediaId, CancellationToken cancellationToken)
    {
        var media = await _dbContext.FeedPostMedia
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == mediaId, cancellationToken);

        if (media is null)
        {
            return null;
        }

        var comments = await _dbContext.FeedPostMediaComments
            .AsNoTracking()
            .Include(item => item.PortalUser)
            .Where(item => item.FeedPostMediaId == mediaId)
            .OrderBy(item => item.CreatedAtUtc)
            .ToListAsync(cancellationToken);

        return new FeedMediaCommentsResponse(
            mediaId,
            comments.Select(item => MapMediaComment(item)).ToList());
    }

    public async Task<FeedMediaCommentDto?> CreateMediaCommentAsync(
        Guid mediaId,
        Guid portalUserId,
        string text,
        FeedAuditContext auditContext,
        CancellationToken cancellationToken)
    {
        var normalizedText = text?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(normalizedText))
        {
            throw new InvalidOperationException("Informe um comentario para a foto.");
        }

        if (normalizedText.Length > MaxMediaCommentLength)
        {
            throw new InvalidOperationException($"O comentario da foto pode ter no maximo {MaxMediaCommentLength} caracteres.");
        }

        var media = await _dbContext.FeedPostMedia
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == mediaId, cancellationToken);

        if (media is null)
        {
            return null;
        }

        var user = await _dbContext.PortalUsers
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == portalUserId, cancellationToken);

        if (user is null)
        {
            throw new InvalidOperationException("Usuario do portal nao encontrado.");
        }

        var entity = new FeedPostMediaComment
        {
            Id = Guid.NewGuid(),
            FeedPostMediaId = mediaId,
            PortalUserId = portalUserId,
            Text = normalizedText,
            CreatedAtUtc = DateTime.UtcNow,
            IpAddress = auditContext.IpAddress,
            Origin = auditContext.Origin
        };

        _dbContext.FeedPostMediaComments.Add(entity);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return MapMediaComment(entity, user.DisplayName);
    }

    private static List<CreateFeedPostMediaItem> NormalizeMediaItems(IReadOnlyList<CreateFeedPostMediaItem>? media)
    {
        if (media is null || media.Count == 0)
        {
            return [];
        }

        var normalized = new List<CreateFeedPostMediaItem>();

        foreach (var item in media)
        {
            var url = item.Url?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(url))
            {
                throw new InvalidOperationException("Informe a URL de cada foto anexada.");
            }

            if (!url.Contains("/uploads/feed/", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("URL de foto invalida para publicacao no feed.");
            }

            var description = item.Description?.Trim() ?? string.Empty;
            if (description.Length > MaxMediaDescriptionLength)
            {
                throw new InvalidOperationException($"A descricao da foto pode ter no maximo {MaxMediaDescriptionLength} caracteres.");
            }

            var aspectRatio = item.AspectRatio?.Trim() ?? "free";
            if (!AllowedAspectRatios.Contains(aspectRatio))
            {
                aspectRatio = "free";
            }

            normalized.Add(new CreateFeedPostMediaItem
            {
                Url = url,
                Description = description,
                AspectRatio = aspectRatio
            });
        }

        return normalized;
    }

    private static FeedMediaCommentDto MapMediaComment(FeedPostMediaComment comment, string? authorOverride = null)
    {
        return new FeedMediaCommentDto(
            comment.Id,
            authorOverride ?? comment.PortalUser?.DisplayName ?? "Colaborador",
            comment.Text,
            comment.CreatedAtUtc);
    }

    private static IReadOnlyList<FeedMediaItemDto> MapMediaItems(
        IEnumerable<FeedPostMedia> media,
        IReadOnlyDictionary<Guid, int> commentCounts)
    {
        return media
            .OrderBy(item => item.SortOrder)
            .Select(item => new FeedMediaItemDto(
                item.Id,
                NormalizeMediaPublicUrl(item.Url),
                item.Description,
                item.AspectRatio,
                item.SortOrder,
                commentCounts.GetValueOrDefault(item.Id)))
            .ToList();
    }

    private static string NormalizeMediaPublicUrl(string url)
    {
        var value = url?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var marker = "/uploads/feed/";
        var index = value.IndexOf(marker, StringComparison.OrdinalIgnoreCase);
        if (index >= 0)
        {
            return value[index..];
        }

        return value;
    }

    private async Task<Dictionary<Guid, int>> LoadMediaCommentCountsAsync(
        IReadOnlyCollection<Guid> mediaIds,
        CancellationToken cancellationToken)
    {
        if (mediaIds.Count == 0)
        {
            return [];
        }

        return await _dbContext.FeedPostMediaComments
            .AsNoTracking()
            .Where(item => mediaIds.Contains(item.FeedPostMediaId))
            .GroupBy(item => item.FeedPostMediaId)
            .Select(group => new { FeedPostMediaId = group.Key, Count = group.Count() })
            .ToDictionaryAsync(item => item.FeedPostMediaId, item => item.Count, cancellationToken);
    }

    private async Task<FeedLikeResponse?> ToggleUserPostLikeAsync(
        Guid feedPostId,
        Guid portalUserId,
        FeedAuditContext auditContext,
        CancellationToken cancellationToken)
    {
        var feedPost = await _dbContext.FeedPosts
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == feedPostId, cancellationToken);

        if (feedPost is null)
        {
            return null;
        }

        var existingLike = await _dbContext.FeedPostLikes
            .FirstOrDefaultAsync(
                item => item.FeedPostId == feedPostId && item.PortalUserId == portalUserId,
                cancellationToken);

        var now = DateTime.UtcNow;
        string actionType;
        bool hasLiked;

        if (existingLike is not null)
        {
            _dbContext.FeedPostLikes.Remove(existingLike);
            actionType = FeedPostAuditActionTypes.LikeRemoved;
            hasLiked = false;
        }
        else
        {
            _dbContext.FeedPostLikes.Add(new FeedPostLike
            {
                Id = Guid.NewGuid(),
                FeedPostId = feedPostId,
                PortalUserId = portalUserId,
                CreatedAtUtc = now,
                IpAddress = auditContext.IpAddress,
                Origin = auditContext.Origin
            });
            actionType = FeedPostAuditActionTypes.LikeRegistered;
            hasLiked = true;
        }

        _dbContext.FeedPostAuditLogs.Add(new FeedPostAuditLog
        {
            Id = Guid.NewGuid(),
            FeedPostId = feedPostId,
            PortalUserId = portalUserId,
            ActionType = actionType,
            ActorLogin = auditContext.ActorLogin,
            ActorDisplayName = auditContext.ActorDisplayName,
            IpAddress = auditContext.IpAddress,
            Origin = auditContext.Origin,
            UserAgent = auditContext.UserAgent,
            CreatedAtUtc = now
        });

        await _dbContext.SaveChangesAsync(cancellationToken);

        var likeCount = await _dbContext.FeedPostLikes
            .AsNoTracking()
            .CountAsync(item => item.FeedPostId == feedPostId, cancellationToken);

        return new FeedLikeResponse(feedPostId, FeedItemSources.UserPost, likeCount, hasLiked);
    }

    private static CommunicationAuditContext MapAuditContext(FeedAuditContext auditContext)
    {
        return new CommunicationAuditContext(
            auditContext.ActorLogin,
            auditContext.ActorDisplayName,
            auditContext.IpAddress,
            auditContext.Origin,
            auditContext.UserAgent);
    }

    private async Task<Dictionary<Guid, int>> LoadFeedPostLikeCountsAsync(
        IReadOnlyCollection<Guid> feedPostIds,
        CancellationToken cancellationToken)
    {
        if (feedPostIds.Count == 0)
        {
            return [];
        }

        return await _dbContext.FeedPostLikes
            .AsNoTracking()
            .Where(item => feedPostIds.Contains(item.FeedPostId))
            .GroupBy(item => item.FeedPostId)
            .Select(group => new { FeedPostId = group.Key, Count = group.Count() })
            .ToDictionaryAsync(item => item.FeedPostId, item => item.Count, cancellationToken);
    }

    private async Task<HashSet<Guid>> LoadLikedFeedPostIdsAsync(
        IReadOnlyCollection<Guid> feedPostIds,
        Guid portalUserId,
        CancellationToken cancellationToken)
    {
        if (feedPostIds.Count == 0)
        {
            return [];
        }

        var ids = await _dbContext.FeedPostLikes
            .AsNoTracking()
            .Where(item => item.PortalUserId == portalUserId && feedPostIds.Contains(item.FeedPostId))
            .Select(item => item.FeedPostId)
            .ToListAsync(cancellationToken);

        return ids.ToHashSet();
    }

    private async Task<Dictionary<Guid, int>> LoadCommunicationLikeCountsAsync(
        IReadOnlyCollection<Guid> communicationIds,
        CancellationToken cancellationToken)
    {
        if (communicationIds.Count == 0)
        {
            return [];
        }

        return await _dbContext.CommunicationLikes
            .AsNoTracking()
            .Where(item => communicationIds.Contains(item.CommunicationId))
            .GroupBy(item => item.CommunicationId)
            .Select(group => new { CommunicationId = group.Key, Count = group.Count() })
            .ToDictionaryAsync(item => item.CommunicationId, item => item.Count, cancellationToken);
    }

    private async Task<HashSet<Guid>> LoadLikedCommunicationIdsAsync(
        IReadOnlyCollection<Guid> communicationIds,
        Guid portalUserId,
        CancellationToken cancellationToken)
    {
        if (communicationIds.Count == 0)
        {
            return [];
        }

        var ids = await _dbContext.CommunicationLikes
            .AsNoTracking()
            .Where(item => item.PortalUserId == portalUserId && communicationIds.Contains(item.CommunicationId))
            .Select(item => item.CommunicationId)
            .ToListAsync(cancellationToken);

        return ids.ToHashSet();
    }
}
