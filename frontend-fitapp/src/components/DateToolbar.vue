<template>
  <div class="flex flex-col gap-3 md:flex-row md:items-center" :class="large ? '' : 'mb-8'">
    <CalendarComp
      :class="large ? 'md:flex-1' : 'md:max-w-md md:flex-1'"
      :large="large"
      :model-value="fitness.selectedDate"
      :today="fitness.today"
      :has-data="hasData"
      @update:model-value="fitness.selectDate"
    />
    <div class="flex items-center gap-2 md:ml-auto">
      <button
        v-if="!fitness.isToday"
        type="button"
        class="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink-2 transition-colors duration-150 hover:border-line-strong hover:text-ink"
        @click="fitness.selectDate(fitness.today)"
      >
        Today
      </button>
      <RangeTabs v-if="showRange" :model-value="fitness.rangeDays" @update:model-value="fitness.setRange" />
      <span v-if="fitness.loading && fitness.loaded" class="text-xs text-muted" role="status">Updating…</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import CalendarComp from '@/components/CalendarComp.vue'
import RangeTabs from '@/components/RangeTabs.vue'
import { useFitnessData } from '@/composables/useFitnessData'

withDefaults(defineProps<{ showRange?: boolean; large?: boolean }>(), { showRange: true, large: false })
const { fitness, hasData } = useFitnessData()
</script>
