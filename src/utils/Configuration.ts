import * as Analytics from '@/utils/Analytics'
import * as Api from '@/utils/Api'
import { Configuration, QuestionGrouping } from '@/store'

const questionGroupingMapper: Record<string, QuestionGrouping> = {
    by_group: QuestionGrouping.BY_QUESTION_GROUP,
    by_question: QuestionGrouping.BY_QUESTION
  }
  
  export const fetchConfiguration = async (): Promise<Configuration> => {
    try {
        const apiHost = process.env.VUE_APP_API_HOST

        const confResp = await Api.call({
            endpoint: `${apiHost}/wp-json/tuja/v1/configuration`
        })

        const confPayload = await confResp.payload
        const conf: Configuration = {
            positioning: {
                showUnavailableStations: confPayload.app.positioning.show_unavailable_stations,
                highAccuracyThreshold: confPayload.app.positioning.high_accuracy_threshold,
                highAccuracyTimeout: confPayload.app.positioning.high_accuracy_timeout,
                stalePositionTimeout: confPayload.app.positioning.stale_position_timeout
            },
            uploads: {
                maxFileSize: confPayload.app.uploads.max_file_size
            },
            updates: {
                configPollInterval: confPayload.app.updates.config_poll_interval
            },
            messages: {
                infoPageContent: confPayload.app.messages.info_page_content
            },
            views: {
                answer: confPayload.app.views.answer,
                map: confPayload.app.views.map,
                tickets: confPayload.app.views.tickets,
                deviceTest: confPayload.app.views.device_test,
                info: confPayload.app.views.info
            },
            answer: {
                questionGrouping: questionGroupingMapper[confPayload.app.answer.question_grouping] ?? QuestionGrouping.NONE
            }
        }
        return conf
    } catch (e: any) {
        if (e instanceof Api.ApiError) {
            Analytics.logEvent(Analytics.AnalyticsEventType.FORM, 'failed', 'app_configuration', {
                message: 'Could not fetch app configuration. Reason: Non-ok http response.',
                status: `Http response ${e.status}.`
            })
        } else {
            Analytics.logEvent(Analytics.AnalyticsEventType.FORM, 'failed', 'app_configuration', {
                message: `Could not fetch app configuration. Reason: ${e.message}.`
            })
        }
        throw e
    }
}