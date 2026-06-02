using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Genoma.Models;

[Table("colheitas")]
public class Colheita
{
    [Key]
    [Column("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Column("processo_id")]
    public string? ProcessoId { get; set; }

    [Column("posto_id")]
    public string? PostoId { get; set; }

    [Column("data_prevista")]
    public DateTime? DataPrevista { get; set; }

    [Column("periodo")]
    public string? Periodo { get; set; }

    [Column("data_efetiva")]
    public DateTime? DataEfetiva { get; set; }

    [Column("facturado_entidade")]
    public bool FacturadoEntidade { get; set; }

    [Column("repeticao")]
    public bool Repeticao { get; set; }

    [Column("nao_notificar")]
    public bool NaoNotificar { get; set; }

    [Column("semanas_gestacao_colheita")]
    public int? SemanasGestacaoColheita { get; set; }

    [Column("dias_gestacao_colheita")]
    public int? DiasGestacaoColheita { get; set; }

    [Column("data_recepcao_amostra")]
    public DateTime? DataRecepcaoAmostra { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    [ForeignKey("ProcessoId")]
    public Processo? Processo { get; set; }

    [ForeignKey("PostoId")]
    public Posto? Posto { get; set; }
}
