using Genoma.Data;
using Genoma.Models;
using Microsoft.EntityFrameworkCore;

namespace Genoma.Services;

public static class StockService
{
    public static async Task<(bool Sucesso, string? Mensagem)> DescontarPorTesteAsync(
        GenomaContext db, string testeId)
    {
        var stock = await db.StockItems
            .FirstOrDefaultAsync(s => s.Ativo && s.TesteId == testeId);

        if (stock == null)
            return (true, null);

        if (stock.Quantidade <= 0)
            return (false, $"Stock esgotado para o kit «{stock.Nome}».");

        stock.Quantidade--;
        return (true, null);
    }

    public static async Task ReporPorTesteAsync(GenomaContext db, string testeId, int quantidade = 1)
    {
        var stock = await db.StockItems
            .FirstOrDefaultAsync(s => s.Ativo && s.TesteId == testeId);

        if (stock != null)
            stock.Quantidade += quantidade;
    }
}
