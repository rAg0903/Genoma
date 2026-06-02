using Genoma.Models;

namespace Genoma.Services;

public static class CsvExportRows
{
    public static IEnumerable<string> Contactos(IEnumerable<Paciente> items)
    {
        yield return CsvExportService.Line(
            "Nome", "Data Nascimento", "NIF", "Telemóvel", "Telefone", "Email",
            "Morada", "Localidade", "Distrito", "Criado em");

        foreach (var c in items)
        {
            yield return CsvExportService.Line(
                c.Nome, c.DataNascimento, c.Nif, c.Telemovel, c.TelefoneFixo, c.Email,
                c.Morada, c.Localidade, c.Distrito, c.CreatedAt);
        }
    }

    public static IEnumerable<string> Processos(IEnumerable<Processo> items)
    {
        yield return CsvExportService.Line(
            "N.º Processo", "Paciente", "NIF", "Teste", "Estado", "Anulado", "Motivo Anulação",
            "Data Entrada", "N.º Kit", "Tracking", "Empresa Kit", "Localização Kit",
            "ID Amostra", "Médico", "Notas");

        foreach (var p in items)
        {
            yield return CsvExportService.Line(
                p.NumeroProcesso,
                p.Paciente?.Nome,
                p.Paciente?.Nif,
                p.Teste?.Nome,
                ObterEstadoProcesso(p),
                p.Anulado,
                p.MotivoAnulacao,
                p.DataEntrada,
                p.ProcessoKit?.NumeroKit,
                p.ProcessoKit?.TrackingNumber,
                p.ProcessoKit?.EmpresaKit,
                p.ProcessoKit?.LocalizacaoKit,
                p.ResultadoClinico?.IdAmostra,
                p.InformacaoClinica?.MedicoNome,
                p.Notas);
        }
    }

    public static IEnumerable<string> Faturacao(IEnumerable<Facturacao> items)
    {
        yield return CsvExportService.Line(
            "Processo", "Paciente", "Preço Teste (€)", "Valor Fatura (€)", "Pago",
            "N.º Fatura", "Data Fatura", "Estado", "Entidade MB", "Referência MB",
            "Comissão", "Não Gera Comissão", "Data Envio Email", "Data Envio SMS");

        foreach (var f in items)
        {
            var estado = f.NumeroFatura == null ? "Pendente" : "Faturada";
            yield return CsvExportService.Line(
                f.Processo?.NumeroProcesso,
                f.Processo?.Paciente?.Nome,
                f.PrecoTeste,
                f.ValorFactura,
                f.Pago,
                f.NumeroFatura,
                f.DataFatura,
                estado,
                f.EntidadeMultibanco,
                f.ReferenciaMultibanco,
                f.Comissao,
                f.NaoGeraComissao,
                f.DataEnvioEmail,
                f.DataEnvioSms);
        }
    }

    public static IEnumerable<string> Stocks(IEnumerable<StockItem> items)
    {
        yield return CsvExportService.Line(
            "Nome", "Descrição", "Teste", "Localização", "Laboratório",
            "Quantidade", "Mínimo", "Estado");

        foreach (var s in items)
        {
            var estado = s.Quantidade <= s.QuantidadeMinima ? "Baixo" : "OK";
            var local = s.Localizacao == "Laboratorio"
                ? $"Lab: {s.LaboratorioNome ?? "—"}"
                : "Armazém";

            yield return CsvExportService.Line(
                s.Nome, s.Descricao, s.Teste?.Nome, local, s.LaboratorioNome,
                s.Quantidade, s.QuantidadeMinima, estado);
        }
    }

    public static IEnumerable<string> Testes(IEnumerable<Teste> items)
    {
        yield return CsvExportService.Line(
            "Nome", "Tipo", "Resposta (dias)", "Cromossomas", "Preço Venda (€)", "Preço Compra (€)");

        foreach (var t in items)
        {
            yield return CsvExportService.Line(
                t.Nome, t.TipoTeste, t.TempoRespostaDias, ResumoCromossomas(t),
                t.Preco, t.PrecoCompra);
        }
    }

    public static IEnumerable<string> Empresas(IEnumerable<Empresa> items)
    {
        yield return CsvExportService.Line("Nome", "Telefone", "Email");

        foreach (var e in items)
            yield return CsvExportService.Line(e.Nome, e.Telefone, e.Email);
    }

    public static IEnumerable<string> Postos(IEnumerable<Posto> items)
    {
        yield return CsvExportService.Line("Nome", "Empresa", "Código", "Localização");

        foreach (var p in items)
            yield return CsvExportService.Line(p.Nome, p.Empresa?.Nome, p.CodigoPosto, p.Localizacao);
    }

    private static string ObterEstadoProcesso(Processo p)
    {
        if (p.Anulado)
            return "Anulado";

        if (p.ResultadoClinico?.DataRelatorioLaboratorio != null)
            return "Concluído";
        if (p.ResultadoClinico?.DataEnvioLaboratorio != null)
            return "Em análise";
        if (p.Colheita?.DataEfetiva != null)
            return "Colhido";

        return "Pendente";
    }

    private static string ResumoCromossomas(Teste t)
    {
        var lista = t.CromossomasAnalisados;
        if (lista.Count == 0) return "—";
        if (lista.Count == 23) return "1–23";
        return string.Join(", ", lista.OrderBy(n => n));
    }
}
