using Genoma.Data;
using Genoma.Models;
using Microsoft.AspNetCore.Components;
using Microsoft.EntityFrameworkCore;
using Microsoft.JSInterop;
using MudBlazor;

namespace Genoma.Components.Pages;

public partial class Listagens
{
    [Inject] private GenomaContext DB { get; set; } = default!;
    [Inject] private NavigationManager Nav { get; set; } = default!;
    [Inject] private IJSRuntime JS { get; set; } = default!;
    [Inject] private ISnackbar Snackbar { get; set; } = default!;

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
            processos = await DB.Processos.AsNoTracking().Include(p => p.Paciente).Where(p => p.Ativo)
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

    private async Task ExportarContactos()
    {
        var linhas = new List<string> { "Nome;NIF;Telemóvel;Email;Criado em" };
        linhas.AddRange(contactos.Select(c =>
            $"{Csv(c.Nome)};{Csv(c.Nif)};{Csv(c.Telemovel)};{Csv(c.Email)};{c.CreatedAt:dd/MM/yyyy}"));
        await DescarregarCsv("contactos.csv", linhas);
    }

    private async Task ExportarProcessos()
    {
        var linhas = new List<string> { "N.º Processo;Paciente;Data Entrada;Notas" };
        linhas.AddRange(processos.Select(p =>
            $"{Csv(p.NumeroProcesso)};{Csv(p.Paciente?.Nome)};{p.DataEntrada:dd/MM/yyyy};{Csv(p.Notas)}"));
        await DescarregarCsv("processos.csv", linhas);
    }

    private async Task ExportarFaturacao()
    {
        var linhas = new List<string> { "Processo;Paciente;Preço;N.º Fatura;Estado" };
        linhas.AddRange(faturas.Select(f =>
        {
            var estado = f.NumeroFatura == null ? "Pendente" : "Faturada";
            return $"{Csv(f.Processo?.NumeroProcesso)};{Csv(f.Processo?.Paciente?.Nome)};{f.PrecoTeste.ToString("N2")};{Csv(f.NumeroFatura)};{estado}";
        }));
        await DescarregarCsv("faturacao.csv", linhas);
    }

    private async Task DescarregarCsv(string ficheiro, IEnumerable<string> linhas)
    {
        try
        {
            await JS.InvokeVoidAsync("genoma.downloadCsv", ficheiro, string.Join('\n', linhas));
            Snackbar.Add($"Ficheiro {ficheiro} exportado.", Severity.Success);
        }
        catch (Exception ex)
        {
            Snackbar.Add($"Erro ao exportar: {ex.Message}", Severity.Error);
        }
    }

    private static string Csv(string? valor)
    {
        if (string.IsNullOrEmpty(valor)) return "";
        return valor.Contains(';') || valor.Contains('"')
            ? $"\"{valor.Replace("\"", "\"\"")}\""
            : valor;
    }
}
