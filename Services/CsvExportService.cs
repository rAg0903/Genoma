using System.Diagnostics;
using System.Text;
using MudBlazor;

namespace Genoma.Services;

public class CsvExportService
{
    private readonly ISnackbar _snackbar;

    public CsvExportService(ISnackbar snackbar) => _snackbar = snackbar;

    public async Task ExportAsync(string filename, IEnumerable<string> lines)
    {
        try
        {
            var conteudo = string.Join('\n', lines);
            if (string.IsNullOrWhiteSpace(conteudo))
            {
                _snackbar.Add("Nada para exportar.", Severity.Warning);
                return;
            }

            var pasta = ObterPastaExportacao();
            Directory.CreateDirectory(pasta);

            var caminho = CaminhoUnico(pasta, filename);
            var encoding = new UTF8Encoding(encoderShouldEmitUTF8Identifier: true);
            await File.WriteAllTextAsync(caminho, conteudo, encoding);

            RevelarNoFinder(caminho);
            _snackbar.Add($"CSV guardado em Transferências: {Path.GetFileName(caminho)}", Severity.Success);
        }
        catch (Exception ex)
        {
            _snackbar.Add($"Erro ao exportar: {ex.Message}", Severity.Error);
        }
    }

    private static string ObterPastaExportacao()
    {
        var home = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
        var downloads = Path.Combine(home, "Downloads");
        if (Directory.Exists(downloads))
            return downloads;

        return Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),
            "GENOMA",
            "Exportacoes");
    }

    private static string CaminhoUnico(string pasta, string filename)
    {
        var caminho = Path.Combine(pasta, filename);
        if (!File.Exists(caminho))
            return caminho;

        var baseNome = Path.GetFileNameWithoutExtension(filename);
        var ext = Path.GetExtension(filename);
        var stamp = DateTime.Now.ToString("HHmmss");
        return Path.Combine(pasta, $"{baseNome}_{stamp}{ext}");
    }

    private static void RevelarNoFinder(string caminho)
    {
        try
        {
            if (OperatingSystem.IsMacOS() || OperatingSystem.IsMacCatalyst())
            {
                Process.Start(new ProcessStartInfo
                {
                    FileName = "open",
                    Arguments = $"-R \"{caminho}\"",
                    UseShellExecute = false
                });
            }
        }
        catch
        {
            // Opcional — o ficheiro já foi guardado
        }
    }

    public static string Escape(string? valor)
    {
        if (string.IsNullOrEmpty(valor))
            return string.Empty;

        return valor.Contains(';') || valor.Contains('"') || valor.Contains('\n') || valor.Contains('\r')
            ? $"\"{valor.Replace("\"", "\"\"")}\""
            : valor;
    }

    public static string Line(params object?[] colunas) =>
        string.Join(';', colunas.Select(c => Escape(Formato(c))));

    private static string Formato(object? valor) => valor switch
    {
        null => string.Empty,
        DateTime dt => dt.ToString("dd/MM/yyyy"),
        DateTimeOffset dto => dto.ToString("dd/MM/yyyy"),
        decimal d => d.ToString("N2"),
        double d => d.ToString("N2"),
        float f => f.ToString("N2"),
        bool b => b ? "Sim" : "Não",
        _ => valor.ToString() ?? string.Empty
    };

    public static string NomeFicheiro(string baseNome) =>
        $"{baseNome}_{DateTime.Now:yyyy-MM-dd}.csv";
}
