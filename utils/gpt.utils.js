import axios from "axios";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const API_ENDPOINTS = {
  supplements: "http://137.184.7.16:6464/api/data/get-all-supplements",
  ingredients: "http://137.184.7.16:6464/api/data/get-all-ingredients",
  drugs: "http://137.184.7.16:6464/api/data/get-all-drugs",
};

export const getBotReplyFromGPT = async (userMessage) => {
  try {
    if (!userMessage || typeof userMessage !== "string") {
      throw new Error("Invalid user query.");
    }

    console.log("📨 User Query:", userMessage);

    const quickReplies = ["hi", "hello", "hey", "help"];
    if (quickReplies.includes(userMessage.toLowerCase().trim())) {
      return {
        text: "👋 Hello! How can I help you with supplements or medications?",
      };
    }

    const keyword = await extractSearchKeywordWithGPT(userMessage);
    console.log("🔍 Extracted Keyword:", keyword);

    const { supplements, ingredients, drugs } = await fetchHealthData(keyword);

    const messages = buildFinalPrompt(
      userMessage,
      supplements,
      ingredients,
      drugs
    );

    const englishReply = await callGPT(messages, "gpt-4-turbo");

    return {
      text: englishReply || "⚠️ GPT returned no reply.",
    };
  } catch (error) {
    console.error("❌ GPT Bot Handler Error:", error);
    return {
      text: "Something went wrong while generating the reply.",
    };
  }
};

/**
 * ✅ 1️⃣ Extract the best keyword
 */
const extractSearchKeywordWithGPT = async (userMessage) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are a smart assistant. Extract the exact product, supplement, drug, or ingredient name from the user query. Return only the name.",
        },
        { role: "user", content: userMessage },
      ],
      temperature: 0,
      max_tokens: 30,
    });
    return response.choices?.[0]?.message?.content?.trim() || userMessage;
  } catch {
    return userMessage;
  }
};

/**
 * ✅ 2️⃣ Expand synonyms
 */
const expandSynonymsWithGPT = async (keyword) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "Given a drug/supplement/ingredient name, return 3–5 possible synonyms or related terms. Only comma-separated.",
        },
        { role: "user", content: keyword },
      ],
      temperature: 0,
      max_tokens: 50,
    });
    return (
      response.choices?.[0]?.message?.content
        .split(",")
        .map((w) => w.trim())
        .filter(Boolean) || [keyword]
    );
  } catch {
    return [keyword];
  }
};

/**
 * ✅ 3️⃣ Fetch Health Data
 */
const fetchHealthData = async (query) => {
  const synonyms = await expandSynonymsWithGPT(query);
  const regex = synonyms.join("|");

  const safeFetch = async (url) => {
    try {
      const { data } = await axios.get(url, {
        params: { q: regex, limit: 5 },
      });
      return data?.data?.items || [];
    } catch {
      return [];
    }
  };
  return {
    supplements: await safeFetch(API_ENDPOINTS.supplements),
    ingredients: await safeFetch(API_ENDPOINTS.ingredients),
    drugs: await safeFetch(API_ENDPOINTS.drugs),
  };
};

/**
 * ✅ 4️⃣ Format Supplements
 */
const formatSupplementItemsForGPT = (items) => {
  if (!items.length)
    return "--- Supplements ---\nNo matching supplements found.";
  return (
    "--- Supplements ---\n" +
    items
      .map((item) => {
        const d = item.data || {};
        const brand = d.brandName || "Brand Not Specified";
        const versionCode = d.productVersionCode || "Version Not Specified";

        const ingredients = (d.ingredientRows || [])
          .map((i) => {
            const quantity = i.quantity?.[0]?.quantity || "N/A";
            const unit = i.quantity?.[0]?.unit || "";
            const dailyValue =
              (i.dailyValueTargetGroup?.[0]?.percent || "N/A") + "%";
            return `${i.name || "Unknown Ingredient"} (${
              i.notes?.trim() || ""
            }) — Quantity: ${quantity}${unit}, Daily Value: ${dailyValue}`;
          })
          .join("\n");

        const warnings =
          (d.statements || [])
            .filter(
              (st) => st.type && st.type.toLowerCase().includes("precaution")
            )
            .map((st) => {
              const note = st.notes?.trim() || "";
              return note ? `- ${note}` : "";
            })
            .filter(Boolean)
            .join("\n") || "Not available";

        return `🧴 ${d.fullName || "Unnamed Supplement"}
• Brand: ${brand}
• Product Version Code: ${versionCode}
• Ingredients:\n${ingredients}
• Warnings & Precautions:\n${warnings}`;
      })
      .join("\n\n")
  );
};

/**
 * ✅ 5️⃣ Format Ingredients
 */
const formatIngredientItemsForGPT = (items) => {
  if (!items.length)
    return "--- Ingredients ---\nNo matching ingredients found.";
  return (
    "--- Ingredients ---\n" +
    items
      .map((item) => {
        const name = item.groupName || "Unnamed Ingredient";
        const synonyms = item.synonyms?.join(", ") || "No synonyms listed";
        const classification =
          item.classification?.join(", ") || "No classification listed";

        return `🧪 ${name}
• Synonyms: ${synonyms}
• Classification: ${classification}`;
      })
      .join("\n\n")
  );
};

/**
 * ✅ 6️⃣ Format Drugs
 */
const extractRiskTag = (warnings = []) => {
  const joined = warnings?.join(" ").toLowerCase();
  if (joined.includes("pregnancy") || joined.includes("nursing")) {
    return "⚠️ This drug may not be safe during pregnancy or breastfeeding.";
  }
  return "";
};

const formatDrugItemsForGPT = (items) => {
  if (!items.length) {
    return "--- Drugs ---\nNo matching drugs found.";
  }

  return (
    "--- Drugs ---\n" +
    items
      .map((item) => {
        const d = item.data || {};
        const brand = d.openfda?.brand_name?.[0] || "Unknown Brand";
        const generic = d.openfda?.generic_name?.[0] || "Unknown Generic";
        const activeIngredient = Array.isArray(d.active_ingredient)
          ? d.active_ingredient.join(", ")
          : d.active_ingredient || "N/A";
        const usage = Array.isArray(d.indications_and_usage)
          ? d.indications_and_usage[0]?.trim()
          : d.indications_and_usage?.trim() || "N/A";
        const purpose = Array.isArray(d.purpose)
          ? d.purpose[0]?.trim()
          : d.purpose?.trim() || "N/A";
        const warnings = Array.isArray(d.warnings)
          ? d.warnings.join("\n").trim()
          : d.warnings?.trim() || "N/A";

        const contraindications = Array.isArray(d.contraindications)
          ? d.contraindications.join("\n").trim()
          : d.contraindications?.trim() || "N/A";

        const precautions = Array.isArray(d.precautions)
          ? d.precautions.join("\n").trim()
          : d.precautions?.trim() || "N/A";

        const adverseReactions = Array.isArray(d.adverse_reactions)
          ? d.adverse_reactions.join("\n").trim()
          : d.adverse_reactions?.trim() || "N/A";

        const pregnancyInfo = Array.isArray(d.pregnancy)
          ? d.pregnancy.join("\n").trim()
          : d.pregnancy?.trim() || "N/A";

        const nursingMothersInfo = Array.isArray(d.nursing_mothers)
          ? d.nursing_mothers.join("\n").trim()
          : d.nursing_mothers?.trim() || "N/A";

        return `💊 ${brand} (${generic})
• Active Ingredients: ${activeIngredient}
• Purpose: ${purpose}
• Usage: ${usage}
• Warnings: ${warnings}
• Contraindications: ${contraindications}
• Precautions: ${precautions}
• Adverse Reactions: ${adverseReactions}
• Pregnancy Info: ${pregnancyInfo}
• Nursing Mothers Info: ${nursingMothersInfo}`;
      })
      .join("\n\n")
  );
};

/**
 * ✅ 7️⃣ Final GPT Prompt
 */
const buildFinalPrompt = (userMessage, supplements, ingredients, drugs) => {
  return [
    {
      role: "system",
      content:
        "You are a professional AI health assistant. Use only the structured data below. Do NOT guess or hallucinate. Be safe, helpful, precise, and data-accurate.",
    },
    {
      role: "user",
      content: `User Query: "${userMessage}"\n\n${formatSupplementItemsForGPT(
        supplements
      )}\n\n${formatIngredientItemsForGPT(
        ingredients
      )}\n\n${formatDrugItemsForGPT(drugs)}\n\nGive the best possible reply.`,
    },
  ];
};

/**
 * ✅ 8️⃣ Final GPT Call
 */
const callGPT = async (messages, model = "gpt-4-turbo") => {
  const response = await openai.chat.completions.create({
    model,
    messages,
    temperature: 0,
    max_tokens: 2000,
  });
  return response.choices?.[0]?.message?.content?.trim();
};

export default {
  formatDrugItemsForGPT,
};
