"""Generate UI mockup PNGs for Figures 9 and 10 of the CRM Genoma report."""

from pathlib import Path

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, Rectangle

OUT = Path(__file__).parent
TEAL = "#0d9488"
TEAL_LIGHT = "#ccfbf1"
SLATE_50 = "#f8fafc"
SLATE_100 = "#f1f5f9"
SLATE_200 = "#e2e8f0"
SLATE_600 = "#475569"
SLATE_800 = "#1e293b"
WHITE = "#ffffff"


def rounded_card(ax, x, y, w, h, fc=WHITE, ec=SLATE_200, lw=1, radius=0.02):
    box = FancyBboxPatch(
        (x, y),
        w,
        h,
        boxstyle=f"round,pad=0,rounding_size={radius}",
        linewidth=lw,
        edgecolor=ec,
        facecolor=fc,
        transform=ax.transAxes,
        clip_on=False,
    )
    ax.add_patch(box)
    return box


def fig09_pipeline():
    fig, ax = plt.subplots(figsize=(14, 7))
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    fig.patch.set_facecolor(SLATE_50)

    # Sidebar
    rounded_card(ax, 0.01, 0.03, 0.12, 0.94, fc=SLATE_800, ec=SLATE_800)
    ax.text(0.07, 0.92, "GENOMA", ha="center", va="center", fontsize=11, color=WHITE, fontweight="bold")
    for i, item in enumerate(["Dashboard", "Contactos", "Processos", "Stocks", "Listagens", "Admin"]):
        color = TEAL if item == "Processos" else "#94a3b8"
        ax.text(0.07, 0.82 - i * 0.07, item, ha="center", va="center", fontsize=9, color=color)

    # Top bar
    rounded_card(ax, 0.145, 0.88, 0.84, 0.09, fc=WHITE)
    ax.text(0.17, 0.925, "Processos", fontsize=14, fontweight="bold", color=SLATE_800)
    ax.text(0.78, 0.925, "Ctrl+K Pesquisar...", fontsize=9, color=SLATE_600, bbox=dict(boxstyle="round", fc=SLATE_100, ec=SLATE_200))

    # KPI strip
    kpis = [("Atrasados", "3", "#fecaca"), ("Validação", "5", "#fef3c7"), ("A faturar", "2", TEAL_LIGHT)]
    for i, (label, val, bg) in enumerate(kpis):
        x = 0.17 + i * 0.11
        rounded_card(ax, x, 0.78, 0.1, 0.07, fc=bg)
        ax.text(x + 0.05, 0.825, val, ha="center", fontsize=16, fontweight="bold", color=SLATE_800)
        ax.text(x + 0.05, 0.795, label, ha="center", fontsize=8, color=SLATE_600)

    # Kanban columns
    columns = [
        ("Agendado", ["P-2026-0142", "P-2026-0148"], "#e0f2fe"),
        ("Kit Reservado", ["P-2026-0135"], "#dbeafe"),
        ("Colheita Realizada", ["P-2026-0129"], "#ede9fe"),
        ("Em Análise", ["P-2026-0118", "P-2026-0121"], "#fef3c7"),
        ("Resultado Disponível", ["P-2026-0105"], "#ffedd5"),
        ("Validado", ["P-2026-0098"], TEAL_LIGHT),
        ("Faturado", ["P-2026-0087"], "#99f6e4"),
    ]
    col_w = 0.105
    start_x = 0.155
    for idx, (title, cards, bg) in enumerate(columns):
        x = start_x + idx * (col_w + 0.008)
        rounded_card(ax, x, 0.08, col_w, 0.67, fc=SLATE_100, ec=SLATE_200)
        ax.text(x + col_w / 2, 0.72, title, ha="center", fontsize=7.5, fontweight="bold", color=SLATE_800, wrap=True)
        for j, card in enumerate(cards):
            cy = 0.62 - j * 0.12
            rounded_card(ax, x + 0.008, cy, col_w - 0.016, 0.1, fc=bg, ec=SLATE_200)
            ax.text(x + col_w / 2, cy + 0.055, card, ha="center", fontsize=8, color=SLATE_800, fontweight="bold")
            ax.text(x + col_w / 2, cy + 0.025, "NIPT · Dr. Silva", ha="center", fontsize=6.5, color=SLATE_600)

    ax.text(0.5, 0.02, "Vista pipeline Kanban — módulo Processos (ProcessPipeline.tsx)", ha="center", fontsize=9, color=SLATE_600)
    fig.savefig(OUT / "fig09_pipeline_kanban.png", dpi=180, bbox_inches="tight", facecolor=SLATE_50)
    plt.close(fig)


def fig10_admin():
    fig, ax = plt.subplots(figsize=(14, 7))
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    fig.patch.set_facecolor(SLATE_50)

    rounded_card(ax, 0.01, 0.03, 0.12, 0.94, fc=SLATE_800, ec=SLATE_800)
    ax.text(0.07, 0.92, "GENOMA", ha="center", va="center", fontsize=11, color=WHITE, fontweight="bold")
    for i, item in enumerate(["Dashboard", "Contactos", "Processos", "Stocks", "Listagens", "Admin"]):
        color = TEAL if item == "Admin" else "#94a3b8"
        ax.text(0.07, 0.82 - i * 0.07, item, ha="center", va="center", fontsize=9, color=color)

    rounded_card(ax, 0.145, 0.88, 0.84, 0.09, fc=WHITE)
    ax.text(0.17, 0.925, "Administração", fontsize=14, fontweight="bold", color=SLATE_800)

    tabs = ["Utilizadores", "Perfis", "Empresas", "Testes", "Postos", "Laboratórios", "Médicos", "Motivos"]
    for i, tab in enumerate(tabs):
        x = 0.16 + i * 0.095
        active = tab == "Utilizadores"
        ax.text(
            x,
            0.855,
            tab,
            fontsize=8,
            color=TEAL if active else SLATE_600,
            fontweight="bold" if active else "normal",
        )
        if active:
            ax.plot([x - 0.03, x + 0.06], [0.845, 0.845], color=TEAL, linewidth=2)

    rounded_card(ax, 0.145, 0.08, 0.84, 0.74, fc=WHITE)
    ax.text(0.17, 0.76, "Utilizadores", fontsize=12, fontweight="bold", color=SLATE_800)
    ax.text(0.78, 0.76, "+ Novo Utilizador", fontsize=9, color=WHITE, fontweight="bold",
            bbox=dict(boxstyle="round,pad=0.4", fc=TEAL, ec=TEAL))

    # Table header
    rounded_card(ax, 0.16, 0.69, 0.81, 0.05, fc=SLATE_100, ec=SLATE_200)
    headers = ["Nome", "Email", "Perfil", "Estado", "Acções"]
    xs = [0.19, 0.35, 0.55, 0.68, 0.82]
    for h, x in zip(headers, xs):
        ax.text(x, 0.715, h, fontsize=9, fontweight="bold", color=SLATE_600)

    rows = [
        ("Dr. Ana Costa", "ana.costa@genoma.pt", "Médico", "Activo"),
        ("João Pereira", "joao@genoma.pt", "Operacional", "Activo"),
        ("Maria Santos", "maria@genoma.pt", "Gestão", "Activo"),
        ("Admin Genoma", "admin@genoma.pt", "Administrador", "Activo"),
    ]
    for i, (nome, email, perfil, estado) in enumerate(rows):
        y = 0.63 - i * 0.08
        rounded_card(ax, 0.16, y, 0.81, 0.065, fc=WHITE if i % 2 else SLATE_50, ec=SLATE_200, lw=0.5)
        ax.text(0.19, y + 0.032, nome, fontsize=9, color=SLATE_800)
        ax.text(0.35, y + 0.032, email, fontsize=8.5, color=SLATE_600)
        ax.text(0.55, y + 0.032, perfil, fontsize=8.5, color=SLATE_600)
        badge_color = TEAL_LIGHT if estado == "Activo" else "#fecaca"
        ax.text(0.68, y + 0.032, estado, fontsize=8, color=TEAL if estado == "Activo" else "#dc2626",
                bbox=dict(boxstyle="round,pad=0.25", fc=badge_color, ec=badge_color))
        ax.text(0.84, y + 0.032, "Editar", fontsize=8, color=TEAL)

    # Permissions panel hint
    rounded_card(ax, 0.16, 0.12, 0.38, 0.22, fc=SLATE_50, ec=SLATE_200)
    ax.text(0.18, 0.3, "Matriz de Permissões (Perfis)", fontsize=10, fontweight="bold", color=SLATE_800)
    modules = ["Dashboard", "Contactos", "Processos", "Stocks", "Admin"]
    for r, mod in enumerate(modules):
        ax.text(0.18, 0.26 - r * 0.035, mod, fontsize=8, color=SLATE_600)
        for c in range(3):
            cx = 0.38 + c * 0.035
            rect = Rectangle((cx, 0.245 - r * 0.035), 0.025, 0.025, transform=ax.transAxes,
                               facecolor=TEAL if c < 2 else SLATE_200, edgecolor=SLATE_200)
            ax.add_patch(rect)

    ax.text(0.5, 0.02, "Mockup — Módulo de Administração (/definicoes)", ha="center", fontsize=9, color=SLATE_600)
    fig.savefig(OUT / "fig10_administracao.png", dpi=180, bbox_inches="tight", facecolor=SLATE_50)
    plt.close(fig)


if __name__ == "__main__":
    fig09_pipeline()
    fig10_admin()
    print("Mockups generated: fig09_pipeline_kanban.png, fig10_administracao.png")
