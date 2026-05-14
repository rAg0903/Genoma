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

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    [ForeignKey("ProcessoId")]
    public Processo? Processo { get; set; }

    [ForeignKey("PostoId")]
    public Posto? Posto { get; set; }
}