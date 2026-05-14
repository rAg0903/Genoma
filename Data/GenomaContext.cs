using System.Diagnostics;
using Genoma.Models;
using Microsoft.EntityFrameworkCore;

namespace Genoma.Data;

public class GenomaContext : DbContext
{
    public GenomaContext(DbContextOptions<GenomaContext> options) : base(options) { }

    public DbSet<Paciente> Pacientes { get; set; }
    public DbSet<Processo> Processos { get; set; }
    public DbSet<InformacaoClinica> InformacaoClinica { get; set; }
    public DbSet<Colheita> Colheitas { get; set; }
    public DbSet<Facturacao> Facturacao { get; set; }
    public DbSet<AssetsResultados> AssetsResultados { get; set; }
    public DbSet<Posto> Postos { get; set; }
    public DbSet<Empresa> Empresas { get; set; }
    public DbSet<Utilizador> Utilizadores { get; set; }
    public DbSet<Perfil> Perfis { get; set; }
    public DbSet<Teste> Testes { get; set; }
}