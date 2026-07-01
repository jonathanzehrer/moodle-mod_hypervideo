<template>
  <div
    class="hypervideo"
    role="region"
    :aria-label="title || $t('aria_videoplayer')"
  >
    <h3 v-if="title" class="hypervideo-title" :id="headingId">{{ title }}</h3>
    <div class="row mt-3">
      <div v-if="chapters.length" class="col-md-3">
        <ChapterSidebar
          :chapters="chapters"
          :current-time="currentTime"
          :duration="duration"
          @seek="seekTo"
        />
      </div>
      <div :class="chapters.length ? 'col-md-9' : 'col-12'">
        <VideoPlayer
          ref="videoPlayer"
          :url="url"
          :title="title"
          :heading-id="headingId"
          :chapters="chapters"
          @play="onPlayerPlay"
          @pause="onPlayerPause"
          @seeked="onPlayerSeeked"
          @ended="onPlayerEnded"
          @playback="onPlayerPlayback"
          @chapter-seek="onPlayerChapterSeek"
          @timeupdate="onPlayerTimeUpdate"
          @ready="onPlayerReady"
        />
        <div class="variant-indicator variant-2">
          You are looking at variant 2
        </div>
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
  },
  mounted() {
    this.headingId = "hypervideo-title-" + Math.floor(Math.random() * 10000);
    this.logger = new Logger(
      this.$store.state.courseid,
      this.$store.state.hypervideoid,
      {
        context: "media_hypervideo",
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
        this.$refs.videoPlayer.seekTo(time);
      }
    },
    onPlayerPlay(details) {
      this.log("play", details);
    },
    onPlayerPause(details) {
      this.log("pause", details);
    },
    onPlayerSeeked(details) {
      this.log("seeked", details);
    },
    onPlayerEnded(details) {
      this.log("ended", details);
    },
    onPlayerPlayback(details) {
      this.log("playback", details);
    },
    onPlayerChapterSeek(details) {
      this.log("chapter-seek", details);
    },
    onPlayerTimeUpdate({ currentTime, duration }) {
      this.currentTime = currentTime;
      this.duration = duration;
    },
    onPlayerReady({ duration }) {
      this.duration = duration;
    },
    log(key, values) {
      if (this.logger) {
        this.logger.add(key, values);
      }
    },
  },
};
</script>

<style>
.hypervideo {
  position: relative;
}

.player-container {
  width: 100%;
  height: auto;
}

.hypervideo-title {
  margin-bottom: 0;
}

.hypervideo-error {
  margin-top: 1rem;
}

.hypervideo-player {
  width: 100%;
  height: auto;
}

.variant-indicator {
  margin-top: 0.75rem;
  padding: 0.6rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.95rem;
  text-align: center;
}

.variant-2 {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #6ee7b7;
}
</style>