<template>
  <form novalidate @submit.prevent="save">
    <div class="grid gap-4 sm:grid-cols-2">
      <FormInput v-model="form.steps" label="Daily steps" type="number" inputmode="numeric" :min="100" :max="100000" :step="100" :error="!!errors.steps" :hint="errors.steps" />
      <FormInput v-model="form.activeKcal" label="Active energy (kcal)" type="number" inputmode="numeric" :min="10" :max="10000" :step="10" :error="!!errors.activeKcal" :hint="errors.activeKcal" />
      <FormInput v-model="form.distanceKm" label="Distance (km)" type="number" inputmode="decimal" :min="0.1" :max="200" step="0.1" :error="!!errors.distanceKm" :hint="errors.distanceKm" />
      <FormInput v-model="form.sleepHours" label="Sleep (hours)" type="number" inputmode="decimal" :min="1" :max="16" step="0.25" :error="!!errors.sleepHours" :hint="errors.sleepHours" />
    </div>
    <div class="mt-5 flex flex-wrap items-center gap-3">
      <PrimaryButton type="submit" :label="saving ? 'Saving…' : 'Save goals'" :disabled="saving" />
      <p v-if="message" role="status" class="text-sm" :class="message.ok ? 'text-ink-2' : 'text-danger'">{{ message.text }}</p>
    </div>
  </form>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import FormInput from '@/components/FormInput.vue'
import PrimaryButton from '@/components/PrimaryButton.vue'
import { errorMessage } from '@/api/client'
import { useFitnessStore } from '@/stores/fitness'
import { useModeStore } from '@/stores/mode'

const fitness = useFitnessStore()
const mode = useModeStore()

const form = reactive({ steps: '', activeKcal: '', distanceKm: '', sleepHours: '' })
const errors = reactive<Record<keyof typeof form, string | undefined>>({ steps: undefined, activeKcal: undefined, distanceKm: undefined, sleepHours: undefined })
const saving = ref(false)
const message = ref<{ ok: boolean; text: string } | null>(null)

watch(
  () => fitness.goals,
  (g) => {
    form.steps = String(g.steps)
    form.activeKcal = String(g.activeKcal)
    form.distanceKm = String(g.distanceM / 1000)
    form.sleepHours = String(g.sleepMin / 60)
  },
  { immediate: true },
)

function check(key: keyof typeof form, min: number, max: number): number | null {
  const n = Number(form[key])
  const ok = form[key] !== '' && Number.isFinite(n) && n >= min && n <= max
  errors[key] = ok ? undefined : `Enter a number from ${min} to ${max}.`
  return ok ? n : null
}

async function save() {
  message.value = null
  const steps = check('steps', 100, 100000)
  const activeKcal = check('activeKcal', 10, 10000)
  const distanceKm = check('distanceKm', 0.1, 200)
  const sleepHours = check('sleepHours', 1, 16)
  if (steps === null || activeKcal === null || distanceKm === null || sleepHours === null) return

  saving.value = true
  try {
    await fitness.saveGoals({
      steps: Math.round(steps),
      activeKcal: Math.round(activeKcal),
      distanceM: Math.round(distanceKm * 1000),
      sleepMin: Math.round(sleepHours * 60),
    })
    message.value = { ok: true, text: mode.isDemo ? 'Saved in this browser.' : 'Saved to your account.' }
  } catch (err) {
    message.value = { ok: false, text: errorMessage(err, 'Goals could not be saved.') }
  } finally {
    saving.value = false
  }
}
</script>
