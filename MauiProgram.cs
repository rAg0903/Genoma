using Genoma.Data;
using Microsoft.EntityFrameworkCore;
using MudBlazor.Services;

namespace Genoma;

public static class MauiProgram
{
    public static MauiApp CreateMauiApp()
    {
        var builder = MauiApp.CreateBuilder();
        builder
            .UseMauiApp<App>()
            .ConfigureFonts(fonts =>
            {
                fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
            });

        builder.Services.AddMauiBlazorWebView();
        builder.Services.AddMudServices();

        var connectionString = "Server=127.0.0.1;Port=3306;Database=genoma_db;User=root;Password=root;";
        var serverVersion = new MySqlServerVersion(new Version(12, 1, 0));

        builder.Services.AddDbContext<GenomaContext>(options =>
            options.UseMySql(connectionString, serverVersion));

#if DEBUG
        builder.Services.AddBlazorWebViewDeveloperTools();
#endif

        return builder.Build();
    }
}