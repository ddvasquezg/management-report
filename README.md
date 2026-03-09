# Management Report — PersonalSoft

Aplicación web desarrollada en **Angular 21** para visualizar y analizar los reportes de medición de equipos de desarrollo de PersonalSoft. Permite cargar archivos CSV/Excel con datos de softers, calcular el índice de reducción de esfuerzo, y explorar los resultados por etapa y por líder.

---

## Características

- Carga de archivos CSV o Excel (`.csv`, `.xlsx`, `.xls`)
- Cálculo automático del **índice de reducción de esfuerzo** por softer, etapa y líder
- Filtro de **Solo Uso IA** para segmentar el análisis
- Gráficas interactivas: índice por etapa e índice por líder
- Tablas detalladas con desglose por etapa por cada líder
- Exportación de resumen en CSV
- Modo oscuro / claro con persistencia en `localStorage`
- Diseño responsivo adaptado a la identidad visual de PersonalSoft

---

## Tecnologías

| Tecnología | Versión |
|---|---|
| Angular | 21.x |
| Chart.js | 4.x |
| SheetJS (xlsx) | 0.20.x |
| TypeScript | 5.x |
| SCSS | — |

---

## Requisitos previos

- [Node.js](https://nodejs.org/) v20 o superior
- Angular CLI v21: `npm install -g @angular/cli`

---

## Instalación

```bash
git clone https://github.com/ddvasquezg/management-report.git
cd management-report
npm install
```

---

## Uso en desarrollo

```bash
ng serve
```

Abre el navegador en `http://localhost:4200/`. La aplicación se recarga automáticamente al modificar archivos fuente.

---

## Construcción para producción

```bash
ng build
```

Los artefactos de compilación quedan en la carpeta `dist/`. La build de producción incluye optimizaciones de rendimiento.

---

## Estructura del proyecto

```
src/
├── app/
│   ├── core/
│   │   ├── models/          # Interfaces de datos (ReportRow, LeaderAggregate, etc.)
│   │   └── services/        # Lógica de negocio (parser, store, export, theme)
│   ├── features/
│   │   ├── dashboard/       # Componentes de visualización (KPIs, gráficas, tablas)
│   │   └── upload/          # Componente de carga de archivos
│   ├── layout/
│   │   └── header/          # Barra de navegación superior
│   └── shared/
│       ├── components/      # Componentes reutilizables (toast, overlay)
│       └── pipes/           # Pipes de transformación visual
└── assets/
    └── sample-data/         # Datos de ejemplo y recursos de marca
```

---

## Formato del archivo de entrada

El archivo debe contener una hoja llamada **`Medicion`** (o la primera hoja disponible) con al menos las siguientes columnas:

| Columna | Descripción |
|---|---|
| `Nombre` | Nombre del softer |
| `Lider En Cliente` | Nombre del líder |
| `Etapa` | Etapa del proyecto |
| `Uso IA` | `Si` / `No` |
| `Indice de Reduccion de Esfuerzo` | Valor decimal del índice (ej. `0.52`) |

> Si el índice no está precalculado, la app lo calcula a partir de `Puntos Estimados` y `Puntos Ejecutados`.

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `ng serve` | Servidor de desarrollo |
| `ng build` | Build de producción |
| `ng build --configuration development` | Build de desarrollo |
| `ng test` | Ejecutar pruebas unitarias |

---

## Licencia

Uso interno — PersonalSoft © 2026


```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
