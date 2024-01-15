using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using p2pChat.Hubs;
using p2pChat.Stores;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSignalR();
builder.Services.AddSingleton<Store, Store>();

var _myAllowSpecificOrigins = "MyAllowSpecificPolicy";
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: _myAllowSpecificOrigins,
        policy =>
        {
            policy.WithOrigins("http://localhost:5173")
                .AllowCredentials()
                .AllowAnyMethod()
                .AllowAnyHeader();
        }
    );
});

var app = builder.Build();

app.UseCors(_myAllowSpecificOrigins);
app.MapHub<MeetingsHub>("meetings");

app.Run();