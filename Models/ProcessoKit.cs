using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Genoma.Models;

[Table("processo_kits")]
public class ProcessoKit
{
    [Key]
    [Column("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Column("processo_id")]
    public string ProcessoId { get; set; } = string.Empty;

    [Column("lote")]
    public string? Lote { get; set; }

    [Column("data_expiracao")]
    public string? DataExpiracao { get; set; }

    [Column("empresa_kit")]
    public string? EmpresaKit { get; set; }

    [Column("localizacao_kit")]
    public string? LocalizacaoKit { get; set; }

    [Column("numero_kit")]
    public string? NumeroKit { get; set; }

    [Column("tracking_number")]
    public string? TrackingNumber { get; set; }

    [ForeignKey("ProcessoId")]
    public Processo? Processo { get; set; }
}
