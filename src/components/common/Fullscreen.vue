<template>
    <div class="fullscreen">
        <div class="background"></div>
        <div class="content">
            <slot name="default" />
        </div>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component({
  components: {
  }
})
export default class Fullscreen extends Vue {
}
</script>

<style scoped>
.fullscreen {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
}

.background {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;

    background-color: rgba(255, 255, 255, 0.5);
}
.content {
    position: absolute;
    top: 20px;
    left: 20px;
    bottom: 20px;
    right: 20px;

    /* Theme from tunnelbanejakten.se: */
    background-color: #fff;
    border: 1px solid #738489;
    /* border-radius: 20px; */

    box-shadow: 0px 0 20px 0px rgb(0 0 0 / 75%);
    -webkit-box-shadow: 0px 0 20px 0px rgb(0 0 0 / 75%);
    -moz-box-shadow: 0px 0 20px 0px rgb(0 0 0 / 75%);
}
</style>