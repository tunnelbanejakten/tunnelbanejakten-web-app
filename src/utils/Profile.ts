import * as Analytics from '@/utils/Analytics'
import * as Api from '@/utils/Api'
import { Profile } from '@/store'

export const fetchProfile = async (): Promise<Profile> => {
    try {
        const apiHost = process.env.VUE_APP_API_HOST

        const profileResp = await Api.call({
            endpoint: `${apiHost}/wp-json/tuja/v1/profile`
        })

        const profilePayload = profileResp.payload
        const conf: Profile = {
            groupKey: profilePayload.key ?? '',
            authCode: profilePayload.auth_code ?? '',
            groupName: profilePayload.name,
            groupPortalLink: profilePayload.portal_link,
            groupAppLink: profilePayload.app_link,
            baseAppLink: profilePayload.app_base_link,
            categoryName: profilePayload.category_name,
            countCompeting: profilePayload.count_competing,
            countFollower: profilePayload.count_follower,
            countTeamContact: profilePayload.count_team_contact,
          }
        return conf
    } catch (e: any) {
        if (e instanceof Api.ApiError) {
            Analytics.logEvent(Analytics.AnalyticsEventType.APP, 'failed', 'user_profile', {
                message: 'Could not fetch user profile. Reason: Non-ok http response.',
                status: `Http response ${e.status}.`
            })
        } else {
            Analytics.logEvent(Analytics.AnalyticsEventType.APP, 'failed', 'user_profile', {
                message: `Could not fetch user profile. Reason: ${e.message}.`
            })
        }
        throw e
    }
}