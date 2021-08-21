/* eslint-disable camelcase */
export type QuestionDto = {
    type: string;
    is_read_only: boolean;
    response: {
        field_name: string;
        current_value: any;
    },
    optimistic_lock: {
        field_name: string;
        current_value: string;
    },
    tracked_answers: {
        field_name: string;
        current_value: string;
    },
    view_event: {
        is_required: boolean;
        is_found: boolean;
    },
    limit_time_max: number;
    limit_time_remaining?: number;
    config: any;
}
