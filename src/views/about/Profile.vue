<template>
  <div>
    <h2>Ditt lag</h2>
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
      Ni kan ändra er anmälan i
      <span class="group-portal-link">
        <a
          :href="groupPortalLink"
          target="_blank"
        >Lagportalen</a>
        <font-awesome-icon
          icon="external-link-alt"
          size="xs"
        />
      </span>.
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
span.group-portal-link {
  white-space: nowrap;
}
span.group-portal-link a {
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