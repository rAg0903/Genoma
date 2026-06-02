using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Genoma.Models;

[Table("facturacao")]
public class Facturacao
{
    [Key]
    [Column("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Column("processo_id")]
    public string? ProcessoId { get; set; }

    [Column("preco_teste")]
    public decimal PrecoTeste { get; set; } = 0;

    [Column("numero_fatura")]
    public string? NumeroFatura { get; set; }

    [Column("data_fatura")]
    public DateTime? DataFatura { get; set; }

    [Column("entidade_multibanco")]
    public string? EntidadeMultibanco { get; set; }

    [Column("referencia_multibanco")]
    public string? ReferenciaMultibanco { get; set; }

    [Column("comissao")]
    public bool Comissao { get; set; } = false;

    [Column("nao_gera_comissao")]
    public bool NaoGeraComissao { get; set; }

    [Column("valor_factura")]
    public decimal? ValorFactura { get; set; }

    [Column("pago")]
    public bool Pago { get; set; }

    [Column("data_envio_email")]
    public DateTime? DataEnvioEmail { get; set; }

    [Column("data_envio_sms")]
    public DateTime? DataEnvioSms { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.Now;

    [ForeignKey("ProcessoId")]
    public Processo? Processo { get; set; }
}