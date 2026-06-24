using System.ComponentModel.DataAnnotations;

namespace PortalRH.Api.Contracts.Polls;

public class SubmitPollVoteRequest
{
    [Required]
    [MinLength(1)]
    public List<Guid> OptionIds { get; set; } = [];
}
