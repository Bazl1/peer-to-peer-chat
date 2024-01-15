using System;

namespace p2pChat.Models;

public class UserConnection : IEquatable<UserConnection>
{
    public required string ConnectionId { get; set; }
    public required string UserName { get; set; }

    public static UserConnection Create(string connectionId, string userName)
    {
        return new UserConnection
        {
            ConnectionId = connectionId,
            UserName = userName
        };
    }

    public bool Equals(UserConnection? other)
    {
        return other is not null && 
            ConnectionId == other.ConnectionId &&
            UserName == other.UserName;
    }
}