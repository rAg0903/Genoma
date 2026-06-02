using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Genoma.Models;

[Table("postos")]
public class Posto
{
    [Key]
    [Column("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Column("entidade_id")]
    public string? EntidadeId { get; set; }

    [Column("nome")]
    [Required]
    public string Nome { get; set; } = string.Empty;

    [Column("codigo_posto")]
    public string? CodigoPosto { get; set; }

    [Column("localizacao")]
    public string? Localizacao { get; set; }

    [Column("morada")]
    public string? Morada { get; set; }

    [Column("telefone")]
    public string? Telefone { get; set; }

    [Column("horario")]
    public string? Horario { get; set; }

    [ForeignKey("EntidadeId")]
    public Empresa? Empresa { get; set; }
}