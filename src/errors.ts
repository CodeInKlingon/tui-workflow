import { Data } from "effect"

export class WorkflowExit extends Data.TaggedError("WorkflowExit")<{
    readonly reason?: string
}> {}

export class DialogCancelled extends Data.TaggedError("DialogCancelled")<{
    readonly title?: string
}> {}

export class VariableRequired extends Data.TaggedError("VariableRequired")<{
    readonly name: string
}> {}

export class VariableAlreadyDefined extends Data.TaggedError("VariableAlreadyDefined")<{
    readonly name: string
}> {}