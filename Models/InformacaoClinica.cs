using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Genoma.Models;

[Table("informacao_clinica")]
public class InformacaoClinica
{
    [Key]
    [Column("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Column("processo_id")]
    public string? ProcessoId { get; set; }

    [Column("medico_nome")]
    public string? MedicoNome { get; set; }

    [Column("onde_seguida")]
    public string? OndeSeguida { get; set; }

    [Column("semanas_gravidez")]
    public int? SemanasGravidez { get; set; }

    [Column("dias_gravidez")]
    public int? DiasGravidez { get; set; }

    [Column("semanas_actual")]
    public int? SemanasActual { get; set; }

    [Column("dias_actual")]
    public int? DiasActual { get; set; }

    [Column("data_prevista_parto")]
    public DateTime? DataPrevistaParto { get; set; }

    [Column("fertilizacao")]
    public string? Fertilizacao { get; set; }

    [Column("tipo_gravidez")]
    public string? TipoGravidez { get; set; }

    [Column("gravidez_singular")]
    public bool GravidezSingular { get; set; } = true;

    [Column("gravidez_gemelar")]
    public bool GravidezGemelar { get; set; }

    [Column("quer_saber_sexo")]
    public bool QuerSaberSexo { get; set; }

    [Column("servico_expresso")]
    public bool ServicoExpresso { get; set; }

    [Column("motivo_prescricao")]
    public string? MotivoPrescricao { get; set; }

    [Column("motivo_idade_avancada")]
    public bool MotivoIdadeAvancada { get; set; }

    [Column("motivo_ansiedade")]
    public bool MotivoAnsiedade { get; set; }

    [Column("motivo_rastreio")]
    public bool MotivoRastreio { get; set; }

    [Column("motivo_anomalia_eco")]
    public bool MotivoAnomaliaEco { get; set; }

    [Column("motivo_gravidez_anterior")]
    public bool MotivoGravidezAnterior { get; set; }

    [Column("id_order")]
    public string? IdOrder { get; set; }

    [Column("id_paciente_clinico")]
    public string? IdPacienteClinico { get; set; }

    [Column("data_registo")]
    public DateTime DataRegisto { get; set; } = DateTime.Now;

    [ForeignKey("ProcessoId")]
    public Processo? Processo { get; set; }
}
