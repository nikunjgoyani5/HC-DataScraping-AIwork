import SupplementDetails from "../models/supplements-details.model.js";
import DrugsDetails from "../models/drugs-details.model.js";
import IngredientDetails from "../models/ingredients-details.model.js";

const getAllSupplementDetails = async (req, res) => {
  try {
    const q = req.query.q?.trim();
    const limit = parseInt(req.query.limit) || 10;

    if (!q) {
      return res.status(400).json({ message: "No search query provided." });
    }

    const cleanedQuery = q
      .replace(
        /supplement|capsule|tablet|syrup|powder|mein|kaunse|ingredients|warning|hai|kya/gi,
        ""
      )
      .replace(/[^a-zA-Z0-9\s&]/g, "")
      .trim();

    if (!cleanedQuery) {
      return res.status(400).json({ message: "No valid search keywords." });
    }

    const keywords = cleanedQuery.split(" ").join("|");
    const regex = new RegExp(keywords, "i");

    const searchQuery = {
      $or: [
        { "data.fullName": { $regex: regex } },
        { "data.brandName": { $regex: regex } },
        { "data.ingredientRows.name": { $regex: regex } },
        { "data.statements.notes": { $regex: regex } },
        { "data.claims.langualCodeDescription": { $regex: regex } },
        { "data.productType.langualCodeDescription": { $regex: regex } },
        { "data.netContents.display": { $regex: regex } },
        { "data.contactDetails.name": { $regex: regex } },
      ],
    };

    if (req.query.productType) {
      searchQuery["data.productType.langualCodeDescription"] = {
        $regex: req.query.productType,
        $options: "i",
      };
    }

    if (req.query.ageGroup) {
      searchQuery["data.targetGroups"] = { $in: [req.query.ageGroup] };
    }

    if (req.query.minQuantity && req.query.maxQuantity) {
      searchQuery["data.netContents.quantity"] = {
        $gte: parseInt(req.query.minQuantity),
        $lte: parseInt(req.query.maxQuantity),
      };
    }

    const items = await SupplementDetails.find(searchQuery).limit(limit);

    res.json({ data: { items } });
  } catch (err) {
    console.error("❌ Supplement Search Error:", err.message);
    res.status(500).json({ message: "Internal error" });
  }
};

const getAllDrugsDetails = async (req, res) => {
  try {
    const q = req.query.q?.trim();
    const limit = parseInt(req.query.limit) || 10;

    if (!q) {
      return res.status(400).json({ message: "No valid search query." });
    }

    const keywords = q
      .replace(
        /drug|cream|gel|tablet|capsule|ointment|mein|kya|hai|use|ingredients|purpose|warning|disease|prevent/gi,
        ""
      )
      .replace(/[^a-zA-Z0-9\s&]/g, "")
      .trim();

    if (!keywords) {
      return res
        .status(400)
        .json({ message: "No valid keywords after sanitization." });
    }

    const regex = new RegExp(keywords.split(" ").join("|"), "i");

    const searchQuery = {
      $or: [
        { "openfda.brand_name": { $regex: regex } },
        { "openfda.generic_name": { $regex: regex } },
        { substance_name: { $elemMatch: { $regex: regex } } },
        { active_ingredient: { $elemMatch: { $regex: regex } } },
        { purpose: { $elemMatch: { $regex: regex } } },
        { indications_and_usage: { $elemMatch: { $regex: regex } } },
        { warnings: { $elemMatch: { $regex: regex } } },
        { boxed_warning: { $elemMatch: { $regex: regex } } },
        {
          rxclassDrugInfoList: {
            $elemMatch: {
              "rxclassMinConceptItem.className": { $regex: regex },
            },
          },
        },
        {
          "classification_name.rxclassDrugInfoList": {
            $elemMatch: {
              "rxclassMinConceptItem.className": { $regex: regex },
            },
          },
        },
        { "data.spl_product_data_elements": { $elemMatch: { $regex: regex } } },
      ],
    };
    const items = await DrugsDetails.find(searchQuery).limit(limit);

    res.json({ data: items });
  } catch (err) {
    console.error("❌ Drug Search Error:", err.message);
    res.status(500).json({ message: "Internal error while searching drugs" });
  }
};

const getAllIngredientDetails = async (req, res) => {
  try {
    const q = req.query.q?.trim();
    const limit = parseInt(req.query.limit) || 10;

    const keywords = q
      ?.replace(/ingredient|compound|molecule|kya|hai|mein/gi, "")
      ?.replace(/[^a-zA-Z0-9\s&]/g, "")
      ?.trim();

    if (!keywords) {
      return res.status(400).json({ message: "No valid search query." });
    }

    const regex = new RegExp(keywords.split(" ").join("|"), "i");

    const items = await IngredientDetails.find({
      $or: [
        { groupName: { $regex: regex } },
        { synonyms: { $regex: regex } },
        { category: { $regex: regex } },
      ],
    }).limit(limit);

    res.json({ data: { items } });
  } catch (err) {
    console.error("❌ Ingredient Search Error:", err.message);
    res.status(500).json({ message: "Internal error" });
  }
};

export default {
  getAllSupplementDetails,
  getAllDrugsDetails,
  getAllIngredientDetails,
};
