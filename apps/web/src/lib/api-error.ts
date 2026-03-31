import axios from "axios";

export type ParsedApiError = {
  message: string;
  fieldErrors: Record<string, string>;
};

function toErrorMessage(value: unknown): string | null {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    const joined = value
      .filter((item): item is string => typeof item === "string")
      .join(" ");
    return joined || null;
  }

  return null;
}

export function parseApiError(
  error: unknown,
  fallbackMessage = "Something went wrong. Please try again."
): ParsedApiError {
  if (!axios.isAxiosError(error)) {
    return { message: fallbackMessage, fieldErrors: {} };
  }

  const data = error.response?.data;

  if (!data || typeof data !== "object") {
    return { message: fallbackMessage, fieldErrors: {} };
  }

  const payload = data as Record<string, unknown>;
  const fieldErrors: Record<string, string> = {};

  Object.entries(payload).forEach(([key, value]) => {
    const parsed = toErrorMessage(value);
    if (parsed) {
      fieldErrors[key] = parsed;
    }
  });

  const detail = toErrorMessage(payload.detail);
  const nonField = toErrorMessage(payload.non_field_errors);
  const firstFieldError = Object.values(fieldErrors)[0];

  return {
    message: detail || nonField || firstFieldError || fallbackMessage,
    fieldErrors,
  };
}
