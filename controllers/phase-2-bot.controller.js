import { StatusCodes } from "http-status-codes";
import { apiResponse } from "../helper/api-response.helper.js";
import { getBotReplyFromGPT } from "../utils/gpt.utils.js";

const handleProductQuery = async (req, res) => {
  try {
    const userMessage = (req.body?.message || "").trim();

    // 🛑 Validate User Message
    if (!userMessage) {
      return apiResponse({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        message:
          "🛑 'message' field is required and must be a non-empty string.",
      });
    }

    // 🤖 Get GPT-Powered Response
    const botReply = await getBotReplyFromGPT(userMessage);

    // ⚠️ Check if bot reply is valid
    if (
      !botReply ||
      typeof botReply.text !== "string" ||
      !botReply.text.trim()
    ) {
      return apiResponse({
        res,
        statusCode: StatusCodes.SERVICE_UNAVAILABLE,
        message: "⚠️ The bot was unable to generate a valid response.",
      });
    }

    // ✅ Successful Response
    return apiResponse({
      res,
      statusCode: StatusCodes.OK,
      message: "✅ Bot reply generated successfully.",
      data: {
        query: userMessage,
        reply: botReply.text,
      },
    });
  } catch (error) {
    console.error("❌ [handleProductQuery] GPT Error:", {
      message: error.message,
      stack: error.stack,
      requestBody: req.body,
    });
    return apiResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: "An internal error occurred while generating the bot reply.",
      error,
    });
  }
};

export default {
  handleProductQuery,
};
