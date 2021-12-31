<template>
  <div>
    <table>
      <tbody>
        <tr>
          <td>Lagnamn:</td>
          <td>{{ groupName }}</td>
        </tr>
        <tr>
          <td>Tävlingsklass:</td>
          <td>{{ categoryName }}</td>
        </tr>
        <tr>
          <td>Antal tävlande:</td>
          <td>{{ countCompeting }} st</td>
        </tr>
        <tr v-if="countFollower">
          <td>Vuxna som följer med:</td>
          <td>{{ countFollower }} st</td>
        </tr>
      </tbody>
    </table>
    <p>
      Administrera er anmälan i
      <a
        :href="groupPortalLink"
        target="_blank"
        class="group-portal-link"
      >Lagportalen</a>
      <font-awesome-icon
        icon="external-link-alt"
        size="xs"
      />.
    </p>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component({
  components: {
  }
})
export default class Profile extends Vue {
  @Prop({ default: '' }) private readonly groupName!: string
  @Prop({ default: '' }) private readonly categoryName!: string
  @Prop({ default: '' }) private readonly countCompeting!: string
  @Prop({ default: '' }) private readonly countFollower!: string
  @Prop({ default: '' }) private readonly groupPortalLink!: string
}
</script>

<style scoped>
a.group-portal-link {
  padding-right: 0.3em;
}
table {
  border-collapse: collapse;
}
table td {
  padding: 0.3em 0;
}
table td:first-child {
  padding-right: 1em;
}
</style>