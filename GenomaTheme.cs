using MudBlazor;

namespace Genoma;

public static class GenomaTheme
{
    public static MudTheme Theme { get; } = new()
    {
        PaletteLight = new PaletteLight
        {
            Primary = "#1A1C1E",
            Secondary = "#6F42C1",
            Tertiary = "#007BFF",
            Info = "#007BFF",
            Success = "#28A745",
            Warning = "#FFC107",
            Error = "#DC3545",
            AppbarBackground = "#FFFFFF",
            AppbarText = "#1A1C1E",
            Background = "#F8F9FA",
            Surface = "#FFFFFF",
            TextPrimary = "#1A1C1E",
            TextSecondary = "#6C757D",
            DrawerBackground = "#FFFFFF",
            DrawerText = "#495057",
            ActionDefault = "#6C757D",
            Divider = "#E9ECEF",
            TableLines = "#E9ECEF",
            LinesDefault = "#E9ECEF"
        },
        PaletteDark = new PaletteDark
        {
            Primary = "#E9ECEF",
            Secondary = "#B794F6",
            Tertiary = "#63B3FF",
            Info = "#63B3FF",
            Success = "#48BB78",
            Warning = "#ECC94B",
            Error = "#FC8181",
            AppbarBackground = "#1A1C1E",
            AppbarText = "#F8F9FA",
            Background = "#121212",
            Surface = "#1E1E1E",
            TextPrimary = "#F8F9FA",
            TextSecondary = "#ADB5BD",
            DrawerBackground = "#1A1C1E",
            DrawerText = "#CED4DA",
            ActionDefault = "#ADB5BD",
            Divider = "#343A40",
            TableLines = "#343A40",
            LinesDefault = "#343A40"
        },
        LayoutProperties = new LayoutProperties
        {
            DefaultBorderRadius = "12px"
        },
        Typography = new Typography
        {
            Default = new DefaultTypography { FontFamily = ["Inter", "Roboto", "Helvetica", "Arial", "sans-serif"] }
        }
    };
}
