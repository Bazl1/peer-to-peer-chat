using System.Collections.Generic;
using p2pChat.Models;

namespace p2pChat.Stores;

public class Store
{
    public List<UserConnection> Users { get; } = new();
    public List<Room> Rooms { get; } = new();
}