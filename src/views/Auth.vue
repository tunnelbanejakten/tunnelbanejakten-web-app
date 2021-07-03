<template>
  <Page title="Logga in">
    <h2>Logga in</h2>
    <p>{{ authStatus }}</p>
  </Page>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import Page from "@/components/layout/Page.vue";
import * as AuthUtils from "@/utils/Auth";
import * as Analytics from "@/utils/Analytics";

const apiHost = process.env.VUE_APP_API_HOST;

enum GetTokenStatus {
  NOT_STARTED,
  PENDING,
  SUCCESS,
  FAILURE,
}

@Component({
  components: {
    Page,
  },
})
export default class Auth extends Vue {
  private tokenStatus: GetTokenStatus = GetTokenStatus.NOT_STARTED;

  get authStatus(): string {
    switch (this.tokenStatus) {
      case GetTokenStatus.NOT_STARTED:
        return "NOT_STARTED";
      case GetTokenStatus.PENDING:
        return "Loggar in...";
      case GetTokenStatus.SUCCESS:
        return "Inloggningen gick bra.";
      case GetTokenStatus.FAILURE:
        return "Något gick fel.";
      default:
        return "UNKNOWN";
    }
  }

  get nextRoute(): string {
    return String(this.$route.query.newPath);
  }

  setToken(token: string | null) {
    if (token) {
      AuthUtils.setTokenCookie(token);
    } else {
      AuthUtils.unsetTokenCookie();
    }
  }

  async logIn(id: string) {
    try {
      this.tokenStatus = GetTokenStatus.PENDING;
      const resp = await fetch(`${apiHost}/wp-json/tuja/v1/tokens`, {
        method: "POST",
        body: JSON.stringify({ id }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (resp.ok) {
        const payload = await resp.json();
        this.setToken(payload.token);
        this.tokenStatus = GetTokenStatus.SUCCESS;

        const token = AuthUtils.getTokenCookie();
        if (token) {
          const profileResp = await fetch(
            `${apiHost}/wp-json/tuja/v1/profile?token=${token}`
          );
          if (profileResp.ok) {
            const profilePayload = await profileResp.json();
            Analytics.setUserProperties({
              group_key: profilePayload.key,
              group_name: profilePayload.name,
            });
          }
        }

        if (this.nextRoute) {
          await this.$router.push({ path: this.nextRoute });
        }
      } else {
        this.setToken(null);
        this.tokenStatus = GetTokenStatus.FAILURE;
      }
    } catch (e) {
      this.tokenStatus = GetTokenStatus.FAILURE;
    }
  }

  mounted() {
    if (this.$route.query.id) {
      this.logIn(String(this.$route.query.id));
    }
  }
}
</script>
