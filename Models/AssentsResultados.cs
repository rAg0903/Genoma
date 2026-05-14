using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Genoma.Models;

[Table("assets_resultados")]
public class AssetsResultados
{
    [Key]
    [Column("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Column("processo_id")]
    public string? ProcessoId { get; set; }

    [Column("url_ficheiro")]
    [Required]
    public string UrlFicheiro { get; set; } = string.Empty;

    [Column("tipo_ficheiro")]
    public string TipoFicheiro { get; set; } = "PDF";

    [Column("data_upload")]
    public DateTime DataUpload { get; set; } = DateTime.Now;

    [ForeignKey("ProcessoId")]
    public Processo? Processo { get; set; }
}