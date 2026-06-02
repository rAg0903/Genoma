using Genoma.Data;
using Genoma.Models;
using Genoma.Services;
using Microsoft.AspNetCore.Components;
using Microsoft.EntityFrameworkCore;
using MudBlazor;

namespace Genoma.Components.Pages;

public partial class Listagens
{
    [Inject] private GenomaContext DB { get; set; } = default!;
    [Inject] private NavigationManager Nav { get; set; } = default!;
    [Inject] private CsvExportService Csv { get; set; } = default!;

    private List<Paciente> contactos = new();
    private List<Processo> processos = new();
    private List<Facturacao> faturas = new();
    private decimal totalFaturado;
    private string? erro;
    private bool carregando = true;

    protected override async Task OnInitializedAsync()
    {
        try
        {
            contactos = await DB.Pacientes.AsNoTracking().Where(p => p.Ativo).OrderBy(p => p.Nome).ToListAsync();
            processos = await DB.Processos.AsNoTracking()
                .Include(p => p.Paciente)
                .Include(p => p.Teste)
                .Include(p => p.ProcessoKit)
                .Include(p => p.Colheita)
                .Include(p => p.ResultadoClinico)
                .Include(p => p.InformacaoClinica)
                .Where(p => p.Ativo)
                .OrderByDescending(p => p.DataEntrada).ToListAsync();
            faturas = await DB.Facturacao.AsNoTracking()
                .Include(f => f.Processo!).ThenInclude(p => p.Paciente)
                .Where(f => f.Processo!.Ativo).OrderByDescending(f => f.CreatedAt).ToListAsync();
            totalFaturado = faturas.Where(f => f.NumeroFatura != null).Sum(f => f.PrecoTeste);
        }
        catch (Exception ex) { erro = ex.Message; }
        finally { carregando = false; }
    }

    private void AbrirContactoListagem(TableRowClickEventArgs<Paciente> args)
    {
        if (args.Item is null) return;
        Nav.NavigateTo("/contactos/" + args.Item.Id);
    }

    private void AbrirProcessoListagem(TableRowClickEventArgs<Processo> args)
    {
        if (args.Item is null) return;
        Nav.NavigateTo("/processos/" + args.Item.Id);
    }

    private void AbrirFaturaListagem(TableRowClickEventArgs<Facturacao> args)
    {
        if (args.Item is null) return;
        Nav.NavigateTo("/processos/" + args.Item.ProcessoId);
    }

    private Task ExportarContactos() =>
        Csv.ExportAsync(CsvExportService.NomeFicheiro("contactos"), CsvExportRows.Contactos(contactos));

    private Task ExportarProcessos() =>
        Csv.ExportAsync(CsvExportService.NomeFicheiro("processos"), CsvExportRows.Processos(processos));

    private Task ExportarFaturacao() =>
        Csv.ExportAsync(CsvExportService.NomeFicheiro("faturacao"), CsvExportRows.Faturacao(faturas));
}
