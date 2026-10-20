# PROYECTO: App de Finanzas Personales (Tauri + React + Tailwind)

## 1. CONTEXTO Y FILOSOFÍA

Estoy construyendo una aplicación de escritorio y Android para llevar registro de finanzas personales. La filosofía es **simplicidad radical**: registrar un gasto o ingreso debe tomar menos de 10 segundos. No quiero un clon de Mint ni una app contable gigante.

Su nombre Seah proviene de una medida biblica.

**Los dos diferenciadores clave** (ninguna app común los cubre bien):
1. **Doble tipo de cambio manual** (efectivo vs. transferencia con % de recargo configurable). Vivo en Cuba, donde el cambio por transferencia suele ser ~30% más alto que el efectivo, y las APIs de terceros no reflejan esta realidad.
2. **Ingresos/gastos recurrentes automáticos** (ej. salario el día 4 de cada mes).

---

## 2. STACK TÉCNICO

- **Tauri v2** (backend Rust, soporte desktop + Android)
- **React 18** con **TypeScript estricto** (prohibido `any`)
- **Vite** como bundler
- **Tailwind CSS** para estilos (solo clases utilitarias, sin CSS custom salvo justificación)
- **React Router v6** para navegación
- **Zustand** para estado global (no Redux, no Context API para estado complejo)
- **lucide-react** para iconos
- **recharts** para gráficos
- **SQLite** vía `tauri-plugin-sql` (queries desde frontend con TS) — más rápido para MVP que `rusqlite` puro
- **pnpm** como gestor de paquetes

**Estructura de carpetas:**
```
src-tauri/          # Backend Rust (comandos, permisos, config)
src/
  ├── components/   # Componentes reutilizables
  ├── pages/        # Vistas por ruta
  ├── hooks/        # Custom hooks
  ├── stores/       # Estado global (Zustand)
  ├── lib/          # Utilidades, clientes, queries SQLite
  ├── types/        # Tipos TS compartidos
  └── styles/       # Tailwind + estilos globales
```

---

## 3. MODELO DE DATOS (SQLite)

```sql
-- Transacciones
CREATE TABLE transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK(type IN ('expense','income')),
  amount REAL NOT NULL,
  currency TEXT NOT NULL,              -- 'CUP', 'USD', 'EUR', etc.
  amount_cup REAL NOT NULL,            -- equivalente en CUP al momento del registro
  category_id INTEGER NOT NULL,
  description TEXT,
  payment_method TEXT NOT NULL CHECK(payment_method IN ('cash','transfer','other')),
  exchange_rate_used REAL,             -- tasa aplicada al momento
  date TEXT NOT NULL,                  -- ISO 8601
  is_recurring_generated INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Categorías (editables por el usuario)
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  icon TEXT,                           -- nombre de icono lucide
  color TEXT,                          -- hex
  type TEXT NOT NULL CHECK(type IN ('expense','income','both'))
);

-- Monedas
CREATE TABLE currencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,           -- 'CUP', 'USD', 'EUR'
  name TEXT NOT NULL,
  is_base INTEGER DEFAULT 0            -- 1 para CUP
);

-- Tasas de cambio (manuales, configurables por el usuario)
CREATE TABLE exchange_rates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  currency_id INTEGER NOT NULL,
  rate_cash REAL NOT NULL,             -- ej. 1 USD = 100 CUP efectivo
  rate_transfer REAL,                  -- ej. 130 CUP; NULL = calcular con surcharge
  transfer_surcharge_percent REAL,     -- ej. 30.0; NULL si rate_transfer es manual
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (currency_id) REFERENCES currencies(id)
);

-- Reglas recurrentes
CREATE TABLE recurring_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK(type IN ('expense','income')),
  amount REAL NOT NULL,
  currency TEXT NOT NULL,
  category_id INTEGER NOT NULL,
  description TEXT,
  payment_method TEXT NOT NULL,
  day_of_month INTEGER NOT NULL CHECK(day_of_month BETWEEN 1 AND 31),
  frequency TEXT NOT NULL DEFAULT 'monthly' CHECK(frequency IN ('monthly','weekly')),
  is_active INTEGER DEFAULT 1,
  last_generated_month TEXT,           -- 'YYYY-MM' para evitar duplicados
  FOREIGN KEY (category_id) REFERENCES categories(id)
);
```

**Reglas de negocio:**
- Si `rate_transfer` es NULL y `transfer_surcharge_percent` no, calcular: `rate_transfer = rate_cash * (1 + surcharge/100)`.
- Los `amount_cup` se calculan al momento del registro usando la tasa correspondiente al `payment_method`.
- El toggle global Efectivo/Transferencia en el dashboard **solo recalcula visualización**, no modifica datos guardados.
- Para evitar duplicados de recurrentes: antes de generar, verificar que `last_generated_month != 'YYYY-MM' actual`.

---

## 4. DISEÑO UI/UX

### Principios visuales
- **Layout de tarjetas** con sombras suaves y padding generoso.
- **Jerarquía tipográfica fuerte**: títulos grandes, datos numéricos en bold.
- **Iconos en cada acción y categoría** para reconocimiento rápido.
- **Modo claro/oscuro** automático según sistema.
- **Responsive real**: sidebar lateral en desktop, bottom nav en Android.

### Paleta
| Rol | Hex (claro) | Hex (oscuro) |
|-----|-------------|--------------|
| Primary | `#0F766E` | `#14B8A6` |
| Accent / CTA | `#F59E0B` | `#FBBF24` |
| Background | `#F8FAFC` | `#0F172A` |
| Card | `#FFFFFF` | `#1E293B` |
| Texto principal | `#0F172A` | `#F1F5F9` |
| Success (ingreso) | `#10B981` | `#34D399` |
| Danger (gasto) | `#EF4444` | `#F87171` |

### Desktop (≥1024px) — Sidebar + contenido
```
┌─────────────┬─────────────────────────────────────┐
│  SIDEBAR    │  CONTENIDO PRINCIPAL                │
│             │                                     │
│  [Logo]     │  ┌─────────┐ ┌─────────┐ ┌───────┐ │
│             │  │ Saldo   │ │ Ingreso │ │ Gasto │ │
│  Dashboard  │  │ actual  │ │  mes    │ │  mes  │ │
│  Transac.   │  └─────────┘ └─────────┘ └───────┘ │
│  Categorías │                                     │
│  Ajustes    │  ┌─────────────────────────────┐   │
│             │  │ Tasa de cambio activa       │   │
│             │  │ [Efectivo] [Transferencia]  │   │
│  [User]     │  │ 1 USD = 100 CUP (efectivo)  │   │
│             │  └─────────────────────────────┘   │
│             │                                     │
│             │  ┌─────────────────────────────┐   │
│             │  │ Gráfico mensual (barras)    │   │
│             │  │ Ingresos vs Gastos          │   │
│             │  └─────────────────────────────┘   │
│             │                                     │
│             │  ┌─────────────────────────────┐   │
│             │  │ Últimas transacciones       │   │
│             │  │ [Lista compacta]            │   │
│             │  └─────────────────────────────┘   │
└─────────────┴─────────────────────────────────────┘
```

### Android (<768px) — Bottom Navigation
```
┌─────────────────────────────┐
│  [Header: Título + Acción]  │
├─────────────────────────────┤
│  ┌───────────────────────┐  │
│  │ Saldo / Tasa activa   │  │
│  └───────────────────────┘  │
│  ┌─────────┐ ┌─────────┐   │
│  │ Ingreso │ │ Gasto   │   │
│  └─────────┘ └─────────┘   │
│  ┌───────────────────────┐  │
│  │ Gráfico (compacto)    │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ Últimas transacciones │  │
│  └───────────────────────┘  │
├─────────────────────────────┤
│ [Inicio] [Trans.] [Cat.] [⚙]│
└─────────────────────────────┘
```

### Pantalla "Nueva Transacción" (modal o página)
Debe ser ultra-rápida. Campos en orden:
1. **Tipo**: toggle segmentado [Gasto] / [Ingreso]
2. **Monto**: input numérico grande + selector de moneda
3. **Categoría**: dropdown con iconos (filtrada por tipo)
4. **Descripción**: input libre (opcional)
5. **Método**: botones segmentados [Efectivo] / [Transferencia] / [Otro]
6. **Conversión automática**: si moneda ≠ CUP, mostrar en tiempo real `≈ 13,000 CUP (transferencia)`
7. **Botón Guardar** (CTA color acento)

### Pantalla "Tasas de Cambio" (Ajustes)
- Moneda base: CUP (fija).
- Lista de monedas (USD, EUR, MLC, etc.) — el usuario agrega/elimina.
- Por moneda:
  - **Efectivo**: ej. 1 USD = 100 CUP
  - **Transferencia**: manual (130) **o** calculada como `efectivo × (1 + % recargo)`
- Campo global: **% de recargo por defecto** (ej. 30%)
- Toggle Efectivo/Transferencia visible en dashboard y header. Al cambiar, **todos los montos visibles se recalculan** (solo visualización).
- **Override manual por transacción**: editar `amount_cup` directamente si esa transacción tuvo tasa distinta.

### Pantalla "Recurrentes"
- Lista de reglas: "Salario — día 4 — 4000 CUP — Ingreso — Efectivo"
- Formulario: tipo, monto, moneda, categoría, método, descripción, frecuencia, día del mes
- Toggle activo/inactivo por regla
- Al abrir la app: si hay reglas cuya fecha ya pasó este mes y no se generaron, crear automáticamente o mostrar prompt "¿Registrar salario de este mes?"

---

## 5. REGLAS DE TRABAJO (para la IA)

1. Si la tarea es ambigua, hazme 1-3 preguntas concretas. Si es clara, procede directo.
2. **No inventes APIs ni comandos de Tauri** que no existan. Si dudas, dilo.
3. **TypeScript estricto**: nunca `any`.
4. **Tailwind**: solo clases utilitarias.
5. **Componentes**: funcionales, `export default`, un componente por archivo.
6. **Comunicación front↔back**: `invoke()` de `@tauri-apps/api/core` o queries vía `tauri-plugin-sql`. Comandos Rust en `src-tauri/src/commands/` registrados en `lib.rs`.
7. **Permisos Tauri**: si un comando necesita permiso nuevo, muéstrame el cambio en `capabilities/default.json`.
8. **No rompas la estructura existente**. Si necesitas mover/renombrar, avisa primero.
9. **Comenta solo lo no obvio**.
10. **Al final de cada respuesta**, dame resumen breve de archivos creados/modificados.

**Cómo responder:**
- **Feature**: plan corto (3-5 bullets) → código archivo por archivo con ruta clara → siguientes pasos
- **Debug**: causa raíz → fix mínimo → por qué funcionó
- **Refactor**: propón antes de aplicar
- Usa **bloques de código con la ruta del archivo en el header**
- Responde en español, código y comentarios en inglés

**Comandos:**
- Dev: `pnpm tauri dev`
- Build: `pnpm tauri build`
- Android: `pnpm tauri android dev` / `pnpm tauri android build`
- Lint: `pnpm lint`
- Tipos: `pnpm typecheck`

**Qué NO hacer:**
- No agregues librerías sin pedir permiso
- No cambies config de Vite/Tailwind/Tauri sin avisar
- No uses `localStorage` si hay un store de Zustand para eso
- No generes archivos >200 líneas sin dividirlos

---

## 6. LISTA DE TAREAS POR FASES

### FASE 0 — Setup ✅
- [x] Inicializar Tauri v2 + React + TS + Vite
- [x] Configurar Tailwind con la paleta definida
- [x] Instalar: `react-router-dom`, `zustand`, `lucide-react`, `recharts`, `tauri-plugin-sql`
- [x] Crear estructura de carpetas (`components`, `pages`, `hooks`, `stores`, `lib`, `types`, `styles`)
- [x] Configurar SQLite con `tauri-plugin-sql` + migraciones iniciales (schema de la sección 3)

### FASE 1 — Backend y datos ✅
- [x] Implementar queries/capas de acceso para: transactions, categories, currencies, exchange_rates, recurring_rules
- [x] Comando `get_dashboard_summary(month, year)` → totales por tipo + conversión a CUP — implementado como capa TS (`src/lib/dashboard.ts`) vía plugin-sql, sin comando Rust
- [x] Lógica de recurrentes: verificar `last_generated_month` al iniciar la app y generar si corresponde
- [x] Seed inicial: moneda CUP base, USD con tasa ejemplo, categorías comunes (Salud, Comida, Transporte, Salario, Otros)

### FASE 2 — UI base y navegación ✅
- [x] Layout responsive: `Sidebar` (desktop) + `BottomNav` (mobile) con React Router
- [x] Página **Dashboard**: cards resumen + card de tasa activa con toggle + gráfico barras + últimas 10 transacciones
- [x] Página **Transacciones**: tabla con filtros (mes, tipo, categoría, método) + búsqueda + FAB "Nueva transacción"
- [x] Página **Categorías**: lista con icono/color + CRUD (validar transacciones asociadas o reasignar)
- [x] Página **Ajustes**: secciones Tasas de cambio + Recurrentes

### FASE 3 — Funcionalidad core ✅
- [x] Formulario nueva transacción con los 7 campos definidos + cálculo en tiempo real del equivalente en CUP
- [x] Edición y eliminación de transacciones
- [x] Toggle global Efectivo/Transferencia en dashboard (recalcula solo visualización)
- [x] Generación automática de recurrentes al iniciar app + prompt opcional — se auto-generan al abrir la app (el prompt opcional no hizo falta)

### FASE 4 — Vistas mensual/anual y pulido ✅
- [x] Vista **Mensual**: selector mes, totales, desglose por categoría (pastel o barras horizontales), lista del mes
- [x] Vista **Anual**: selector año, gráfico de líneas por mes, totales, comparativa
- [x] Exportar transacciones a CSV
- [x] Modo oscuro completo
- [x] Empty states en todas las listas
- [x] Validaciones (montos > 0, campos requeridos, manejo de errores)

### FASE 5 — Android
> Estado: CI listo. En cada push a `main`, GitHub Actions (`.github/workflows/android.yml`)
> ejecuta `tauri android init --ci` + `tauri android build --apk` y sube un **APK universal**
> con las 4 ABIs (`arm64-v8a`, `armeabi-v7a`, `x86`, `x86_64`). Falta: primera ejecución real
> y verificación en dispositivo.

- [x] CI Android: workflow de GitHub Actions (push a `main`) que genera el APK universal multi-ABI
- [ ] `pnpm tauri android init` + verificar UI responsive en móvil — el `init` ya lo corre el CI; falta verificar en dispositivo/emulador real
- [ ] Ajustar interacciones táctiles (áreas ≥44px, bottom nav fija)
- [ ] Generar APK debug y release — listo en CI: sale APK **debug** (firmado con clave de desarrollo); al configurar los secrets `ANDROID_KEY_*` pasa a **release** firmado. Pendiente de la primera ejecución.
- [ ] (Opcional) Configurar firma de APK: crear `upload-keystore.jks` con `keytool`, subirlo en base64 como secret `ANDROID_KEY_BASE64` + `ANDROID_KEY_ALIAS` + `ANDROID_KEY_PASSWORD`

### FASE 6 — Extras post-MVP
- [ ] Presupuestos por categoría con alertas
- [ ] Etiquetas múltiples por transacción
- [ ] Adjuntar imágenes/recibos
- [ ] Backup/Restore (export/import JSON o SQLite)
- [ ] Widget o quick-add para registrar sin abrir app completa

---

## 7. NOTAS FINALES

- **Prioriza el flujo de registrar gasto**: <10 segundos desde abrir la app.
- **La tasa de cambio es el feature estrella**: toggle Efectivo/Transferencia visible y recálculo instantáneo.
- **Recurrentes sin duplicados**: siempre verificar `last_generated_month`.
- **No sobre-ingenierices el estado**: Zustand + SQLite es suficiente para MVP local.
- **Primer objetivo**: Fase 0 + Fase 1 completas antes de tocar UI. Sin base de datos sólida, todo lo demás improvisa.
```