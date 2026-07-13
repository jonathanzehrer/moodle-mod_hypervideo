<template>
  <div
    class="hypervideo"
    role="region"
    :aria-label="title || $t('aria_videoplayer')"
  >
    <h3 v-if="title" class="hypervideo-title" :id="headingId">{{ title }}</h3>
    <div class="variant">
      <div v-if="chapters.length" class="chapters-sidebar">
        <ChapterSidebar
          :chapters="chapters"
          :current-time="currentTime"
          :duration="duration"
          @seek="seekTo"
        />
      </div>
      <div class="player-wrapper">
        <VideoPlayer
          ref="videoPlayer"
          :url="url"
          :title="title"
          :heading-id="headingId"
          :chapters="chapters"
          :current-chapter-title="currentChapterTitle"
          :logger="logger"
          fullscreen-sidebar-position="left"
          @timeupdate="onPlayerTimeUpdate"
          @ready="onPlayerReady"
        >
          <template v-if="chapters.length" #fullscreen-sidebar>
            <ChapterSidebar
              :chapters="chapters"
              :current-time="currentTime"
              :duration="duration"
              @seek="seekTo"
            />
          </template>
        </VideoPlayer>
      </div>
    </div>
  </div>
</template>

<script>
import Logger from "./scripts/logger";
import Communication from "./scripts/communication";
import VideoPlayer from "./components/VideoPlayer.vue";
import ChapterSidebar from "./components/ChapterSidebar.vue";

export default {
  components: {
    VideoPlayer,
    ChapterSidebar,
  },
  data() {
    return {
      logger: null,
      headingId: "",
      currentTime: 0,
      duration: 0,
    };
  },
  computed: {
    url() {
      return this.$store.state.url;
    },
    title() {
      return this.$store.state.title;
    },
    chapters() {
      return this.$store.state.chapters;
    },
    currentChapterTitle() {
      if (!this.chapters.length || this.currentTime < 0) return '';
      const sorted = [...this.chapters].sort((a, b) => a.time - b.time);
      let title = '';
      for (let i = 0; i < sorted.length; i++) {
        if (this.currentTime >= sorted[i].time) {
          title = sorted[i].title;
        }
      }
      return title;
    },
  },
  mounted() {
    this.headingId = "hypervideo-title-" + Math.floor(Math.random() * 10000);
    this.logger = new Logger(
      this.$store.state.courseid,
      this.$store.state.hypervideoid,
      {
        context: "player2",
        outputType: 1,
        url: this.$store.state.url,
      },
    );
    this.logger.init();
    this.getVideoProgress();
  },
  methods: {
    async getVideoProgress() {
      const response = await Communication.webservice("get_video_progress", {
        data: {
          course: parseInt(this.$store.getters.getCourseid, 10),
          hypervideo: parseInt(this.$store.getters.getHypervideoid, 10),
        },
      });
      if (response.success) {
        const parsed = JSON.parse(response.data);
        if (this.$refs.videoPlayer) {
          this.$refs.videoPlayer.setInitialProgress(parsed.videoprogress);
        }
      }
    },
    seekTo(time) {
      if (this.$refs.videoPlayer) {
        this.onPlayerChapterSeek({
          context: "player2",
          action: "chapter-seek",
          values: time,
          currenttime: time,
          duration: this.duration,
        });
        this.$refs.videoPlayer.seekTo(time, true);
      }
    },
    onPlayerChapterSeek(details) {
      if (this.logger) {
        this.logger.add("chapter-seek", details);
      }
    },
    onPlayerTimeUpdate({ currentTime, duration }) {
      this.currentTime = currentTime;
      this.duration = duration;
    },
    onPlayerReady({ duration }) {
      this.duration = duration;
    },
  },
};
</script>

<style scoped>


.variant {
  width: 100%;
  max-height: calc(100vh - 300px);
  position: relative;
  padding-right: calc(230px + 1rem);
  box-sizing: border-box;
}

.player-wrapper {
  /* Clamp width so aspect-ratio height never exceeds the variant's max-height */
  --max-h: calc(100vh - 300px);
  margin-left: calc(230px + 1rem);
  width: min(100%, calc(var(--max-h) * 16 / 9));
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: var(--border-radius);
}

.player-wrapper :deep(.player-container) {
  width: 100%;
  height: 100%;
}

.player-wrapper :deep(video) {
  object-fit: contain;
}

.chapters-sidebar {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 230px;
  overflow: hidden;
}

.hypervideo-title {
  margin-bottom: 1rem;
}

</style>