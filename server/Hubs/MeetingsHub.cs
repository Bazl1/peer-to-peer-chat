using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using p2pChat.Models;
using p2pChat.Stores;

namespace p2pChat.Hubs;

public class MeetingsHub(
    ILogger<MeetingsHub> _logger
) : Hub
{
    private const string CALL_ME = "Call:Me";
    private const string CALL_ANSWER = "Call:Answer";

    public async Task Call(string to, string userName)
    {
        var from = Context.ConnectionId;
        _logger.LogInformation($"User:{Context.ConnectionId} calls to user:{to}");
        await Clients
            .Client(to)
            .SendAsync(CALL_ME, from, userName);
    }

    public async Task CallAnswer(string to, bool callAnswer)
    {
        var from = Context.ConnectionId;
        _logger.LogInformation($"Call from:{from} to:{to} answer: {callAnswer}");
        await Clients
            .Client(to)
            .SendAsync(CALL_ANSWER, from, callAnswer);
    }
}