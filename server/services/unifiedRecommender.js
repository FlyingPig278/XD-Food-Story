import { searchRecommendations } from "./recommendationService.js";
import { parseIntent } from "./intentParser.js";
import { requestStream } from "./llmService.js";

function buildHistoryMessages(history = []) {
  if (!Array.isArray(history) || history.length === 0) {
    return [];
  }

  return history.slice(-8).flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    const content = String(entry.text || entry.content || "").trim();
    if (!content) {
      return [];
    }

    const role =
      entry.role === "ai" || entry.role === "assistant" ? "assistant" : "user";

    return [{ role, content }];
  });
}

function formatIntentSummary(intent) {
  const constraints = [];

  if (Array.isArray(intent?.meal_times) && intent.meal_times.length) {
    constraints.push(`\u9910\u6bb5=${intent.meal_times.join("/")}`);
  }
  if (Array.isArray(intent?.categories) && intent.categories.length) {
    constraints.push(`\u54c1\u7c7b=${intent.categories.join("/")}`);
  }
  if (Array.isArray(intent?.spiciness) && intent.spiciness.length) {
    constraints.push(`\u8fa3\u5ea6=${intent.spiciness.join("/")}`);
  }
  if (
    Number.isFinite(intent?.price_min) ||
    Number.isFinite(intent?.price_max)
  ) {
    constraints.push(
      `\u9884\u7b97=${intent?.price_min ?? "-"}~${intent?.price_max ?? "-"}`,
    );
  }
  if (Array.isArray(intent?.location_texts) && intent.location_texts.length) {
    constraints.push(`\u4f4d\u7f6e=${intent.location_texts.join("/")}`);
  }

  return constraints.length ? constraints.join("\uff1b") : "\u65e0\u663e\u5f0f\u7ea6\u675f";
}

function isRecapQuery(query) {
  const normalized = String(query || "").trim();
  return /\u4e0a\u4e00\u53e5|\u4e0a\u53e5|\u521a\u624d\u8bf4|\u603b\u7ed3|\u56de\u987e|\u524d\u6587|\u4e4b\u524d\u804a|\u6211\u8bf4\u4e86\u4ec0\u4e48/.test(normalized);
}

export async function* unifiedRecommendStream(query, history = []) {
  // 1. Intent parsing
  const { intent } = await parseIntent(query, 5, history);
  const isFoodQuery = intent.intent_type === "food_search";
  const historyMessages = buildHistoryMessages(history);

  let items = [];
  if (isFoodQuery) {
    const { data: searchData } = await searchRecommendations(intent);
    items = searchData.items || [];

    if (items.length === 0) {
      yield {
        type: "text",
        text: "\u551f\uff0c\u8fd9\u4e2a\u9700\u6c42\u6709\u70b9\u96be\u5230\u6211\u4e86\uff0c\u6ca1\u627e\u5230\u5b8c\u5168\u5339\u914d\u7684\u83dc\u54c1\u5462\u3002\u8981\u4e0d\u6362\u4e2a\u8bf4\u6cd5\uff1f",
      };
      return;
    }
  }

  // 2. Stream LLM text reply FIRST (before sending cards)
  let hasTextOutput = false;
  try {
    const recapMode = isRecapQuery(query);
    const systemPrompt = recapMode
      ? '\u4f60\u662f\u6821\u56ed\u98df\u5802\u52a9\u624b"\u897f\u5c0f\u7535"\u3002\u8bf7\u4ec5\u4f9d\u636e\u5bf9\u8bdd\u5386\u53f2\u56de\u7b54\u7528\u6237\u7684\u56de\u987e\u95ee\u9898\uff0c\u4e0d\u8981\u7f16\u9020\u3002\u5982\u679c\u5386\u53f2\u4e0d\u8db3\u5c31\u76f4\u63a5\u8bf4\u4fe1\u606f\u4e0d\u8db3\u3002\u8bed\u6c14\u81ea\u7136\uff0c30~80\u5b57\u3002\n\u3010\u683c\u5f0f\u8981\u6c42\u3011\uff1a\u7981\u6b62\u4f7f\u7528\u4efb\u4f55 Markdown \u683c\u5f0f\uff08\u5982\u52a0\u7c97\u3001\u659c\u4f53\u3001\u5217\u8868\u7b49\uff09\uff0c\u8bf7\u76f4\u63a5\u8f93\u51fa\u7eaf\u6587\u672c\u3002'
      : isFoodQuery
        ? '\u4f60\u662f\u4e00\u4e2a\u65e2\u4e13\u4e1a\u53c8\u5e26\u70b9\u4fcf\u76ae\u611f\u7684\u6821\u56ed\u98df\u5802\u52a9\u624b"\u897f\u5c0f\u7535"\u3002\n' +
          "1. \u8bed\u6c14\uff1a\u50cf\u5b66\u957f\u5b66\u59d0\u4e00\u6837\u81ea\u7136\u3001\u4eb2\u5207\uff0c\u5e26\u70b9\u5e7d\u9ed8\u3002\n" +
          "2. \u9488\u5bf9\u6027\uff1a\u7ed3\u5408\u5f53\u524d\u95ee\u9898\u548c\u5386\u53f2\u9700\u6c42\uff0c\u4fdd\u6301\u7ea6\u675f\u7ee7\u627f\uff08\u5982\u9910\u6bb5\u3001\u9884\u7b97\u3001\u8fa3\u5ea6\uff09\uff0c\u518d\u7ed9\u7b80\u77ed\u63a8\u8350\u8bed\u3002\n" +
          "3. \u9650\u5236\uff1a\u4e0d\u8981\u5ba2\u5957\uff0c\u4e0d\u8981\u8c04\u5a9a\u3002\n" +
          "4. \u683c\u5f0f\uff1a\u7981\u6b62\u4f7f\u7528\u4efb\u4f55 Markdown \u683c\u5f0f\uff08\u5982\u52a0\u7c97\u3001\u659c\u4f53\u3001\u5217\u8868\u7b49\uff09\uff0c\u8bf7\u76f4\u63a5\u8f93\u51fa\u7eaf\u6587\u672c\u3002"
        : '\u4f60\u662f\u4e00\u4e2a\u65e2\u4e13\u4e1a\u53c8\u5e26\u70b9\u4fcf\u76ae\u611f\u7684\u6821\u56ed\u98df\u5802\u52a9\u624b"\u897f\u5c0f\u7535"\u3002\n' +
          "1. \u8eab\u4efd\uff1a\u4f60\u662f\u897f\u7535\uff08\u897f\u5b89\u7535\u5b50\u79d1\u6280\u5927\u5b66\uff09\u98df\u5802\u7684\u6d3b\u5730\u56fe\u3001\u7f8e\u98df\u8fbe\u4eba\u3002\n" +
          "2. \u8bed\u6c14\uff1a\u968f\u6027\u3001\u5e7d\u9ed8\u3001\u5e26\u70b9\u5b66\u957f\u5b66\u59d0\u7684\u8303\u513f\u3002\u82e5\u7528\u6237\u662f\u8ffd\u95ee\uff0c\u8bf7\u4f18\u5148\u627f\u63a5\u524d\u6587\u518d\u56de\u590d\u3002\n" +
          "3. \u5f15\u5bfc\uff1a\u5982\u679c\u8bdd\u9898\u5b8c\u5168\u65e0\u5173\uff0c\u53ef\u4ee5\u5de7\u5999\u5730\u5f15\u5bfc\u7528\u6237\u95ee\u4f60\u5173\u4e8e\u5403\u7684\u8bdd\u9898\uff0c\u4f46\u4e0d\u8981\u751f\u786c\u3002\n" +
          "4. \u9650\u5236\uff1a\u5b57\u6570\u63a7\u5236\u5728 30~50 \u5b57\u4ee5\u5185\u3002\n" +
          "5. \u683c\u5f0f\uff1a\u7981\u6b62\u4f7f\u7528\u4efb\u4f55 Markdown \u683c\u5f0f\uff08\u5982\u52a0\u7c97\u3001\u659c\u4f53\u3001\u5217\u8868\u7b49\uff09\uff0c\u8bf7\u76f4\u63a5\u8f93\u51fa\u7eaf\u6587\u672c\u3002";

    const messages = [
      { role: "system", content: systemPrompt },
      ...historyMessages,
      {
        role: "user",
        content: recapMode
          ? `\u5f53\u524d\u95ee\u9898\uff1a${query}`
          : `\u5f53\u524d\u95ee\u9898\uff1a${query}\n\u610f\u56fe\u7ea6\u675f\uff1a${formatIntentSummary(intent)}${
              isFoodQuery
                ? `\n\u5019\u9009\u83dc\u54c1\uff1a${items.map((entry) => entry.item.title).join("\u3001")}`
                : ""
            }`,
      },
    ];

    const greetingStream = requestStream({
      messages,
      temperature: 0.7,
      maxTokens: 600,
    });

    for await (const token of greetingStream) {
      hasTextOutput = true;
      yield { type: "text", text: token };
    }
  } catch (error) {
    console.error("[unifiedRecommend] Reply stream failed:", error.message);
  }

  // Fallback if LLM produced zero output
  if (!hasTextOutput && isFoodQuery) {
    yield {
      type: "text",
      text: "\u6839\u636e\u4f60\u7684\u53e3\u5473\uff0c\u897f\u5c0f\u7535\u5e2e\u4f60\u627e\u5230\u4e86\u8fd9\u4e9b\uff0c\u770b\u770b\u6709\u6ca1\u6709\u5fc3\u52a8\u7684\uff01",
    };
  }

  // 3. Send food cards LAST (after text)
  if (isFoodQuery && items.length > 0) {
    yield {
      type: "final",
      data: {
        items: items,
        reply_text: "",
      },
    };
  }
}
