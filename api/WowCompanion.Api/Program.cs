using WowCompanion.Api.Blizzard;
using WowCompanion.Api.Endpoints;

var builder = WebApplication.CreateBuilder(args);

// The web is a static site on another origin in development; in production the reverse
// proxy puts both behind the same origin and this policy is never exercised.
const string WebOrigins = "web-origins";
var allowedOrigins = builder.Configuration.GetValue<string>("AllowedOrigins")?.Split(',')
                     ?? ["http://localhost:4321"];

builder.Services.AddCors(options =>
    options.AddPolicy(WebOrigins, policy => policy
        .WithOrigins(allowedOrigins)
        .WithMethods("GET")
        .AllowAnyHeader()));

builder.Services.Configure<BlizzardOptions>(
    builder.Configuration.GetSection(BlizzardOptions.SectionName));

builder.Services.AddHttpClient(BlizzardOptions.HttpClientName, client =>
    client.Timeout = TimeSpan.FromSeconds(10));

// Singletons: the OAuth token and the cached answer are shared by the whole process, so
// every visitor rides the same few-minute answer and we stay well inside the rate limits.
builder.Services.AddSingleton<BlizzardTokenProvider>();
builder.Services.AddSingleton<RealmStatusClient>();
builder.Services.AddSingleton<RealmStatusCache>();

var app = builder.Build();

app.UseCors(WebOrigins);
app.MapHealthEndpoints();
app.MapRealmStatusEndpoints();

app.Run();
