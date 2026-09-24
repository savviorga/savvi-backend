#!/usr/bin/env python3
"""
Migración del sistema anterior (MySQL "coysafinance") al esquema nuevo de Savvi
(PostgreSQL, schema `finance`).

El dump viejo (`old_database.sql`) trae cuatro tablas que no tienen equivalente
directo en el modelo nuevo, así que el mapeo se hace campo por campo:

    users            -> finance.users
    tb_tipo_gastos   -> finance.categories        (type = 'egreso')
    tb_gastos        -> finance.transactions      (type = 'egreso')
    tb_revenues      -> finance.transactions      (type = 'ingreso')
                     -> finance.categories        ("Ingresos", type = 'ingreso')
                     -> finance.accounts          ("Migración", una por usuario)

Decisiones de adaptación:

  * El modelo viejo no tiene cuentas y `transactions.account` es NOT NULL, así
    que cada usuario migrado recibe una cuenta llamada "Migración" con saldo 0.
  * `transactions` guarda el NOMBRE de la categoría y de la cuenta (varchar),
    no su UUID; así lo hace el resto de la aplicación.
  * `tb_gastos.cantidad` y `precio_unidad` no existen en el modelo nuevo: se
    conservan dentro de `description`.
  * `tb_gastos.urlfile` se anexa a `description` como `url: <enlace>`.
  * Los emails que ya existen en la base destino se migran con sufijo `_old`
    en la parte local (johnssther@gmail.com -> johnssther_old@gmail.com).

Todos los UUID se derivan con uuid5 a partir del id viejo, así que la carga es
idempotente: volver a correr el script no duplica nada, y `--rollback` puede
deshacer exactamente lo que se insertó.

Uso:
    python3 migrate_to_postgres.py --dry-run     # muestra el plan, no escribe
    python3 migrate_to_postgres.py               # migra (pide confirmación)
    python3 migrate_to_postgres.py --yes         # migra sin preguntar
    python3 migrate_to_postgres.py --rollback    # borra lo migrado

Requiere psycopg2. Si no está instalado:
    python3 -m venv .venv && .venv/bin/pip install psycopg2-binary
    .venv/bin/python migrate_to_postgres.py
"""

from __future__ import annotations

import argparse
import os
import re
import sys
import uuid
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Any, Iterable

try:
    import psycopg2
    from psycopg2.extras import execute_values
except ImportError:  # pragma: no cover
    sys.exit(
        'Falta psycopg2. Instálalo en un entorno virtual:\n'
        '    python3 -m venv .venv && .venv/bin/pip install psycopg2-binary\n'
        '    .venv/bin/python migrate_to_postgres.py'
    )

BASE_DIR = Path(__file__).resolve().parent
DUMP_FILE = BASE_DIR / 'old_database.sql'
ENV_FILE = BASE_DIR.parent / '.env'

SCHEMA = 'finance'

# Namespace fijo: garantiza que el mismo registro viejo produzca siempre el
# mismo UUID, en cualquier máquina y en cualquier corrida.
NAMESPACE = uuid.UUID('6f3a1c58-7b2e-5d41-9a8c-0e4b7f2d1a93')

# Nombre de la cuenta que agrupa todo lo migrado (el sistema viejo no tenía
# cuentas y `transactions.account` es NOT NULL).
ACCOUNT_NAME = 'Migración'

# Categoría destino de los ingresos: tb_revenues no tiene categoría propia.
INCOME_CATEGORY = 'Ingresos'

MIGRATION_TAG = 'Migrado del sistema anterior'


# ---------------------------------------------------------------------------
# Parser del dump de MySQL
# ---------------------------------------------------------------------------

# Secuencias de escape de MySQL dentro de literales entre comillas simples.
MYSQL_ESCAPES = {
    '0': '\0',
    'b': '\b',
    'n': '\n',
    'r': '\r',
    't': '\t',
    'Z': '\x1a',
    '\\': '\\',
    "'": "'",
    '"': '"',
    '%': '\\%',
    '_': '\\_',
}


def unescape(literal: str) -> str | None:
    """Convierte un literal del dump ('texto', NULL, 123) a un valor Python."""
    literal = literal.strip()
    if literal.upper() == 'NULL' or literal == '':
        return None
    if not (literal.startswith("'") and literal.endswith("'")):
        return literal  # número sin comillas

    raw = literal[1:-1]
    out: list[str] = []
    i = 0
    while i < len(raw):
        char = raw[i]
        if char == '\\' and i + 1 < len(raw):
            out.append(MYSQL_ESCAPES.get(raw[i + 1], raw[i + 1]))
            i += 2
        elif char == "'" and i + 1 < len(raw) and raw[i + 1] == "'":
            out.append("'")
            i += 2
        else:
            out.append(char)
            i += 1
    return ''.join(out)


def split_tuples(block: str) -> list[list[str]]:
    """Separa `(a, b, c), (d, e, f)` respetando comillas y escapes."""
    rows: list[list[str]] = []
    i, n = 0, len(block)

    while i < n:
        if block[i] != '(':
            i += 1
            continue

        depth, j = 1, i + 1
        current, values, in_quotes = '', [], False

        while j < n:
            char = block[j]
            if in_quotes:
                if char == '\\':
                    current += block[j:j + 2]
                    j += 2
                    continue
                if char == "'":
                    if j + 1 < n and block[j + 1] == "'":
                        current += "''"
                        j += 2
                        continue
                    in_quotes = False
                current += char
                j += 1
                continue

            if char == "'":
                in_quotes = True
            elif char == '(':
                depth += 1
            elif char == ')':
                depth -= 1
                if depth == 0:
                    values.append(current)
                    break
            elif char == ',' and depth == 1:
                values.append(current)
                current = ''
                j += 1
                continue
            current += char
            j += 1

        rows.append([unescape(v) for v in values])
        i = j + 1

    return rows


def read_table(sql: str, table: str, columns: list[str]) -> list[dict[str, Any]]:
    """Extrae todas las filas de los INSERT INTO `table` del dump."""
    rows: list[dict[str, Any]] = []
    pattern = re.compile(r'INSERT INTO `%s` \([^)]*\) VALUES\s*' % re.escape(table))

    for match in pattern.finditer(sql):
        start = match.end()
        end = sql.index(';\n', start)
        for values in split_tuples(sql[start:end]):
            if len(values) != len(columns):
                raise ValueError(
                    f'{table}: se esperaban {len(columns)} columnas, '
                    f'llegaron {len(values)}: {values[:3]}...'
                )
            rows.append(dict(zip(columns, values)))

    return rows


def load_old_database() -> dict[str, list[dict[str, Any]]]:
    """Lee el dump y devuelve las cuatro tablas del sistema viejo."""
    if not DUMP_FILE.exists():
        sys.exit(f'No se encontró el dump: {DUMP_FILE}')

    sql = DUMP_FILE.read_text(encoding='utf-8', errors='replace')

    return {
        'users': read_table(sql, 'users', [
            'id', 'name', 'last_name', 'email', 'email_verified_at', 'username',
            'password', 'active', 'api_token', 'remember_token',
            'created_at', 'updated_at',
        ]),
        'tipos': read_table(sql, 'tb_tipo_gastos', [
            'id', 'gasto', 'tipogastos_usuario',
        ]),
        'gastos': read_table(sql, 'tb_gastos', [
            'id', 'gasto', 'cantidad', 'precio_unidad', 'precio_total', 'fecha',
            'user_id', 'tipogasto_id', 'urlfile', 'justification', 'expense_id',
        ]),
        'revenues': read_table(sql, 'tb_revenues', [
            'id', 'revenue_dt', 'revenue_name', 'revenue_amount',
            'revenue_description', 'revenue_saving_percentaje', 'revenue_user',
        ]),
    }


# ---------------------------------------------------------------------------
# Utilidades de transformación
# ---------------------------------------------------------------------------

def new_id(kind: str, *parts: Any) -> str:
    """UUID determinista para un registro viejo."""
    return str(uuid.uuid5(NAMESPACE, f'{kind}:' + ':'.join(str(p) for p in parts)))


def money(value: float) -> str:
    """Formatea un monto al estilo colombiano: 1234567.0 -> '1.234.567'."""
    rounded = round(float(value), 2)
    if rounded == int(rounded):
        return f'{int(rounded):,}'.replace(',', '.')
    return f'{rounded:,.2f}'.replace(',', '#').replace('.', ',').replace('#', '.')


def to_date(value: str | None) -> str | None:
    """Normaliza 'YYYY-MM-DD' o 'YYYY-MM-DD HH:MM:SS' a 'YYYY-MM-DD'."""
    if not value:
        return None
    value = value.strip()
    if value.startswith('0000'):
        return None
    return value.split(' ')[0]


def to_timestamp(value: str | None) -> datetime | None:
    if not value or value.strip().startswith('0000'):
        return None
    try:
        return datetime.strptime(value.strip(), '%Y-%m-%d %H:%M:%S')
    except ValueError:
        return None


def clean(text: str | None) -> str:
    return (text or '').strip()


def truncate(text: str, limit: int) -> str:
    return text if len(text) <= limit else text[:limit - 1].rstrip() + '…'


# ---------------------------------------------------------------------------
# Transformación: viejo -> nuevo
# ---------------------------------------------------------------------------

def build_users(old_users: list[dict], taken_emails: set[str]) -> list[dict]:
    """
    users -> finance.users

      name          <- name + last_Name
      email         <- email (con sufijo `_old` si ya existe en destino)
      password      <- hash bcrypt original ($2y$, compatible con node-bcrypt)
      createdAt     <- created_at (o now() si venía NULL)

    Se descartan username, api_token, remember_token, active y
    email_verified_at: el modelo nuevo no tiene esos campos.
    """
    users = []
    used = set(taken_emails)

    for row in old_users:
        full_name = ' '.join(filter(None, [clean(row['name']), clean(row['last_name'])]))
        email = clean(row['email']).lower()

        # Desambiguación de emails que ya existen en la base destino.
        if email in used:
            local, _, domain = email.partition('@')
            candidate = f'{local}_old@{domain}'
            suffix = 2
            while candidate in used:
                candidate = f'{local}_old{suffix}@{domain}'
                suffix += 1
            email = candidate
        used.add(email)

        created = to_timestamp(row['created_at']) or datetime.now()
        users.append({
            'id': new_id('user', row['id']),
            'old_id': row['id'],
            'name': truncate(full_name or f'Usuario {row["id"]}', 255),
            'email': truncate(email, 255),
            'password': row['password'],
            'createdAt': created,
            'updatedAt': to_timestamp(row['updated_at']) or created,
        })

    return users


def build_accounts(users: list[dict]) -> list[dict]:
    """Una cuenta "Migración" por usuario: el sistema viejo no tenía cuentas."""
    return [{
        'id': new_id('account', user['old_id']),
        'user_id': user['id'],
        'name': ACCOUNT_NAME,
        'description': f'{MIGRATION_TAG}. Los registros anteriores a 2026 no '
                       'tenían cuenta asociada.',
        'balance': 0,
    } for user in users]


def build_categories(
    old_tipos: list[dict],
    old_gastos: list[dict],
    old_revenues: list[dict],
    users: list[dict],
) -> tuple[list[dict], dict[tuple[str, str], str]]:
    """
    tb_tipo_gastos -> finance.categories (type='egreso')

    `categories.user_id` es NOT NULL, pero 12 de los 35 tipos viejos eran
    globales (tipogastos_usuario = NULL). Por eso la categoría se replica por
    usuario, y sólo para las combinaciones que de verdad se usan:

      - los tipos que el usuario creó (tipogastos_usuario = su id), y
      - los tipos que aparecen en sus gastos.

    Los tipos globales quedan marcados con isDefault = true.

    Devuelve además el índice (old_user_id, tipo_id) -> nombre de categoría,
    porque `transactions.category` guarda el nombre, no el UUID.
    """
    tipos = {row['id']: row for row in old_tipos}
    by_old_id = {user['old_id']: user for user in users}

    # Combinaciones (usuario, tipo) que hay que crear.
    needed: dict[str, set[str]] = defaultdict(set)
    for tipo in old_tipos:
        owner = tipo['tipogastos_usuario']
        if owner and owner in by_old_id:
            needed[owner].add(tipo['id'])
    for gasto in old_gastos:
        if gasto['user_id'] in by_old_id:
            needed[gasto['user_id']].add(gasto['tipogasto_id'])

    categories: list[dict] = []
    index: dict[tuple[str, str], str] = {}

    for old_user_id, tipo_ids in sorted(needed.items(), key=lambda kv: int(kv[0])):
        user = by_old_id[old_user_id]
        for tipo_id in sorted(tipo_ids, key=int):
            tipo = tipos.get(tipo_id)
            if tipo is None:
                continue  # gasto con tipogasto_id huérfano
            name = truncate(clean(tipo['gasto']), 100)
            categories.append({
                'id': new_id('category', old_user_id, tipo_id),
                'user_id': user['id'],
                'name': name,
                'type': 'egreso',
                'description': f'{MIGRATION_TAG} (tipo de gasto #{tipo_id}).',
                'isDefault': tipo['tipogastos_usuario'] is None,
            })
            index[(old_user_id, tipo_id)] = name

    # tb_revenues no tiene categoría: una sola "Ingresos" por usuario con ingresos.
    for old_user_id in sorted({r['revenue_user'] for r in old_revenues}, key=int):
        user = by_old_id.get(old_user_id)
        if user is None:
            continue
        categories.append({
            'id': new_id('category', old_user_id, 'ingresos'),
            'user_id': user['id'],
            'name': INCOME_CATEGORY,
            'type': 'ingreso',
            'description': f'{MIGRATION_TAG} (tabla tb_revenues).',
            'isDefault': False,
        })

    return categories, index


def expense_description(gasto: dict) -> str:
    """
    Arma `description` a partir de los campos que el modelo nuevo no tiene.

        Empanadas
        Cantidad: 3 x $1.000
        <justification>
        url: https://...
    """
    lines = [clean(gasto['gasto']) or 'Gasto sin descripción']

    cantidad = int(float(gasto['cantidad'] or 1))
    unidad = float(gasto['precio_unidad'] or 0)
    if cantidad != 1 and unidad > 0:
        lines.append(f'Cantidad: {cantidad} x ${money(unidad)}')

    justification = clean(gasto['justification'])
    if justification:
        lines.append(justification)

    urlfile = clean(gasto['urlfile'])
    if urlfile:
        lines.append(f'url: {urlfile}')

    return '\n'.join(lines)


def income_description(revenue: dict) -> str:
    """`revenue_name` + `revenue_description` (si aporta algo distinto)."""
    name = clean(revenue['revenue_name'])
    detail = clean(revenue['revenue_description'])
    lines = [name or 'Ingreso']
    if detail and detail.lower() != name.lower():
        lines.append(detail)
    return '\n'.join(lines)


def build_transactions(
    old_gastos: list[dict],
    old_revenues: list[dict],
    users: list[dict],
    category_index: dict[tuple[str, str], str],
) -> tuple[list[dict], list[str]]:
    """
    tb_gastos   -> finance.transactions (type='egreso')
    tb_revenues -> finance.transactions (type='ingreso')

      date        <- fecha / revenue_dt (sólo la parte fecha)
      amount      <- precio_total / revenue_amount
      category    <- nombre de la categoría (no el UUID)
      account     <- "Migración"
      description <- ver expense_description() / income_description()

    `precio_total` manda sobre cantidad x precio_unidad: hay 32 filas donde no
    cuadran y el total es el valor que el sistema viejo sumaba en sus reportes.
    """
    by_old_id = {user['old_id']: user for user in users}
    transactions: list[dict] = []
    warnings: list[str] = []

    for gasto in old_gastos:
        user = by_old_id.get(gasto['user_id'])
        if user is None:
            warnings.append(f'gasto #{gasto["id"]}: user_id {gasto["user_id"]} inexistente')
            continue

        date = to_date(gasto['fecha'])
        if date is None:
            warnings.append(f'gasto #{gasto["id"]}: fecha inválida ({gasto["fecha"]!r})')
            continue

        category = category_index.get((gasto['user_id'], gasto['tipogasto_id']))
        if category is None:
            warnings.append(f'gasto #{gasto["id"]}: tipogasto_id {gasto["tipogasto_id"]} huérfano')
            continue

        transactions.append({
            'id': new_id('gasto', gasto['id']),
            'user_id': user['id'],
            'date': date,
            'type': 'egreso',
            'amount': round(float(gasto['precio_total'] or 0), 2),
            'category': category,
            'account': ACCOUNT_NAME,
            'description': expense_description(gasto),
        })

    for revenue in old_revenues:
        user = by_old_id.get(revenue['revenue_user'])
        if user is None:
            warnings.append(f'ingreso #{revenue["id"]}: revenue_user {revenue["revenue_user"]} inexistente')
            continue

        date = to_date(revenue['revenue_dt'])
        if date is None:
            warnings.append(f'ingreso #{revenue["id"]}: fecha inválida ({revenue["revenue_dt"]!r})')
            continue

        transactions.append({
            'id': new_id('revenue', revenue['id']),
            'user_id': user['id'],
            'date': date,
            'type': 'ingreso',
            'amount': round(float(revenue['revenue_amount'] or 0), 2),
            'category': INCOME_CATEGORY,
            'account': ACCOUNT_NAME,
            'description': income_description(revenue),
        })

    return transactions, warnings


# ---------------------------------------------------------------------------
# Conexión y carga
# ---------------------------------------------------------------------------

def read_env() -> dict[str, str]:
    """Credenciales desde el .env del backend, con override por variables de entorno."""
    values: dict[str, str] = {}
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text(encoding='utf-8').splitlines():
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            key, _, value = line.partition('=')
            values[key.strip()] = value.strip().strip('"').strip("'")

    for key in ('DB_HOST', 'DB_PORT', 'DB_USERNAME', 'DB_PASSWORD', 'DB_NAME'):
        if os.environ.get(key):
            values[key] = os.environ[key]

    return values


def connect(env: dict[str, str]):
    return psycopg2.connect(
        host=env.get('DB_HOST', 'localhost'),
        port=int(env.get('DB_PORT', 5432)),
        user=env.get('DB_USERNAME', 'postgres'),
        password=env.get('DB_PASSWORD', ''),
        dbname=env.get('DB_NAME', 'db_savvi_dev'),
        options=f'-c search_path={SCHEMA},public',
    )


def existing_emails(cursor) -> set[str]:
    cursor.execute(f'SELECT lower(email) FROM {SCHEMA}.users')
    return {row[0] for row in cursor.fetchall()}


def insert_batch(cursor, table: str, columns: list[str], rows: list[dict]) -> int:
    """INSERT ... ON CONFLICT DO NOTHING; devuelve cuántas filas entraron."""
    if not rows:
        return 0

    quoted = ', '.join(f'"{column}"' for column in columns)
    # `fetch=True` + RETURNING para contar todos los lotes: cursor.rowcount sólo
    # refleja el último page_size.
    result = execute_values(
        cursor,
        f'INSERT INTO {SCHEMA}."{table}" ({quoted}) VALUES %s '
        f'ON CONFLICT DO NOTHING RETURNING 1',
        [tuple(row[column] for column in columns) for row in rows],
        page_size=500,
        fetch=True,
    )
    return len(result)


def load(connection, plan: dict[str, list[dict]]) -> dict[str, int]:
    """Inserta todo en una sola transacción, respetando las llaves foráneas."""
    inserted: dict[str, int] = {}
    with connection.cursor() as cursor:
        inserted['users'] = insert_batch(cursor, 'users', [
            'id', 'name', 'email', 'password', 'createdAt', 'updatedAt',
        ], plan['users'])

        inserted['accounts'] = insert_batch(cursor, 'accounts', [
            'id', 'user_id', 'name', 'description', 'balance',
        ], plan['accounts'])

        inserted['categories'] = insert_batch(cursor, 'categories', [
            'id', 'user_id', 'name', 'type', 'description', 'isDefault',
        ], plan['categories'])

        inserted['transactions'] = insert_batch(cursor, 'transactions', [
            'id', 'user_id', 'date', 'type', 'amount', 'category', 'account',
            'description',
        ], plan['transactions'])

    return inserted


def rollback(connection, plan: dict[str, list[dict]]) -> dict[str, int]:
    """Borra exactamente los UUID que produce este script."""
    deleted: dict[str, int] = {}
    with connection.cursor() as cursor:
        for table in ('transactions', 'categories', 'accounts', 'users'):
            ids = [row['id'] for row in plan[table]]
            if not ids:
                deleted[table] = 0
                continue
            cursor.execute(
                f'DELETE FROM {SCHEMA}."{table}" WHERE id = ANY(%s::uuid[])',
                (ids,),
            )
            deleted[table] = cursor.rowcount
    return deleted


# ---------------------------------------------------------------------------
# Reporte
# ---------------------------------------------------------------------------

def report(plan: dict[str, list[dict]], warnings: list[str]) -> None:
    users_by_id = {user['id']: user for user in plan['users']}
    stats: dict[str, dict[str, Any]] = defaultdict(
        lambda: {'egreso': 0, 'ingreso': 0, 'monto_egreso': 0.0, 'monto_ingreso': 0.0}
    )
    for transaction in plan['transactions']:
        entry = stats[transaction['user_id']]
        entry[transaction['type']] += 1
        entry[f'monto_{transaction["type"]}'] += transaction['amount']

    categories_per_user: dict[str, int] = defaultdict(int)
    for category in plan['categories']:
        categories_per_user[category['user_id']] += 1

    print('\nDetalle por usuario')
    print('-' * 96)
    print(f'{"old":>4}  {"usuario":<26} {"email":<34} {"cat":>4} {"egr":>5} {"ing":>4}')
    print('-' * 96)

    active = [u for u in plan['users'] if stats.get(u['id'])]
    for user in sorted(active, key=lambda u: -(stats[u['id']]['egreso'] + stats[u['id']]['ingreso'])):
        entry = stats[user['id']]
        print(
            f'{user["old_id"]:>4}  {truncate(user["name"], 26):<26} '
            f'{truncate(user["email"], 34):<34} '
            f'{categories_per_user[user["id"]]:>4} '
            f'{entry["egreso"]:>5} {entry["ingreso"]:>4}'
        )

    idle = len(plan['users']) - len(active)
    if idle:
        print(f'\n  (+ {idle} usuarios sin movimientos, migrados igual)')

    print('\nTotales a insertar')
    print('-' * 96)
    for table in ('users', 'accounts', 'categories', 'transactions'):
        print(f'  {table:<14} {len(plan[table]):>6}')

    total_egreso = sum(e['monto_egreso'] for e in stats.values())
    total_ingreso = sum(e['monto_ingreso'] for e in stats.values())
    print(f'\n  Egresos  ${money(total_egreso)}')
    print(f'  Ingresos ${money(total_ingreso)}')

    if warnings:
        print(f'\nRegistros omitidos ({len(warnings)}):')
        for warning in warnings[:20]:
            print(f'  - {warning}')
        if len(warnings) > 20:
            print(f'  ... y {len(warnings) - 20} más')


# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(
        description='Migra old_database.sql al esquema finance de PostgreSQL.',
    )
    parser.add_argument('--dry-run', action='store_true',
                        help='muestra el plan sin escribir en la base')
    parser.add_argument('--rollback', action='store_true',
                        help='borra de la base todo lo que insertó este script')
    parser.add_argument('--yes', '-y', action='store_true',
                        help='no pedir confirmación')
    args = parser.parse_args()

    env = read_env()
    target = (f'{env.get("DB_USERNAME")}@{env.get("DB_HOST")}:'
              f'{env.get("DB_PORT")}/{env.get("DB_NAME")} (schema {SCHEMA})')

    print(f'Origen : {DUMP_FILE}')
    print(f'Destino: {target}')

    old = load_old_database()
    print(f'\nDump leído: {len(old["users"])} usuarios, {len(old["tipos"])} tipos de gasto, '
          f'{len(old["gastos"])} gastos, {len(old["revenues"])} ingresos')

    connection = connect(env)
    try:
        with connection.cursor() as cursor:
            taken = existing_emails(cursor)

        users = build_users(old['users'], taken)
        accounts = build_accounts(users)
        categories, category_index = build_categories(
            old['tipos'], old['gastos'], old['revenues'], users,
        )
        transactions, warnings = build_transactions(
            old['gastos'], old['revenues'], users, category_index,
        )

        plan = {
            'users': users,
            'accounts': accounts,
            'categories': categories,
            'transactions': transactions,
        }

        renamed = [u for u in users if u['email'].split('@')[0].endswith('_old')]
        if renamed:
            print('\nEmails renombrados por colisión con la base destino:')
            for user in renamed:
                print(f'  old #{user["old_id"]} {user["name"]} -> {user["email"]}')

        report(plan, warnings)

        if args.dry_run:
            print('\n--dry-run: no se escribió nada.')
            return 0

        action = 'BORRAR de' if args.rollback else 'INSERTAR en'
        if not args.yes:
            answer = input(f'\n¿{action} {env.get("DB_NAME")}? [s/N] ').strip().lower()
            if answer not in ('s', 'si', 'sí', 'y', 'yes'):
                print('Cancelado.')
                return 1

        if args.rollback:
            result = rollback(connection, plan)
            connection.commit()
            print('\nEliminados:')
        else:
            result = load(connection, plan)
            connection.commit()
            print('\nInsertados (las filas ya existentes se omiten):')

        for table, count in result.items():
            print(f'  {table:<14} {count:>6}')

        return 0

    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


if __name__ == '__main__':
    sys.exit(main())
