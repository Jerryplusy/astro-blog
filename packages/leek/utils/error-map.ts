import { AstroError } from 'astro/errors'

type Issue = { message: string }

type ParseSuccess<T> = {
  success: true
  data: T
}

type ParseFailure = {
  success: false
  error: {
    issues: Issue[]
  }
}

type ParseResult<T> = ParseSuccess<T> | ParseFailure

type FriendlySchema<TInput, TOutput> = {
  safeParse(input: TInput): ParseResult<TOutput>
  safeParseAsync(input: TInput): Promise<ParseResult<TOutput>>
}

/**
 * Parse data with a schema and throw a nicely formatted error if it is invalid.
 */
export function parseWithFriendlyErrors<TInput, TOutput>(
  schema: FriendlySchema<TInput, TOutput>,
  input: TInput,
  message: string
): TOutput {
  return processParsedData(schema.safeParse(input), message)
}

/**
 * Asynchronously parse data with a schema and throw a nicely formatted error if it is invalid.
 */
export async function parseAsyncWithFriendlyErrors<TInput, TOutput>(
  schema: FriendlySchema<TInput, TOutput>,
  input: TInput,
  message: string
): Promise<TOutput> {
  return processParsedData(await schema.safeParseAsync(input), message)
}

function processParsedData<T>(parsedData: ParseResult<T>, message: string): T {
  if (!parsedData.success) {
    throw new AstroError(message, parsedData.error.issues.map((issue) => issue.message).join('\n'))
  }
  return parsedData.data
}
