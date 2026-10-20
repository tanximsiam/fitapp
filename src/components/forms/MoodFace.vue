<template>
  <!--
    Animated mood faces. Very low, Okay, Good and Great are "Simple animating emotions" by Misha Heesakkers
    (https://codepen.io/MishaHahaha/pen/grzLJy, MIT as a public CodePen pen); Low is drawn in the same style.
  -->
  <svg viewBox="0 0 44 44" aria-hidden="true" class="mood-face" :class="[FACES[level - 1], { still }]">
    <template v-if="level === 1">
      <circle fill="#E23D18" cx="22" cy="22" r="22" />
      <g transform="translate(13, 20)">
        <g class="face">
          <path
            d="M7,4 C7,5.1045695 7.8954305,6 9,6 C10.1045695,6 11,5.1045695 11,4"
            stroke="#2C0E0F"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            fill="none"
            transform="translate(9, 5) rotate(-180) translate(-9, -5)"
          />
          <ellipse class="eye" fill="#2C0E0F" cx="16.0941176" cy="1.75609756" rx="1.90588235" ry="1.75609756" />
          <ellipse class="eye" fill="#2C0E0F" cx="1.90588235" cy="1.75609756" rx="1.90588235" ry="1.75609756" />
        </g>
      </g>
    </template>

    <template v-else-if="level === 2">
      <circle fill="#EE7420" cx="22" cy="22" r="22" />
      <g transform="translate(13, 20)">
        <g class="face">
          <path d="M6.6,6 C7.6,5 8.3,4.8 9,4.8 C9.7,4.8 10.4,5 11.4,6" stroke="#2C0E0F" stroke-width="1.5" stroke-linecap="round" fill="none" />
          <ellipse class="eye" fill="#2C0E0F" cx="16.0941176" cy="1.75" rx="1.90588235" ry="1.75" />
          <ellipse class="eye" fill="#2C0E0F" cx="1.90588235" cy="1.75" rx="1.90588235" ry="1.75" />
        </g>
      </g>
    </template>

    <template v-else-if="level === 3">
      <circle fill="#F9AC1B" cx="22" cy="22" r="22" />
      <g class="face">
        <g transform="translate(13, 20)" fill="#2C0E0F">
          <g class="mouth">
            <g transform="translate(9, 5)">
              <rect x="-2" y="0" width="4" height="2" rx="2" />
            </g>
          </g>
          <ellipse class="eye" cx="16.0941176" cy="1.75" rx="1.90588235" ry="1.75" />
          <ellipse class="eye" cx="1.90588235" cy="1.75" rx="1.90588235" ry="1.75" />
        </g>
      </g>
    </template>

    <template v-else-if="level === 4">
      <circle fill="#1988E3" cx="22" cy="22" r="22" />
      <g transform="translate(22, 32)">
        <g class="face-container">
          <g transform="translate(-9, -12)">
            <g class="face-upAndDown">
              <ellipse class="eye" fill="#2C0E0F" cx="16.0941176" cy="1.75609756" rx="1.90588235" ry="1.75609756" />
              <ellipse class="eye" fill="#2C0E0F" cx="1.90588235" cy="1.75609756" rx="1.90588235" ry="1.75609756" />
              <path
                d="M6.18823529,4.90499997 C6.18823529,5.95249999 7.48721095,7 9.08957864,7 C10.6919463,7 11.990922,5.95249999 11.990922,4.90499997"
                stroke="#2C0E0F"
                stroke-linecap="round"
                stroke-linejoin="round"
                fill="none"
              />
            </g>
          </g>
        </g>
      </g>
    </template>

    <template v-else>
      <circle fill="#248C37" cx="22" cy="22" r="22" />
      <g class="scaleFace">
        <g class="face">
          <ellipse fill="#2C0E0F" cx="29.0875" cy="21.75" rx="1.89926471" ry="1.75" />
          <ellipse fill="#2C0E0F" cx="14.8992647" cy="21.75" rx="1.89926471" ry="1.75" />
          <path
            d="M21.8941176,27.8819633 C24.8588235,27.8819632 25.4941176,25.5404999 25.4941176,24.5648901 C25.4941176,23.5892803 24.4352941,23.9795242 22.1058824,23.9795242 C19.7764706,23.9795242 18.2941176,23.5892803 18.2941176,24.5648901 C18.2941176,25.5404999 18.9294118,27.8819633 21.8941176,27.8819633 Z"
            fill="#2C0E0F"
          />
          <ellipse fill="#E23D18" cx="21.8941176" cy="26.4390244" rx="1.69411765" ry="0.780487805" />
        </g>
      </g>
    </template>
  </svg>
</template>

<script setup lang="ts">
/** level 1–5: very low, low, okay, good, great. `still` turns the animation off (e.g. small summary rows). */
withDefaults(defineProps<{ level: number; still?: boolean }>(), { still: false })
const FACES = ['sad', 'low', 'neutral', 'fine', 'happy']
</script>

<style scoped>
/* Keyframes and timings from the original pen; "low" reuses them at a slower, heavier pace. */
.happy .face { animation: upAndDown 0.8s ease infinite; }
.happy .scaleFace { transform-origin: 35px 20px; transform: rotate(12deg); }

.sad .face { animation: leftToRight 0.4s linear infinite alternate-reverse; }
.sad .eye,
.fine .eye { transform-origin: 0 1px; animation: blink 3s linear infinite, blinkSqueeze 3s linear infinite; }

.low .face { animation: upAndDown 4s ease infinite; }
.low .eye { transform-origin: 0 1px; animation: blink 4s linear infinite, blinkSqueeze 4s linear infinite; animation-delay: 0.6s; }

.neutral .face { animation: upAndDown 6s ease infinite; }
.neutral .eye { transform-origin: 0 1px; animation: blink 3s linear infinite, blinkSqueezeTwice 3s linear infinite; animation-delay: 1s; }
.neutral .mouth { animation: scaleX 2s ease infinite alternate-reverse; }

.fine .face-container { animation: rotateLeftToRight 3s infinite; }
.fine .face-upAndDown { animation: fineUpAndDown 3s infinite; }

.still *,
.still { animation: none !important; }
@media (prefers-reduced-motion: reduce) {
  .mood-face,
  .mood-face * { animation: none !important; }
}

@keyframes rotateLeftToRight {
  0% { transform: rotate(15deg); }
  50% { transform: rotate(-15deg); }
  100% { transform: rotate(15deg); }
}
@keyframes fineUpAndDown {
  0% { transform: translate(0, 0); }
  25% { transform: translate(0, -1px); }
  50% { transform: translate(0, 0); }
  75% { transform: translate(0, -1px); }
  100% { transform: translate(0, 0); }
}
@keyframes upAndDown {
  0% { transform: translate(0, -1px); }
  50% { transform: translate(0, 2px); }
  100% { transform: translate(0, -1px); }
}
@keyframes leftToRight {
  0% { transform: translate(-1px, 4px); }
  100% { transform: translate(1px, 4px); }
}
@keyframes scaleX {
  0% { transform: translate(0, 0) scale(1, 1); }
  100% { transform: translate(-9px, 0) scale(2, 1); }
}
@keyframes blink {
  0%, 45% { opacity: 1; }
  50% { opacity: 0; }
  55%, 100% { opacity: 1; }
}
@keyframes blinkSqueeze {
  0%, 45% { transform: scale(1, 1); }
  50% { transform: scale(1, 0); }
  55%, 100% { transform: scale(1, 1); }
}
@keyframes blinkSqueezeTwice {
  0%, 45% { transform: scale(1, 1); }
  50% { transform: scale(1, 0); }
  55% { transform: scale(1, 1); }
  60% { transform: scale(1, 0); }
  65%, 100% { transform: scale(1, 1); }
}
</style>
