namespace Genoma.Services;

public class PreferenciasAppService
{
    private const string DarkModeKey = "genoma_dark_mode";
    private const string DrawerOpenKey = "genoma_drawer_open";

    public bool IsDarkMode
    {
        get => Preferences.Get(DarkModeKey, false);
        set => Preferences.Set(DarkModeKey, value);
    }

    public bool DrawerOpen
    {
        get => Preferences.Get(DrawerOpenKey, true);
        set => Preferences.Set(DrawerOpenKey, value);
    }
}
