# Air Task — Design System (pointer)

Канонический, общий для всех проектов документ перенесён в корень AirTask:

→ **[`../../../DESIGN.md`](../../../DESIGN.md)**

Здесь намеренно не дублируется содержимое, чтобы не было расхождений. Правки дизайна вносите
только в корневой `DESIGN.md`; код-эталон токенов — `../../src/style.css`.

Кратко:

- Стиль: **Cyberpunk UI** (неон на тёмном), тёмная тема основная, светлая — «дневная».
- Шрифты: **Exo 2** + **JetBrains Mono** (кириллица), self-host `@fontsource`. Orbitron запрещён.
- Иконки: **lucide-vue-next** через `src/components/AppIcon.vue`. Эмодзи запрещены.
- Акценты: cyan (primary), magenta (CTA), violet (вторичный бренд/активные/заголовки), green/amber/red.
- Контраст ≥ 4.5:1, `:focus-visible`, `prefers-reduced-motion`, бейджи с обводкой
  `color-mix(in srgb, currentColor 45%, transparent)`.
