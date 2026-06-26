<template>
  <div
    class="hypervideo"
    role="region"
    :aria-label="title || $t('aria_videoplayer')"
  >
    <h3 v-if="title" class="hypervideo-title" :id="headingId">{{ title }}</h3>
    <div class="row mt-3">
      <div v-if="chapters.length" class="col-md-3">
        <ChapterList
          :chapters="chapters"
          :current-time="currentTime"
          :duration="duration"
          @seek="seekTo"
        />
      </div>
      <div :class="chapters.length ? 'col-md-9' : 'col-12'">
        <div class="player-container">
          <div
            v-if="videoError"
            class="hypervideo-error alert alert-danger"
            role="alert"
            aria-live="assertive"
          >
            {{ $t("player_error") }}
          </div>
          <div
            v-if="!videoError && !videoReady"
            class="hypervideo-loading"
            aria-live="polite"
          >
            <span role="status">{{ $t("player_loading") }}</span>
          </div>
          <video
            v-show="!videoError"
            ref="videoEl"
            :src="url"
            controls
            preload="metadata"
            class="hypervideo-player"
            :aria-label="title || $t('aria_videoplayer')"
            :aria-describedby="headingId"
            @play="onPlay"
            @pause="onPause"
            @loadeddata="onCanPlay"
            @timeupdate="onTimeUpdate"
            @seeked="onSeeked"
            @seeking="onSeeking"
            @ended="onEnded"
            @error="onError"
          >
            <p>{{ $t("aria_videonotsupported") }}</p>
          </video>
        </div>
        <div class="variant-indicator variant-3">
          You are looking at variant 3
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Logger from "./scripts/logger";
import Communication from "./scripts/communication";
import ChapterList from "./components/ChapterList.vue";

export default {
  components: {
    ChapterList,
  },
  data() {
    return {
      video: null,
      seekStart: 0,
      videoid: 0,
      videoprogress: 0,
      duration: 0,
      interval: 2,
      lastposition: -1,
      timer: null,
      logger: null,
      videoError: false,
      videoReady: false,
      headingId: "",
      currentTime: 0,
      isSeeking: false,
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
    this.videoid = "videoid" + Math.floor(Math.random() * 1000);
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
  beforeUnmount() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
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
        this.videoprogress = parseInt(parsed.videoprogress * this.interval, 10);
      }
    },
    onCanPlay() {
      this.video = this.$refs.videoEl;
      this.video.setAttribute("id", this.videoid);
      this.videoReady = true;
    },
    onTimeUpdate() {
      if (this.video) {
        if (!this.isSeeking) {
          this.seekStart = this.video.currentTime;
        }
        this.currentTime = this.video.currentTime;
      }
    },
    loop() {
      if (!this.video) {
        return;
      }
      const curr = this.video.currentTime || 0;
      const currentinterval = curr > 0 ? Math.round(curr / this.interval) : 0;
      if (currentinterval !== this.lastposition) {
        this.log("playback", {
          context: "player",
          action: "playback",
          values: currentinterval,
          currenttime: this.video.currentTime,
          duration: this.video.duration,
        });
        this.videoprogress += this.interval;
        this.lastposition = currentinterval;
      }
    },
    onPlay() {
      this.video = this.$refs.videoEl;
      this.log("play", {
        context: "player",
        action: "play",
        values: "",
        currenttime: this.video.currentTime,
        duration: this.video.duration,
      });
      if (this.timer) {
        clearInterval(this.timer);
      }
      this.timer = setInterval(this.loop, this.interval * 1000);
      setTimeout(this.loop, 100);
    },
    onPause() {
      if (!this.video) {
        return;
      }
      this.log("pause", {
        context: "player",
        action: "pause",
        values: "",
        currenttime: this.video.currentTime,
        duration: this.video.duration,
      });
      clearInterval(this.timer);
      this.timer = null;
      this.loop();
    },
    onSeeking() {
      this.isSeeking = true;
    },
    seekTo(time) {
      if (this.video) {
        this.video.currentTime = time;
        this.currentTime = time;
        this.log("chapter-seek", {
          context: "player",
          action: "chapter-seek",
          values: time,
          currenttime: time,
          duration: this.video.duration,
        });
      }
    },
    onError() {
      this.videoError = true;
    },
    onSeeked() {
      if (!this.video) {
        return;
      }
      const from = this.seekStart;
      const to = this.video.currentTime;
      const distance = to - from;
      const direction = distance >= 0 ? "forward" : "backward";
      this.log("seeked", {
        context: "player",
        action: "seeked",
        values: JSON.stringify({
          from: from,
          to: to,
          distance: distance,
          direction: direction,
        }),
        currenttime: this.video.currentTime,
        duration: this.video.duration,
      });
      this.seekStart = this.video.currentTime;
      this.isSeeking = false;
    },
    onEnded() {
      if (!this.video) {
        return;
      }
      this.log("ended", {
        context: "player",
        action: "ended",
        values: "",
        currenttime: this.video.currentTime,
        duration: this.video.duration,
      });
      clearInterval(this.timer);
      this.timer = null;
      this.loop();
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

.variant-3 {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fcd34d;
}
</style>