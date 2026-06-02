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

    [Column("preco_compra")]
    public decimal PrecoCompra { get; set; }

    [Column("tempo_resposta_dias")]
    public int? TempoRespostaDias { get; set; }

    [Column("tempo_minimo_gestacao_semanas")]
    public int? TempoMinimoGestacaoSemanas { get; set; }

    [Column("tipo_teste")]
    public string? TipoTeste { get; set; }

    [Column("descricao")]
    public string? Descricao { get; set; }

    [Column("ativo")]
    public bool Ativo { get; set; } = true;

    [Column("cromossomas_analisados")]
    public string? CromossomasAnalisadosJson { get; set; }

    [NotMapped]
    public List<int> CromossomasAnalisados
    {
        get => string.IsNullOrEmpty(CromossomasAnalisadosJson)
            ? new List<int>()
            : System.Text.Json.JsonSerializer.Deserialize<List<int>>(CromossomasAnalisadosJson) ?? new();
        set => CromossomasAnalisadosJson = value.Count == 0
            ? null
            : System.Text.Json.JsonSerializer.Serialize(value.OrderBy(n => n).ToList());
    }

    public ICollection<TesteEmpresa> TesteEmpresas { get; set; } = new List<TesteEmpresa>();
}