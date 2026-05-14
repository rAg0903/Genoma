using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Genoma.Models;

[Table("empresas")]
public class Empresa
{
    [Key]
    [Column("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Column("nome")]
    [Required]
    public string Nome { get; set; } = string.Empty;

    [Column("morada")]
    public string? Morada { get; set; }

    [Column("codigo_postal")]
    public string? CodigoPostal { get; set; }

    [Column("telefone")]
    public string? Telefone { get; set; }

    [Column("email")]
    public string? Email { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    [Column("ativo")]
    public bool Ativo { get; set; } = true;
}