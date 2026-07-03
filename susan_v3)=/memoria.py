"""
memoria.py — Memoria persistente con SQLite para Susan v3.
Guarda conversaciones, preferencias y contexto de los agentes.
"""

import sqlite3
import json
import os
import time
from typing import List, Dict, Any, Optional
from logger import logger

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "susan_memoria.db")
MAX_MENSAJES = 60


def _get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Inicializa la base de datos con todas las tablas necesarias."""
    with _get_conn() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS conversacion (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                rol       TEXT NOT NULL,
                contenido TEXT NOT NULL,
                ts        REAL DEFAULT (strftime('%s','now'))
            );

            CREATE TABLE IF NOT EXISTS preferencias (
                clave  TEXT PRIMARY KEY,
                valor  TEXT NOT NULL,
                ts     REAL DEFAULT (strftime('%s','now'))
            );

            CREATE TABLE IF NOT EXISTS historial_compras (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                consulta    TEXT NOT NULL,
                tiendas     TEXT,
                resultados  TEXT,
                ts          REAL DEFAULT (strftime('%s','now'))
            );

            CREATE TABLE IF NOT EXISTS historial_emails (
                id       INTEGER PRIMARY KEY AUTOINCREMENT,
                accion   TEXT,
                detalle  TEXT,
                ts       REAL DEFAULT (strftime('%s','now'))
            );

            CREATE TABLE IF NOT EXISTS conocimiento (
                id       INTEGER PRIMARY KEY AUTOINCREMENT,
                fuente   TEXT,
                texto    TEXT NOT NULL,
                etiquetas TEXT,
                ts       REAL DEFAULT (strftime('%s','now'))
            );

            CREATE TABLE IF NOT EXISTS historial_viajes (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                destino   TEXT,
                resultado TEXT,
                ts        REAL DEFAULT (strftime('%s','now'))
            );
        """)
    logger.debug("Base de datos inicializada.")


def agregar_mensaje(rol: str, contenido: str) -> None:
    with _get_conn() as conn:
        conn.execute(
            "INSERT INTO conversacion (rol, contenido) VALUES (?, ?)",
            (rol, contenido[:4000])
        )
        # Mantener límite
        conn.execute("""
            DELETE FROM conversacion
            WHERE id NOT IN (
                SELECT id FROM conversacion ORDER BY id DESC LIMIT ?
            )
        """, (MAX_MENSAJES,))


def cargar_historial(limite: int = 20) -> List[Dict]:
    with _get_conn() as conn:
        rows = conn.execute(
            "SELECT rol, contenido FROM conversacion ORDER BY id DESC LIMIT ?",
            (limite,)
        ).fetchall()
    return [{"rol": r["rol"], "contenido": r["contenido"]} for r in reversed(rows)]


def cargar_memoria_texto(limite: int = 12) -> List[str]:
    """Retorna el historial como lista de strings para el prompt."""
    historial = cargar_historial(limite)
    return [f"{m['rol'].title()}: {m['contenido']}" for m in historial]


def guardar_preferencia(clave: str, valor: Any) -> None:
    with _get_conn() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO preferencias (clave, valor) VALUES (?, ?)",
            (clave, json.dumps(valor, ensure_ascii=False))
        )


def cargar_preferencia(clave: str, defecto: Any = None) -> Any:
    with _get_conn() as conn:
        row = conn.execute(
            "SELECT valor FROM preferencias WHERE clave = ?", (clave,)
        ).fetchone()
    if row:
        try:
            return json.loads(row["valor"])
        except Exception:
            return row["valor"]
    return defecto


def guardar_conocimiento(texto: str, fuente: str = "conversacion", etiquetas: str = "") -> None:
    with _get_conn() as conn:
        conn.execute(
            "INSERT INTO conocimiento (fuente, texto, etiquetas) VALUES (?, ?, ?)",
            (fuente, texto[:2000], etiquetas)
        )


def buscar_conocimiento(consulta: str, max_resultados: int = 3) -> List[str]:
    """Búsqueda simple de texto en la base de conocimiento."""
    palabras = [w for w in consulta.lower().split() if len(w) > 3]
    if not palabras:
        return []
    with _get_conn() as conn:
        resultados = []
        for palabra in palabras[:3]:
            rows = conn.execute(
                "SELECT texto FROM conocimiento WHERE lower(texto) LIKE ? LIMIT ?",
                (f"%{palabra}%", max_resultados)
            ).fetchall()
            for r in rows:
                if r["texto"] not in resultados:
                    resultados.append(r["texto"])
    return resultados[:max_resultados]


def guardar_historial_compras(consulta: str, tiendas: List[str], resultados: List[Dict]) -> None:
    with _get_conn() as conn:
        conn.execute(
            "INSERT INTO historial_compras (consulta, tiendas, resultados) VALUES (?, ?, ?)",
            (consulta, json.dumps(tiendas), json.dumps(resultados[:20], ensure_ascii=False))
        )


def guardar_historial_viaje(destino: str, resultado: str) -> None:
    with _get_conn() as conn:
        conn.execute(
            "INSERT INTO historial_viajes (destino, resultado) VALUES (?, ?)",
            (destino, resultado[:2000])
        )


def limpiar_conversacion() -> None:
    with _get_conn() as conn:
        conn.execute("DELETE FROM conversacion")
    logger.info("Conversación limpiada.")


# Inicializar al importar
init_db()
