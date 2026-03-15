<script setup lang="ts">
const items = [
  {
    icon: 'i-lucide-bar-chart-2',
    title: 'Watch-through rate & completion',
    description:
      'YouTube Analytics API provides audience retention and average view percentage — but only for videos on your own channel, not for videos you have watched.',
    available: false,
  },
  {
    icon: 'i-lucide-thumbs-up',
    title: 'Like / view counts',
    description:
      'The Videos API (part=statistics) returns viewCount, likeCount, commentCount, and favouriteCount for any public video. These can be fetched alongside the metadata you already have.',
    available: true,
  },
  {
    icon: 'i-lucide-users',
    title: 'Channel subscriber counts',
    description:
      'The Channels API (part=statistics) returns subscriberCount, videoCount, and viewCount for any channel. Useful to see whether you tend to watch large or niche creators.',
    available: true,
  },
  {
    icon: 'i-lucide-search',
    title: 'Search history cross-reference',
    description:
      'Your Takeout also includes Suchverlauf.html (search history). Parsing it and cross-referencing with watch history could reveal what you searched before watching a video.',
    available: true,
  },
  {
    icon: 'i-lucide-clock',
    title: 'Exact watch duration per session',
    description:
      'YouTube does not expose how long you personally watched each video. The API only provides the total video duration — your individual playback time is not available through any public API.',
    available: false,
  },
  {
    icon: 'i-lucide-repeat',
    title: 'Subscription feed vs discovery',
    description:
      'There is no API endpoint that reveals how you discovered a video (subscription feed, recommended, search, etc.). That context is not included in Takeout data either.',
    available: false,
  },
]
</script>

<template>
  <UCard class="bg-gray-900 border-gray-800">
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-info" class="w-4 h-4 text-gray-400" />
        <h2 class="font-semibold text-white">What more data is theoretically available?</h2>
      </div>
    </template>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="item in items"
        :key="item.title"
        class="flex gap-3 p-3 rounded-lg"
        :class="item.available ? 'bg-green-950/40 border border-green-900/40' : 'bg-gray-800/40 border border-gray-700/40'"
      >
        <UIcon
          :name="item.icon"
          class="w-5 h-5 mt-0.5 shrink-0"
          :class="item.available ? 'text-green-400' : 'text-gray-500'"
        />
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <p class="text-sm font-medium text-gray-100">{{ item.title }}</p>
            <UBadge
              v-if="item.available"
              size="xs"
              color="success"
              variant="soft"
            >Fetchable</UBadge>
            <UBadge
              v-else
              size="xs"
              color="neutral"
              variant="soft"
            >Not available</UBadge>
          </div>
          <p class="text-xs text-gray-400 leading-relaxed">{{ item.description }}</p>
        </div>
      </div>
    </div>
  </UCard>
</template>
