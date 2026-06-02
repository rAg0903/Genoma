using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Genoma.Models;

[Table("stocks")]
public class StockItem
{
    [Key]
    [Column("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Column("nome")]
    [Required]
    public string Nome { get; set; } = string.Empty;

    [Column("descricao")]
    public string? Descricao { get; set; }

    [Column("quantidade")]
    public int Quantidade { get; set; }

    [Column("quantidade_minima")]
    public int QuantidadeMinima { get; set; } = 5;

    [Column("teste_id")]
    public string? TesteId { get; set; }

    [Column("localizacao")]
    public string Localizacao { get; set; } = "Armazem";

    [Column("laboratorio_nome")]
    public string? LaboratorioNome { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    [Column("ativo")]
    public bool Ativo { get; set; } = true;

    [ForeignKey("TesteId")]
    public Teste? Teste { get; set; }
}
