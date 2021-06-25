<template>
  <div>
    <p>Så här gick det...</p>
    <p v-for="test in statuses" :key="test">
      {{ test.label }}: {{ test.status }}
    </p>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import store, { Status } from "@/store";

const LABELS: Record<string, string> = {
  connectivity: "Uppkoppling",
  camera: "Kamera",
  location: "Plats",
};

const STATUSES: Record<Status, string> = {
  [Status.PENDING]: "Inte klart",
  [Status.USER_INTERACTION_REQUIRED]: "Inte klart",
  [Status.FAILURE]: "Nepp",
  [Status.SUCCESS]: "Okej",
};

@Component({
  components: {},
})
export default class Summary extends Vue {
  private state = store.state.deviceTest;

  get statuses() {
    return Object.keys(this.state).map((key: string) => {
      return {
        label: LABELS[key],
        status: STATUSES[this.state[key].status],
      };
    });
  }
}
</script>
