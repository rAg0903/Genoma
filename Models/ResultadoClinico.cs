using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Genoma.Models;

[Table("resultados_clinicos")]
public class ResultadoClinico
{
    [Key]
    [Column("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Column("processo_id")]
    public string ProcessoId { get; set; } = string.Empty;

    [Column("data_envio_laboratorio")]
    public DateTime? DataEnvioLaboratorio { get; set; }

    [Column("data_recepcao_laboratorio")]
    public DateTime? DataRecepcaoLaboratorio { get; set; }

    [Column("data_relatorio_laboratorio")]
    public DateTime? DataRelatorioLaboratorio { get; set; }

    [Column("id_amostra")]
    public string? IdAmostra { get; set; }

    [Column("resultado_cromossomas_sexuais")]
    public string? ResultadoCromossomasSexuais { get; set; }

    [Column("cromossomas_sexuais")]
    public string? CromossomasSexuais { get; set; }

    [Column("fraccao_fetal")]
    public decimal? FraccaoFetal { get; set; }

    [Column("sugerir_repeticao")]
    public bool SugerirRepeticao { get; set; }

    [Column("sem_anomalias")]
    public bool SemAnomalias { get; set; } = true;

    [Column("resultados_cromossomas")]
    public string? ResultadosCromossomasJson { get; set; }

    [ForeignKey("ProcessoId")]
    public Processo? Processo { get; set; }

    [NotMapped]
    public Dictionary<int, string> ResultadosCromossomas
    {
        get => string.IsNullOrEmpty(ResultadosCromossomasJson)
            ? new Dictionary<int, string>()
            : System.Text.Json.JsonSerializer.Deserialize<Dictionary<int, string>>(ResultadosCromossomasJson) ?? new();
        set => ResultadosCromossomasJson = System.Text.Json.JsonSerializer.Serialize(value);
    }
}
