# Screenshots

Captured from the running apps with sample data. All values are simulated.

- **Mobile app** (`app/`): 390 × 844 at 3×, so each image is 1170 × 2532. Files ending in `-full` show the whole scrolling page.
- **Components**: the same 3× scale, cropped to one element.
- **Web dashboard** (`desktop-*`): 1440 × 960 at 2×, so each image is 2880 × 1920.

Captured with the [Playwright CLI](https://playwright.dev/) against `npm run dev` in `app/` and `frontend-fitapp/`.

## Mobile app

### Getting started

| Welcome | Create account | Sign in |
| --- | --- | --- |
| ![Welcome](app/01-welcome.png) | ![Create account](app/02-create-account.png) | ![Sign in](app/03-sign-in.png) |

| About you | Your watch | What to track and goals | Connect |
| --- | --- | --- | --- |
| ![About you](app/04-setup-about-you.png) | ![Watch](app/05-setup-watch.png) | ![Track and goals](app/06-setup-track-and-goals.png) | ![Connect](app/07-setup-connect.png) |

### Pairing a FitApp Watch

| Pair | Searching | Choose your watch | Paired |
| --- | --- | --- | --- |
| ![Pair](app/07b-pair-watch.png) | ![Searching](app/07c-pair-searching.png) | ![Choose](app/07d-pair-choose.png) | ![Paired](app/07e-pair-done.png) |

### Every day

| Home | Health | Activity | Sleep |
| --- | --- | --- | --- |
| ![Home](app/08-home.png) | ![Health](app/09-health.png) | ![Activity](app/10-activity.png) | ![Sleep](app/11-sleep.png) |

| Heart rate | Stress | Journal | Hydration |
| --- | --- | --- | --- |
| ![Heart rate](app/12-heart-rate.png) | ![Stress](app/13-stress.png) | ![Journal](app/14-journal.png) | ![Hydration](app/15-hydration.png) |

| Mood | Food | Insights | Profile |
| --- | --- | --- | --- |
| ![Mood](app/16-mood.png) | ![Food](app/17-food.png) | ![Insights](app/18-insights.png) | ![Profile](app/19-profile.png) |

### Logging

| Quick log | Mood | Activity | Workout |
| --- | --- | --- | --- |
| ![Quick log](app/21-quick-log.png) | ![Log mood](app/22-log-mood.png) | ![Log activity](app/23-log-activity.png) | ![Log workout](app/24-log-workout.png) |

### Dark

| Welcome | Home | Activity | Hydration | Sleep | Insights |
| --- | --- | --- | --- | --- | --- |
| ![Welcome](app/34-welcome-dark.png) | ![Home](app/30-home-dark.png) | ![Activity](app/31-activity-dark.png) | ![Hydration](app/32-hydration-dark.png) | ![Sleep](app/33-sleep-dark.png) | ![Insights](app/35-insights-dark.png) |

### Full pages

| Home | Activity | Sleep | Hydration |
| --- | --- | --- | --- |
| ![Home](app/08-home-full.png) | ![Activity](app/10-activity-full.png) | ![Sleep](app/11-sleep-full.png) | ![Hydration](app/15-hydration-full.png) |

Also: [Insights, whole page](app/18-insights-full.png).

Also: [Watch & connection](app/20-watch-and-connection.png).

## Components

### Heroes

| Home check-in | Activity | Sleep | Heart rate |
| --- | --- | --- | --- |
| ![Home hero](components/home-hero.png) | ![Activity hero](components/hero-activity.png) | ![Sleep hero](components/hero-sleep.png) | ![Heart rate hero](components/hero-heart-rate.png) |

| Hydration | Mood | Home check-in, dark | Activity, dark | Hydration, dark |
| --- | --- | --- | --- | --- |
| ![Hydration hero](components/hero-hydration.png) | ![Mood hero](components/hero-mood.png) | ![Home hero, dark](components/home-hero-dark.png) | ![Activity hero, dark](components/hero-activity-dark.png) | ![Hydration hero, dark](components/hero-hydration-dark.png) |

| Health score | Health score, dark |
| --- | --- |
| ![Health score](components/score-hero.png) | ![Health score, dark](components/score-hero-dark.png) |

### Charts and cards

| Today's goals | Today's goals, dark | Vitals |
| --- | --- | --- |
| ![Goals](components/goals-card.png) | ![Goals, dark](components/goals-card-dark.png) | ![Vitals](components/vitals.png) |

| Steps | Active energy | Water per day | Water goal days |
| --- | --- | --- | --- |
| ![Steps chart](components/chart-steps.png) | ![Active energy chart](components/chart-active-energy.png) | ![Water per day](components/chart-water-per-day.png) | ![Goal days](components/chart-water-goal-days.png) |

| Logged activities | Week strip | Tab bar | Goal settings |
| --- | --- | --- | --- |
| ![Logged activities](components/logged-activities.png) | ![Week strip](components/week-strip.png) | ![Tab bar](components/tab-bar.png) | ![Goal settings](components/goal-settings.png) |

### Setup and logging

| Watch picker | Trackers and goals | Connection steps |
| --- | --- | --- |
| ![Watch picker](components/watch-picker.png) | ![Trackers and goals](components/trackers-and-goals.png) | ![Connection steps](components/connection-steps.png) |

| Quick log | Mood faces | Workout logger |
| --- | --- | --- |
| ![Quick log](components/quick-log-sheet.png) | ![Mood faces](components/mood-faces.png) | ![Workout logger](components/workout-logger.png) |

## Web dashboard

![Overview](desktop-overview.png)

| Overview, dark | Hydration | Hydration, dark |
| --- | --- | --- |
| ![Overview, dark](desktop-overview-dark.png) | ![Hydration](desktop-hydration.png) | ![Hydration, dark](desktop-hydration-dark.png) |

| Activity | Sleep | Heart rate |
| --- | --- | --- |
| ![Activity](desktop-activity.png) | ![Sleep](desktop-sleep.png) | ![Heart rate](desktop-heart-rate.png) |

| Stress | Blood oxygen | Skin temperature |
| --- | --- | --- |
| ![Stress](desktop-stress.png) | ![Blood oxygen](desktop-blood-oxygen.png) | ![Skin temperature](desktop-skin-temperature.png) |

| Mood | Food | Cycle |
| --- | --- | --- |
| ![Mood](desktop-mood.png) | ![Food](desktop-food.png) | ![Cycle](desktop-cycle.png) |

| Timeline | Watch & sync |
| --- | --- |
| ![Timeline](desktop-timeline.png) | ![Watch & sync](desktop-device.png) |
