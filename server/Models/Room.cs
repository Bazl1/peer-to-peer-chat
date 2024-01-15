using System;
using System.Collections.Generic;

namespace p2pChat.Models;

public class Room
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public required string Name { get; set; }
    private List<UserConnection> _members = new();
    public IReadOnlyCollection<UserConnection> Members => _members.AsReadOnly();

    public static Room Create(string name)
    {
        return new Room
        {
            Name = name
        };
    }

    public void AddMember(UserConnection member)
    {
        _members.Add(member);
    }

    public void RemoveMember(UserConnection member)
    {
        _members.Remove(member);
    }
}