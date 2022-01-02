<template>
  <div>
    <p>Så här gick det:</p>
    <p
      v-for="test in statuses"
      :key="test.key"
    >
      <Message
        :message="test.message"
        :header="test.header"
        :headerIcon="test.headerIcon"
        :type="test.messageType"
      />
    </p>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import store, { Status } from '@/store'
import Message, { Type as MessageType } from '@/components/common/Message.vue'

const LABELS: Record<string, string> = {
  connectivity: 'Uppkoppling',
  camera: 'Kamera',
  location: 'Plats'
}

const HEADER_ICONS: Record<string, string> = {
  connectivity: 'wifi',
  camera: 'camera',
  location: 'map-marker-alt'
}

const STATUSES: Record<Status, string> = {
  [Status.PENDING]: 'Testet gjordes inte klart',
  [Status.USER_INTERACTION_REQUIRED]: 'Testet gjordes inte klart',
  [Status.FAILURE]: 'Testet misslyckades',
  [Status.SUCCESS]: 'Testet gick bra'
}

const MESSAGE_TYPES: Record<Status, MessageType> = {
  [Status.PENDING]: MessageType.INFO,
  [Status.USER_INTERACTION_REQUIRED]: MessageType.INFO,
  [Status.FAILURE]: MessageType.FAILURE,
  [Status.SUCCESS]: MessageType.SUCCESS
}

@Component({
  components: { Message }
})
export default class Summary extends Vue {
  private state = store.state.deviceTest;

  get statuses() {
    return Object.keys(this.state).map((key: string) => {
      return {
        key,
        header: LABELS[key],
        headerIcon: HEADER_ICONS[key],
        message: STATUSES[this.state[key].status],
        messageType: MESSAGE_TYPES[this.state[key].status]
      }
    })
  }
}
</script>
