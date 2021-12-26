<template>
  <div :class="cssClasses">
    <div class="event-log">
      <div
        v-for="event in events"
        :key="event.timestamp"
        class="event"
      >
        <div :class="'event-header event-level-' + event.level">
          <span class="event-type">{{ event.type }}</span>
          {{ ' ' }}
          <span class="event-name">{{ event.eventVerb }} {{ event.eventObject }}</span>
        </div>
        <div class="event-details">
          <pre>{{ event.props }}</pre>
        </div>
      </div>
    </div>
    <div class="button">
      <IconButton
        @click="onToggleExpanded"
        icon="debug"
        type="secondary"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
import IconButton from "@/components/common/IconButton.vue";
import store from "@/store";
import { AnalyticsEventType, AppEvent, LogLevel } from "@/utils/Analytics";
const LOG_LEVEL_MAPPING = {
  [LogLevel.INFO]: "info",
  [LogLevel.DEBUG]: "debug",
  [LogLevel.WARNING]: "warning",
  [LogLevel.ERROR]: "error"
};
@Component({
  components: {
    IconButton
  }
})
export default class DebugPopup extends Vue {
  private isExpanded = false;

  get events() {
    return store.getEvents().map((event: AppEvent) => ({
      ...event,
      props: JSON.stringify(event.props, null, 2),
      type: AnalyticsEventType[event.type].toLowerCase(),
      level: LogLevel[event.level].toLowerCase()
    }));
  }

  get cssClasses() {
    return "debug-window " + (this.isExpanded ? "expanded" : "collapsed");
  }

  onToggleExpanded() {
    this.isExpanded = !this.isExpanded;
  }
}
</script>

<style scoped>
.debug-window {
  position: fixed;
  z-index: 1002;
  bottom: 20px;
  right: 20px;
  /* top: 20px; */
  /* left: 20px; */
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.debug-window div.event-log {
  flex: 1;
  display: none;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 5px;
  border: 1px solid #bbb;
  padding: 0;
  overflow: auto;
  margin-bottom: 20px;
  box-sizing: border-box;
}
.debug-window div.button {
  flex: 0;
}
.debug-window.expanded div.event-log {
  display: block;
  width: 100%;
}
.debug-window.expanded {
  top: 20px;
  left: 20px;
}
.event {
  border-top: 1px solid #bbb;
  padding: 5px;
}
.event:first-child {
  border-top: none;
}
.event-header {
  font-family: monospace;
  font-size: 12px;
  border-width: 0 0 0 3px;
  border-style: solid;
  padding: 0 0 0 5px;
}
.event-level-debug {
  border-color: rgb(230, 230, 230);
}
.event-level-info {
  border-color: rgb(139, 209, 255);
}
.event-level-warning {
  border-color: rgb(255, 205, 139);
}
.event-level-error {
  border-color: rgb(255, 156, 139);
}
.event-header .event-type {
  font-weight: bold;
}
pre {
  font-size: 10px;
  margin: 0;
  padding: 0;
}
</style>