<template>
  <div class="hypervideo" role="region" :aria-label="title || $t('aria_videoplayer')">
    <h3 v-if="title" class="hypervideo-title" :id="headingId">{{ title }}</h3>
    <div class="variant">
      <VideoPlayer
        ref="videoPlayer" 
        :url="url"
        :title="title"
        :heading-id="headingId"
        :logger="logger" />
    </div>
  </div>
</template>

<script>
import Logger from "./scripts/logger";
import Communication from "./scripts/communication";
import VideoPlayer from "./components/VideoPlayer.vue";

export default {
  // Register child components
  components: {
    VideoPlayer,
  },
  data() {
    return {
      logger: null,
      headingId: "hypervideo-title-" + Math.floor(Math.random() * 10000),
    }
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
    // this.headingId = ;
    this.logger = new Logger(
      this.$store.state.courseid,
      this.$store.state.hypervideoid,
      {
        context: "player1",
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
  },
};
</script>

<style scoped>

.hypervideo-title {
  margin-bottom: 1rem;
}

</style>
