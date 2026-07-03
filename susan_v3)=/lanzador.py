"""
lanzador.py — Punto de entrada principal de Susan v3.
Uso: python lanzador.py            → Interfaz gráfica
     python lanzador.py --consola  → Modo texto (sin GUI)
"""

import sys, os

# Asegurar que el directorio del proyecto esté en el path
DIR = os.path.dirname(os.path.abspath(__file__))
if DIR not in sys.path:
    sys.path.insert(0, DIR)


def modo_consola():
    """Inicia Susan en modo texto para terminales sin GUI."""
    from susan import responder
    from memoria import cargar_memoria_texto

    print("╔══════════════════════════════════════╗")
    print("║      SUSAN v3 — Modo Consola         ║")
    print("║  Escribe 'salir' para terminar       ║")
    print("╚══════════════════════════════════════╝\n")
    print("Susan: ¡Hola! Soy Susan v3. ¿En qué puedo ayudarte?\n")

    while True:
        try:
            entrada = input("Tú: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nSusan: ¡Hasta luego!")
            break

        if not entrada:
            continue
        if entrada.lower() in {"salir", "exit", "quit", "adiós", "chau"}:
            print("Susan: ¡Hasta luego! Que tengas un excelente día.")
            break

        print("Susan: ", end="", flush=True)

        def _token(tok: str):
            print(tok, end="", flush=True)

        try:
            respuesta = responder(entrada, on_token=_token)
            if not respuesta.strip():
                print("(sin respuesta)")
            else:
                # Si el streaming ya imprimió, agregar salto de línea
                print()
        except Exception as exc:
            print(f"\n[Error] {exc}")
        print()


def modo_gui():
    """Inicia Susan con la interfaz gráfica completa."""
    try:
        from ui import SusanUI
        app = SusanUI()
        app.mainloop()
    except ImportError as e:
        print(f"[Error] Falta una dependencia: {e}")
        print("Ejecuta: pip install -r requirements.txt")
        print("O prueba el modo consola: python lanzador.py --consola")
        sys.exit(1)
    except Exception as e:
        print(f"[Error crítico] {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


def verificar_dependencias():
    """Verifica dependencias críticas antes de arrancar."""
    faltantes = []
    criticas  = {
        "customtkinter": "pip install customtkinter",
        "PIL":           "pip install Pillow",
        "pygame":        "pip install pygame",
    }
    for modulo, cmd in criticas.items():
        try:
            __import__(modulo)
        except ImportError:
            faltantes.append((modulo, cmd))

    if faltantes:
        print("⚠ Faltan dependencias críticas:")
        for m, c in faltantes:
            print(f"  • {m} → {c}")
        print("\nInstala todas con: pip install -r requirements.txt\n")
        return False
    return True


def main():
    consola = "--consola" in sys.argv or "--console" in sys.argv or \
              "--no-gui"  in sys.argv

    print("Susan v3 — Iniciando…")

    if consola:
        modo_consola()
    else:
        if not verificar_dependencias():
            print("Iniciando en modo consola como alternativa…\n")
            modo_consola()
        else:
            modo_gui()


if __name__ == "__main__":
    main()
