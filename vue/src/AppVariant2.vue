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
      <div class="player-container">
        <VideoPlayer
          ref="videoPlayer"
          :url="url"
          :title="title"
          :heading-id="headingId"
          :chapters="chapters"
          :current-chapter-title="currentChapterTitle"
          fullscreen-sidebar-position="left"
          @play="onPlayerPlay"
          @pause="onPlayerPause"
          @seeked="onPlayerSeeked"
          @ended="onPlayerEnded"
          @playback="onPlayerPlayback"
          @timeline-seek="onPlayerTimelineSeek"
          @button-seek="onPlayerButtonSeek"
          @timeupdate="onPlayerTimeUpdate"
          @ready="onPlayerReady"
          @survey-response="onSurveyResponse"
          @speed-change="onPlayerSpeedChange"
          @fullscreen-change="onPlayerFullscreenChange"
          @volume-change="onPlayerVolumeChange"
          @mute-change="onPlayerMuteChange"
        >
          <template #fullscreen-sidebar>
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
    onPlayerTimelineSeek(details) {
      this.log("timeline-seek", details);
    },
    onPlayerButtonSeek(details) {
      this.log("button-seek", details);
    },
    onPlayerTimeUpdate({ currentTime, duration }) {
      this.currentTime = currentTime;
      this.duration = duration;
    },
    onPlayerReady({ duration }) {
      this.duration = duration;
    },
    onSurveyResponse(rating) {
      this.log('survey_response', {
        context: 'media_hypervideo',
        action: 'survey_response',
        values: rating,
        currenttime: 0,
        duration: 0,
      });
    },
    onPlayerSpeedChange(details) {
      this.log('speed-change', details);
    },
    onPlayerFullscreenChange(details) {
      this.log('fullscreen-change', details);
    },
    onPlayerVolumeChange(details) {
      this.log('volume-change', details);
    },
    onPlayerMuteChange(details) {
      this.log('mute-change', details);
    },
    log(key, values) {
      if (this.logger) {
        this.logger.add(key, values);
      }
    },
  },
};
</script>

<style scoped>


.variant {
  display: flex;
  gap: 1rem;
}

.chapters-sidebar {
  flex: 0 0 300px;
}

.hypervideo-title {
  margin-bottom: 1rem;
}

</style>