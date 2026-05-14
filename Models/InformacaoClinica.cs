using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Genoma.Models;

[Table("informacao_clinica")]
public class InformacaoClinica
{
    [Key]
    [Column("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Column("processo_id")]
    public string? ProcessoId { get; set; }

    [Column("semanas_gravidez")]
    public int? SemanasGravidez { get; set; }

    [Column("dias_gravidez")]
    public int? DiasGravidez { get; set; }

    [Column("tipo_gravidez")]
    public string? TipoGravidez { get; set; }

    [Column("quer_saber_sexo")]
    public bool QuerSaberSexo { get; set; } = false;

    [Column("motivo_prescricao")]
    public string? MotivoPrescricao { get; set; }

    [Column("data_registo")]
    public DateTime DataRegisto { get; set; } = DateTime.Now;

    [ForeignKey("ProcessoId")]
    public Processo? Processo { get; set; }
}