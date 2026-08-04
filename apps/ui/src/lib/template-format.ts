export type TemplateFieldValue =
  | {
      known: false;
    }
  | {
      known: true;
      value: unknown;
    };

export type TemplateFieldResolver = (fieldName: string) => TemplateFieldValue;

type TemplateExpression =
  | {
      fieldName: string;
      type: "field";
    }
  | {
      conditionFieldName: string;
      elseTemplate: string;
      thenTemplate: string;
      type: "ternary";
    };

const FIELD_NAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9]*$/;
const MAX_TEMPLATE_DEPTH = 8;

export const formatTemplateTextValue = (value: unknown) => {
  if (Array.isArray(value)) return value.filter(Boolean).join("; ");
  if (value === null || value === undefined) return "";

  return String(value);
};

export const isTemplateTruthy = (value: unknown) => {
  if (value === false || value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") return value.trim().length > 0;

  return true;
};

const findTemplateTokenEnd = (template: string, startIndex: number) => {
  let quote: "'" | '"' | null = null;
  let isEscaped = false;

  for (let index = startIndex + 1; index < template.length; index += 1) {
    const character = template[index];

    if (isEscaped) {
      isEscaped = false;
      continue;
    }

    if (quote) {
      if (character === "\\") {
        isEscaped = true;
        continue;
      }

      if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === "'" || character === '"') {
      quote = character;
      continue;
    }

    if (character === "}") return index;
  }

  return -1;
};

const findTopLevelCharacter = (value: string, target: "?" | ":", startIndex = 0) => {
  let quote: "'" | '"' | null = null;
  let isEscaped = false;

  for (let index = startIndex; index < value.length; index += 1) {
    const character = value[index];

    if (isEscaped) {
      isEscaped = false;
      continue;
    }

    if (quote) {
      if (character === "\\") {
        isEscaped = true;
        continue;
      }

      if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === "'" || character === '"') {
      quote = character;
      continue;
    }

    if (character === target) return index;
  }

  return -1;
};

const parseQuotedTemplate = (value: string) => {
  const trimmedValue = value.trim();
  const quote = trimmedValue[0];

  if (quote !== "'" && quote !== '"') return null;
  if (trimmedValue.at(-1) !== quote) return null;

  let result = "";
  let isEscaped = false;

  for (let index = 1; index < trimmedValue.length - 1; index += 1) {
    const character = trimmedValue[index];

    if (isEscaped) {
      result += character;
      isEscaped = false;
      continue;
    }

    if (character === "\\") {
      isEscaped = true;
      continue;
    }

    if (character === quote) return null;

    result += character;
  }

  if (isEscaped) return null;

  return result;
};

const parseTemplateExpression = (rawExpression: string): TemplateExpression | null => {
  const expression = rawExpression.trim();
  if (FIELD_NAME_PATTERN.test(expression)) {
    return { fieldName: expression, type: "field" };
  }

  const questionIndex = findTopLevelCharacter(expression, "?");
  if (questionIndex === -1) return null;

  const conditionFieldName = expression.slice(0, questionIndex).trim();
  if (!FIELD_NAME_PATTERN.test(conditionFieldName)) return null;

  const colonIndex = findTopLevelCharacter(expression, ":", questionIndex + 1);
  if (colonIndex === -1) return null;

  const thenTemplate = parseQuotedTemplate(expression.slice(questionIndex + 1, colonIndex));
  const elseTemplate = parseQuotedTemplate(expression.slice(colonIndex + 1));

  if (thenTemplate === null || elseTemplate === null) return null;

  return {
    conditionFieldName,
    elseTemplate,
    thenTemplate,
    type: "ternary",
  };
};

export const renderTemplateFormat = ({
  formatValue = formatTemplateTextValue,
  maxDepth = MAX_TEMPLATE_DEPTH,
  resolveField,
  template,
}: {
  formatValue?: (value: unknown) => string;
  maxDepth?: number;
  resolveField: TemplateFieldResolver;
  template: string;
}) => {
  const render = (templatePart: string, depth: number): string => {
    if (depth > maxDepth) return templatePart;

    let result = "";
    let cursor = 0;

    while (cursor < templatePart.length) {
      const openIndex = templatePart.indexOf("{", cursor);
      if (openIndex === -1) {
        result += templatePart.slice(cursor);
        break;
      }

      result += templatePart.slice(cursor, openIndex);

      const closeIndex = findTemplateTokenEnd(templatePart, openIndex);
      if (closeIndex === -1) {
        result += templatePart.slice(openIndex);
        break;
      }

      const rawToken = templatePart.slice(openIndex, closeIndex + 1);
      const expression = parseTemplateExpression(templatePart.slice(openIndex + 1, closeIndex));

      if (!expression) {
        result += rawToken;
        cursor = closeIndex + 1;
        continue;
      }

      if (expression.type === "field") {
        const resolvedField = resolveField(expression.fieldName);
        result += resolvedField.known ? formatValue(resolvedField.value) : rawToken;
        cursor = closeIndex + 1;
        continue;
      }

      const conditionValue = resolveField(expression.conditionFieldName);
      if (!conditionValue.known) {
        result += rawToken;
        cursor = closeIndex + 1;
        continue;
      }

      result += render(
        isTemplateTruthy(conditionValue.value) ? expression.thenTemplate : expression.elseTemplate,
        depth + 1,
      );
      cursor = closeIndex + 1;
    }

    return result;
  };

  return render(template, 0);
};

export const templateReferencesField = (template: string, fieldName: string) => {
  let cursor = 0;

  while (cursor < template.length) {
    const openIndex = template.indexOf("{", cursor);
    if (openIndex === -1) return false;

    const closeIndex = findTemplateTokenEnd(template, openIndex);
    if (closeIndex === -1) return template.slice(openIndex).includes(fieldName);

    const rawExpression = template.slice(openIndex + 1, closeIndex);
    const expression = parseTemplateExpression(rawExpression);

    if (!expression) {
      if (rawExpression.includes(fieldName)) return true;
      cursor = closeIndex + 1;
      continue;
    }

    if (expression.type === "field" && expression.fieldName === fieldName) return true;
    if (expression.type === "ternary") {
      if (expression.conditionFieldName === fieldName) return true;
      if (templateReferencesField(expression.thenTemplate, fieldName)) return true;
      if (templateReferencesField(expression.elseTemplate, fieldName)) return true;
    }

    cursor = closeIndex + 1;
  }

  return false;
};
