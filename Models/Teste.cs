using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Genoma.Models;

[Table("testes")]
public class Teste
{
    [Key]
    [Column("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Column("nome")]
    [Required]
    public string Nome { get; set; } = string.Empty;

    [Column("preco")]
    public decimal Preco { get; set; } = 0;

    [Column("descricao")]
    public string? Descricao { get; set; }

    [Column("ativo")]
    public bool Ativo { get; set; } = true;
}