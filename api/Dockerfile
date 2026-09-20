# Build and run the API. The repository has no .NET SDK requirement of its own:
# `docker compose build api` is enough to get it running.
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY WowCompanion.Api/WowCompanion.Api.csproj WowCompanion.Api/
RUN dotnet restore WowCompanion.Api/WowCompanion.Api.csproj
COPY . .
RUN dotnet publish WowCompanion.Api/WowCompanion.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
USER $APP_UID
ENTRYPOINT ["dotnet", "WowCompanion.Api.dll"]
