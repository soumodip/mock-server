<template>
  <div
    class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
    @click.self="closeModal"
  >
    <div class="bg-[#242736] rounded-xl shadow-2xl w-full max-w-4xl border border-gray-700 max-h-[90vh] flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-gray-700">
        <h3 class="text-lg font-medium text-gray-200">{{ heading }}</h3>
        <button
          @click="closeModal"
          class="text-gray-400 hover:text-gray-300 px-1 pt-1 rounded hover:bg-[#353849] transition-colors"
        >
          <Icon name="mdi:close" class="w-5 h-5" />
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6">
        <!-- Sandbox Notice -->
        <div v-if="isSandbox" class="mb-6 p-4 bg-indigo-900/20 border border-indigo-700/50 rounded-lg">
          <div class="flex items-start gap-3">
            <div class="flex-shrink-0">
              <Icon name="mdi:alert-circle-outline" class="w-5 h-5 text-indigo-400/35" />
            </div>
            <div class="flex-1">
              <h4 class="text-sm font-medium text-indigo-400 mb-1">Sandbox Environment</h4>
              <p class="text-xs text-indigo-300 mb-1.5">
                To ensure a clean environment for testing and security, <b>data</b> is automatically deleted periodically.
              </p>
              <div v-if="nextResetTime" class="flex items-center text-indigo-300/60 text-xs gap-1">
                <Icon name="mdi:timer-outline" class="w-3.5 h-3.5" />
                Next reset: {{ formatDateTime(nextResetTime) }}
              </div>
            </div>
          </div>
        </div>

        <!-- YouTube Video Embed -->
        <div class="w-full mb-4 rounded-lg overflow-hidden bg-black" style="aspect-ratio: 16/9; max-height: 420px;">
          <iframe
            :src="getYouTubeEmbedUrl(youtubeVideoLink)"
            class="w-full h-full"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        </div>

        <!-- Description -->
        <div v-if="description" class="text-gray-300 text-sm leading-relaxed">
          {{ description }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  heading: string;
  youtubeVideoLink: string;
  description?: string;
  isSandbox?: boolean;
  nextResetTime?: string | null;
}>();

const emit = defineEmits<{
  close: [];
}>();

// Format date time for display
const formatDateTime = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

// Convert YouTube URL to embed URL
const getYouTubeEmbedUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);

    // Already an embed URL
    if (urlObj.pathname.includes('/embed/')) {
      return url;
    }

    let videoId: string | null = null;
    let startTime: string | null = null;

    // youtu.be format
    if (urlObj.hostname === 'youtu.be') {
      videoId = urlObj.pathname.slice(1);
      startTime = urlObj.searchParams.get('t');
    }
    // youtube.com/watch format
    else if (urlObj.searchParams.has('v')) {
      videoId = urlObj.searchParams.get('v');
      startTime = urlObj.searchParams.get('t');
    }

    if (videoId) {
      const embedUrl = `https://www.youtube.com/embed/${videoId}`;
      if (startTime) {
        // Convert time to seconds if needed (e.g., "1m30s" -> "90")
        const seconds = parseTimeToSeconds(startTime);
        return `${embedUrl}?start=${seconds}`;
      }
      return embedUrl;
    }

    return url;
  } catch {
    // If URL parsing fails, return as is
    return url;
  }
};

// Parse YouTube time format to seconds (handles "90", "1m30s", "1h2m30s", etc.)
const parseTimeToSeconds = (time: string): number => {
  // If it's already a number, return it
  if (/^\d+$/.test(time)) {
    return parseInt(time, 10);
  }

  let seconds = 0;
  const hours = time.match(/(\d+)h/);
  const minutes = time.match(/(\d+)m/);
  const secs = time.match(/(\d+)s/);

  if (hours?.[1]) seconds += parseInt(hours[1], 10) * 3600;
  if (minutes?.[1]) seconds += parseInt(minutes[1], 10) * 60;
  if (secs?.[1]) seconds += parseInt(secs[1], 10);

  return seconds;
};

const closeModal = () => {
  emit('close');
};
</script>
