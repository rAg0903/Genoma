using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Genoma.Models;

[Table("utilizadores")]
public class Utilizador
{
    [Key]
    [Column("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Column("perfil_id")]
    public string? PerfilId { get; set; }

    [Column("empresa_id")]
    public string? EmpresaId { get; set; }

    [Column("nome")]
    [Required]
    public string Nome { get; set; } = string.Empty;

    [Column("email")]
    [Required]
    public string Email { get; set; } = string.Empty;

    [Column("telefone")]
    public string? Telefone { get; set; }

    [Column("password_hash")]
    public string PasswordHash { get; set; } = string.Empty;

    [Column("ativo")]
    public bool Ativo { get; set; } = true;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    [ForeignKey("PerfilId")]
    public Perfil? Perfil { get; set; }

    [ForeignKey("EmpresaId")]
    public Empresa? Empresa { get; set; }
}