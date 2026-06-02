window.genoma = {
    downloadCsv: function (filename, content) {
        const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    },

    setDarkMode: function (enabled) {
        document.documentElement.classList.toggle("genoma-dark", enabled);
        document.body.classList.toggle("genoma-dark", enabled);
        document.documentElement.style.colorScheme = enabled ? "dark" : "light";
    },

    printElement: function (elementId) {
        const el = document.getElementById(elementId);
        if (!el) return;

        const printRoot = document.createElement("div");
        printRoot.className = "genoma-fatura-print-root";
        printRoot.appendChild(el.cloneNode(true));
        document.body.appendChild(printRoot);

        const cleanup = () => {
            printRoot.remove();
            window.removeEventListener("afterprint", cleanup);
        };
        window.addEventListener("afterprint", cleanup);
        window.print();
        setTimeout(cleanup, 1000);
    }
};
