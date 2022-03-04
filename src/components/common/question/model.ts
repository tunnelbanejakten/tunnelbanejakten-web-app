/* eslint-disable camelcase */

export type QuestionResponseDto = {
    field_name: string;
    current_value: any;
}

export type QuestionDto = {
    id: number;
    type: string;
    is_read_only: boolean;
    response: QuestionResponseDto,
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

export type QuestionGroupDto = {
    description: string;
    id: number;
    is_marker_set: boolean;
    name: string;
    questions: QuestionDto[];
}


export type FormUpdateField = {
    key: string
    value: string
}

export type FormUpdate = {
    updatedFields: FormUpdateField[]
}