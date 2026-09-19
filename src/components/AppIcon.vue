<script setup>
import { computed } from 'vue'
import {
  Rocket,
  Folder,
  FolderKanban,
  ListTodo,
  ChartColumn,
  ListChecks,
  Settings,
  Hourglass,
  CircleCheckBig,
  CircleCheck,
  Check,
  TriangleAlert,
  CircleAlert,
  PartyPopper,
  Pencil,
  Trash2,
  Search,
  ShoppingCart,
  Tag,
  Wallet,
  Link2,
  AlarmClock,
  CalendarDays,
  Archive,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  ChevronUp,
  ChevronDown,
  Undo2,
  X,
  Bell,
  LayoutDashboard,
  RefreshCw,
  Plus,
  Save,
  ShieldCheck,
  Clock,
  Target,
  ExternalLink,
  Info,
  Lightbulb,
  ListPlus,
  FolderPlus,
  Repeat,
  History,
  SkipForward,
  CalendarClock,
} from 'lucide-vue-next'

/**
 * Единая точка подключения иконок (SVG, lucide).
 * Импортируется только нужный набор — бандл остаётся компактным.
 * Иконки декоративные по умолчанию (aria-hidden); для icon-only кнопок
 * доступное имя задаётся через aria-label на самой кнопке.
 */
const props = defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 18 },
  strokeWidth: { type: [Number, String], default: 2 }
})

const ICONS = {
  rocket: Rocket,
  folder: Folder,
  'folder-kanban': FolderKanban,
  'list-todo': ListTodo,
  'chart-column': ChartColumn,
  'list-checks': ListChecks,
  settings: Settings,
  hourglass: Hourglass,
  'circle-check-big': CircleCheckBig,
  'circle-check': CircleCheck,
  check: Check,
  'triangle-alert': TriangleAlert,
  'circle-alert': CircleAlert,
  'party-popper': PartyPopper,
  pencil: Pencil,
  'trash-2': Trash2,
  search: Search,
  'shopping-cart': ShoppingCart,
  tag: Tag,
  wallet: Wallet,
  'link-2': Link2,
  'alarm-clock': AlarmClock,
  'calendar-days': CalendarDays,
  archive: Archive,
  'arrow-left': ArrowLeft,
  'arrow-up': ArrowUp,
  'arrow-down': ArrowDown,
  'chevron-up': ChevronUp,
  'chevron-down': ChevronDown,
  'undo-2': Undo2,
  x: X,
  bell: Bell,
  'layout-dashboard': LayoutDashboard,
  'refresh-cw': RefreshCw,
  plus: Plus,
  save: Save,
  'shield-check': ShieldCheck,
  clock: Clock,
  target: Target,
  'external-link': ExternalLink,
  info: Info,
  lightbulb: Lightbulb,
  'list-plus': ListPlus,
  'folder-plus': FolderPlus,
  repeat: Repeat,
  history: History,
  'skip-forward': SkipForward,
  'calendar-clock': CalendarClock
}

const IconComponent = computed(() => ICONS[props.name] || CircleAlert)
</script>

<template>
  <component
    :is="IconComponent"
    class="app-icon"
    :size="Number(size)"
    :stroke-width="Number(strokeWidth)"
    aria-hidden="true"
    focusable="false"
  />
</template>

<style scoped>
.app-icon {
  flex-shrink: 0;
  vertical-align: middle;
}
</style>
