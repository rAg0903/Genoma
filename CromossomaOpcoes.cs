namespace Genoma;

public static class CromossomaOpcoes
{
    public static readonly int[] Numeros = Enumerable.Range(1, 23).ToArray();

    public const string SemAnomalia = "Sem anomalia";

    /// <summary>Opções quando se assinala anomalia num cromossoma concreto.</summary>
    public static readonly string[] TiposAnomalia =
        ["Alto Risco", "Baixo Risco", "Normal", "Não analisado"];

    public static readonly string[] ResultadosCromossoma =
        [SemAnomalia, .. TiposAnomalia];

    public static readonly string[] ResultadosSexuais =
        ["", SemAnomalia, .. TiposAnomalia];

    public static readonly int[] PresetNipt21 = [13, 18, 21];
    public static readonly int[] PresetNiptBasico = [13, 18, 21, 22, 23];
    public static readonly int[] PresetTodos = Numeros;

    public static readonly string[] LocalizacoesKit =
        ["Armazém Genoma", "Laboratório externo", "Em trânsito", "Cliente"];

    public static readonly string[] Fertilizacao =
        ["Natural", "In vitro", "In vitro (de dadora)", "Outro"];

    public static readonly string[] TiposTeste =
        ["Teste Geral MaterniTY", "NIPT Standard", "NIPT Extended", "Outro"];

    public static readonly string[] TiposKit =
        ["MaterniTY", "MaterniT 21", "MaterniT Genome", "Outro"];

    public static void InicializarSemAnomalia(Dictionary<int, string> resultados, IEnumerable<int> cromossomas)
    {
        foreach (var n in cromossomas)
            resultados[n] = SemAnomalia;
    }

    public static bool TemAnomalia(string? resultado) =>
        !string.IsNullOrEmpty(resultado) && resultado != SemAnomalia;
}
