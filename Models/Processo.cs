using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Genoma.Models;

[Table("processos")]
public class Processo
{
    [Key]
    [Column("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Column("numero_processo")]
    [Required]
    public string NumeroProcesso { get; set; } = string.Empty;

    [Column("paciente_id")]
    public string? PacienteId { get; set; }

    [Column("medico_id")]
    public string? MedicoId { get; set; }

    [Column("posto_id")]
    public string? PostoId { get; set; }

    [Column("kit_id")]
    public string? KitId { get; set; }

    [Column("teste_id")]
    public string? TesteId { get; set; }

    [Column("status_id")]
    public string? StatusId { get; set; }

    [Column("data_entrada")]
    public DateTime DataEntrada { get; set; } = DateTime.Now;

    [Column("notas")]
    public string? Notas { get; set; }

    [Column("ativo")]
    public bool Ativo { get; set; } = true;

    // Navegação
    [ForeignKey("PacienteId")]
    public Paciente? Paciente { get; set; }

    [ForeignKey("PostoId")]
    public Posto? Posto { get; set; }

    [ForeignKey("TesteId")]
    public Teste? Teste { get; set; }

    public InformacaoClinica? InformacaoClinica { get; set; }
    public Colheita? Colheita { get; set; }
    public Facturacao? Facturacao { get; set; }
    public ICollection<AssetsResultados> Assets { get; set; } = new List<AssetsResultados>();
}