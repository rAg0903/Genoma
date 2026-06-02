using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Genoma.Models;

[Table("teste_empresas")]
public class TesteEmpresa
{
    [Key]
    [Column("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Column("teste_id")]
    public string TesteId { get; set; } = string.Empty;

    [Column("empresa_id")]
    public string EmpresaId { get; set; } = string.Empty;

    [Column("tipo_kit")]
    public string? TipoKit { get; set; }

    [Column("analisa_cromossomas")]
    public bool AnalisaCromossomas { get; set; }

    [Column("analisa_gemeos")]
    public bool AnalisaGemeos { get; set; }

    [Column("analisa_delecoes")]
    public bool AnalisaDelecoes { get; set; }

    [Column("analisa_microdelecoes")]
    public bool AnalisaMicrodelecoes { get; set; }

    [Column("inclui_fraccao_fetal")]
    public bool IncluiFraccaoFetal { get; set; }

    [ForeignKey("TesteId")]
    public Teste? Teste { get; set; }

    [ForeignKey("EmpresaId")]
    public Empresa? Empresa { get; set; }
}
