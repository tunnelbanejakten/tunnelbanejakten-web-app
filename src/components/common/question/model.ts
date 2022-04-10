/* eslint-disable camelcase */

export type QuestionResponseDto = {
    field_name: string;
    current_value: any;
}

export type TimeLimitDto = {
    current_time: number
    duration: number
    duration_error_margin: number
    ends_at: number
    started_at: number
}

export type QuestionDto = {
    id: number;
    type: string;
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
    config: any;
    time_limit?: TimeLimitDto
}

export type QuestionGroupDto = {
    description: string;
    id: number;
    is_marker_set: boolean;
    name: string;
    questions: QuestionDto[];
}

export type FormDto = {
    id: number
    is_read_only: boolean
    name: string
    question_groups: QuestionGroupDto[]
}

export type ExtendedQuestionGroupDto = QuestionGroupDto & {
    isReadOnly: boolean
}

export type FormUpdateField = {
    key: string
    value: string
}

export type FormUpdate = {
    updatedFields: FormUpdateField[]
}