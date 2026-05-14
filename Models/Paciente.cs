using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Diagnostics;

namespace Genoma.Models;

[Table("pacientes")]
public class Paciente
{
    [Key]
    [Column("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Column("nome")]
    [Required]
    public string Nome { get; set; } = string.Empty;

    [Column("data_nascimento")]
    public DateTime DataNascimento { get; set; }

    [Column("genero")]
    public string? Genero { get; set; }

    [Column("nif")]
    public string? Nif { get; set; }

    [Column("telemovel")]
    public string? Telemovel { get; set; }

    [Column("email")]
    public string? Email { get; set; }

    [Column("morada")]
    public string? Morada { get; set; }

    [Column("altura")]
    public decimal? Altura { get; set; }

    [Column("peso")]
    public decimal? Peso { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    [Column("ativo")]
    public bool Ativo { get; set; } = true;

    // Navegação
    public ICollection<Processo> Processos { get; set; } = new List<Processo>();
}