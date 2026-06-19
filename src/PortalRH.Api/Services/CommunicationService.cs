using Microsoft.EntityFrameworkCore;
using PortalRH.Api.Contracts.Communications;
using PortalRH.Api.Data;
using PortalRH.Api.Interfaces;
using PortalRH.Api.Models;
using System.Globalization;
using System.Text;

namespace PortalRH.Api.Services;

public class CommunicationService : ICommunicationService
{
    private readonly PortalRhDbContext _dbContext;

    public CommunicationService(PortalRhDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<CommunicationDto>> GetAllAsync(CancellationToken cancellationToken)
    {
        var items = await _dbContext.Communications
            .AsNoTracking()
            .OrderByDescending(item => item.PublishedAt)
            .ThenByDescending(item => item.CreatedAtUtc)
            .ToListAsync(cancellationToken);

        return items.Select(MapToDto).ToList();
    }

    public async Task<CommunicationDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var entity = await _dbContext.Communications
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

        return entity is null ? null : MapToDto(entity);
    }

    public async Task<CommunicationDto?> GetBySlugAsync(string slug, CancellationToken cancellationToken)
    {
        var normalizedSlug = NormalizeSlug(slug);

        var entity = await _dbContext.Communications
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Slug == normalizedSlug, cancellationToken);

        return entity is null ? null : MapToDto(entity);
    }

    public async Task<CommunicationDto> CreateAsync(UpsertCommunicationRequest request, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var slug = await GenerateUniqueSlugAsync(request.Title, null, cancellationToken);

        var entity = new Communication
        {
            Id = Guid.NewGuid(),
            Slug = slug,
            Category = request.Category.Trim(),
            Priority = request.Priority.Trim(),
            Title = request.Title.Trim(),
            Summary = request.Summary.Trim(),
            Body = request.Body.Trim(),
            Audience = request.Audience.Trim(),
            Channel = request.Channel.Trim(),
            Status = request.Status.Trim(),
            AttachmentLabel = request.AttachmentLabel.Trim(),
            Owner = request.Owner.Trim(),
            ImageUrl = string.IsNullOrWhiteSpace(request.ImageUrl) ? null : request.ImageUrl.Trim(),
            IsFeatured = request.IsFeatured,
            PublishedAt = request.PublishedAt,
            CreatedAtUtc = now,
            UpdatedAtUtc = now
        };

        _dbContext.Communications.Add(entity);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return MapToDto(entity);
    }

    public async Task<CommunicationDto?> UpdateAsync(Guid id, UpsertCommunicationRequest request, CancellationToken cancellationToken)
    {
        var entity = await _dbContext.Communications
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

        if (entity is null)
        {
            return null;
        }

        entity.Slug = await GenerateUniqueSlugAsync(request.Title, id, cancellationToken);
        entity.Category = request.Category.Trim();
        entity.Priority = request.Priority.Trim();
        entity.Title = request.Title.Trim();
        entity.Summary = request.Summary.Trim();
        entity.Body = request.Body.Trim();
        entity.Audience = request.Audience.Trim();
        entity.Channel = request.Channel.Trim();
        entity.Status = request.Status.Trim();
        entity.AttachmentLabel = request.AttachmentLabel.Trim();
        entity.Owner = request.Owner.Trim();
        entity.ImageUrl = string.IsNullOrWhiteSpace(request.ImageUrl) ? null : request.ImageUrl.Trim();
        entity.IsFeatured = request.IsFeatured;
        entity.PublishedAt = request.PublishedAt;
        entity.UpdatedAtUtc = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return MapToDto(entity);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        var entity = await _dbContext.Communications
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

        if (entity is null)
        {
            return false;
        }

        _dbContext.Communications.Remove(entity);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }

    private static CommunicationDto MapToDto(Communication item)
    {
        return new CommunicationDto(
            item.Id,
            item.Slug,
            item.Category,
            item.Priority,
            item.Title,
            item.Summary,
            item.Body,
            item.Audience,
            item.Channel,
            item.Status,
            item.AttachmentLabel,
            item.Owner,
            item.ImageUrl,
            item.IsFeatured,
            item.PublishedAt,
            item.CreatedAtUtc,
            item.UpdatedAtUtc);
    }

    private async Task<string> GenerateUniqueSlugAsync(string title, Guid? currentId, CancellationToken cancellationToken)
    {
        var baseSlug = NormalizeSlug(title);
        var slugSeed = string.IsNullOrWhiteSpace(baseSlug) ? $"comunicado-{Guid.NewGuid():N}" : baseSlug;
        var candidate = slugSeed;
        var suffix = 1;

        while (await _dbContext.Communications.AnyAsync(
                   item => item.Slug == candidate && (!currentId.HasValue || item.Id != currentId.Value),
                   cancellationToken))
        {
            candidate = $"{slugSeed}-{suffix++}";
        }

        return candidate;
    }

    private static string NormalizeSlug(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var normalized = value.Trim().ToLowerInvariant().Normalize(NormalizationForm.FormD);
        var chars = normalized
            .Where(c => CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
            .Select(c => char.IsLetterOrDigit(c) ? c : '-')
            .ToArray();

        var slug = new string(chars);

        while (slug.Contains("--", StringComparison.Ordinal))
        {
            slug = slug.Replace("--", "-", StringComparison.Ordinal);
        }

        return slug.Trim('-');
    }
}
