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

var app = builder.Build();

app.UseCors(WebOrigins);
app.MapHealthEndpoints();

app.Run();
