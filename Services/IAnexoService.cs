namespace Genoma.Services;

public interface IAnexoService
{
    Task<(string CaminhoRelativo, string NomeFicheiro)?> SelecionarEGuardarAsync(string processoId);
    Task AbrirAnexoAsync(string caminhoRelativo);
    string ObterNomeFicheiro(string caminhoRelativo);
}

public class AnexoService : IAnexoService
{
    public async Task<(string CaminhoRelativo, string NomeFicheiro)?> SelecionarEGuardarAsync(string processoId)
    {
        var ficheiro = await FilePicker.Default.PickAsync(new PickOptions
        {
            PickerTitle = "Selecionar anexo",
            FileTypes = FilePickerFileType.Pdf
        });

        if (ficheiro == null)
            return null;

        var pasta = Path.Combine(FileSystem.AppDataDirectory, "anexos", processoId);
        Directory.CreateDirectory(pasta);

        var destino = Path.Combine(pasta, ficheiro.FileName);
        await using var origem = await ficheiro.OpenReadAsync();
        await using var destinoStream = File.Create(destino);
        await origem.CopyToAsync(destinoStream);

        var relativo = Path.Combine("anexos", processoId, ficheiro.FileName);
        return (relativo, ficheiro.FileName);
    }

    public async Task AbrirAnexoAsync(string caminhoRelativo)
    {
        var caminho = Path.Combine(FileSystem.AppDataDirectory, caminhoRelativo);
        if (!File.Exists(caminho))
            throw new FileNotFoundException("Anexo não encontrado.", caminho);

        await Launcher.Default.OpenAsync(new OpenFileRequest
        {
            File = new ReadOnlyFile(caminho)
        });
    }

    public string ObterNomeFicheiro(string caminhoRelativo) =>
        Path.GetFileName(caminhoRelativo);
}
