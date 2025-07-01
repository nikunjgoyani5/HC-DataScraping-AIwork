import axios from "axios";
import Suppliments from "../models/product.model.js";
import Ingredients from "../models/ingredients.model.js";
import Drugs from "../models/drugs.model.js";
import DrugsDetails from "../models/drugs-details.model.js";
import IngredientDetails from "../models/ingredients-details.model.js";
import SupplementDetails from "../models/supplements-details.model.js";
import { apiResponse } from "../helper/api-response.helper.js";
import { StatusCodes } from "http-status-codes";

const NIH_API_URL = "https://api.ods.od.nih.gov/dsld/v9/browse-products/";
const PAGE_SIZE = 100;

const INGREDIENT_GROUP_API_URL =
  "https://api.ods.od.nih.gov/dsld/v9/ingredient-groups/";
const PAGE_SIZE_1 = 1000;

const fetchAndStoreAllProducts = async (req, res) => {
  try {
    let totalFetched = 0;
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    for (const letter of letters) {
      let from = 0;
      let letterFetched = 0;

      console.log(`\n🔤 Starting letter: ${letter}`);

      while (letterFetched < 580) {
        const url = `${NIH_API_URL}?method=by_letter&q=${letter}&size=${PAGE_SIZE}&from=${from}`;
        console.log(`🔄 Fetching from: ${url}`);

        const response = await axios.get(url);
        const products = response.data.hits || [];

        console.log(`📦 Products received in this batch: ${products.length}`);

        if (!products.length) {
          console.log(`⏹️ No more products for letter "${letter}"`);
          break;
        }

        for (const item of products) {
          if (letterFetched >= 580) break;

          const productData = item._source;
          const productId = item._id;

          if (!productData || !productId) continue;

          const existing = await Suppliments.findOne({ sourceId: productId });
          if (!existing) {
            await Suppliments.create({
              data: productData,
              sourceId: productId,
            });
            letterFetched++;
            totalFetched++;
          }
        }

        from += PAGE_SIZE;
        console.log(
          `✅ Fetched ${letterFetched} for "${letter}", Total: ${totalFetched}`
        );
      }
    }

    return apiResponse({
      res,
      status: true,
      statusCode: StatusCodes.OK,
      message: "Fetched up to 580 products per letter from A-Z.",
      data: { totalFetched },
    });
  } catch (error) {
    console.error("❌ Error syncing products:", error);
    return apiResponse({
      res,
      status: false,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: "Failed to fetch and store products.",
      data: null,
    });
  }
};

const fetchAllIngredientGroups = async (req, res) => {
  try {
    let totalFetched = 0;
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    for (const letter of letters) {
      let from = 0;
      let letterTotal = 0;

      console.log(`\n🔤 Starting ingredient group fetch for: ${letter}`);

      while (true) {
        const url = `${INGREDIENT_GROUP_API_URL}?method=by_letter&term=${letter}&size=${PAGE_SIZE}&from=${from}`;
        console.log(`🔄 Fetching from: ${url}`);

        const response = await axios.get(url);
        const groups = response.data.hits || [];

        console.log(
          `📦 Ingredient groups received in this batch: ${groups.length}`
        );

        if (!groups.length) {
          console.log(`⏹️ No more groups for letter "${letter}"`);
          break;
        }

        for (const item of groups) {
          const groupData = item._source;
          const groupId = item._id;

          if (!groupData || !groupId) continue;

          const existing = await Ingredients.findOne({ sourceId: groupId });

          if (!existing) {
            await Ingredients.create({
              data: groupData,
              sourceId: groupId,
            });
            totalFetched++;
            letterTotal++;
          }
        }

        from += PAGE_SIZE_1;
        console.log(
          `✅ Total for "${letter}": ${letterTotal}, Overall Total: ${totalFetched}`
        );
      }
    }

    return apiResponse({
      res,
      status: true,
      statusCode: StatusCodes.OK,
      message: "All ingredient groups fetched and stored from A-Z.",
      data: { totalFetched },
    });
  } catch (error) {
    console.error("❌ Error syncing ingredient groups:", error);
    return apiResponse({
      res,
      status: false,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: "Failed to fetch and store ingredient groups.",
      data: null,
    });
  }
};

const FACTSHEET_API_URL =
  "https://api.ods.od.nih.gov/dsld/v9/ingredient-groups/";

const fetchAndStoreFactsheets = async (req, res) => {
  try {
    const ingredients = await Ingredients.find({});
    let savedCount = 0;
    let skippedCount = 0;

    for (const ing of ingredients) {
      const groupName = ing?.data?.groupName;
      if (!groupName) continue;

      // ✅ Skip if already exists in DB
      const alreadyExists = await IngredientDetails.findOne({ groupName });
      if (alreadyExists) {
        console.log(`♻️ Skipping "${groupName}" — already saved`);
        skippedCount++;
        continue;
      }

      console.log(`\n🔍 Fetching for: "${groupName}"`);

      let from = 0;
      let totalHits = [];
      let retryCount = 0;
      const maxRetries = 5;

      while (true) {
        const url = `${FACTSHEET_API_URL}?term=${encodeURIComponent(
          groupName
        )}&size=${PAGE_SIZE}&from=${from}&method=factsheet`;
        console.log(`🌐 API Call: ${url}`);

        try {
          const response = await axios.get(url);
          const hits = response.data?.hits || [];

          if (hits.length === 0) break;

          totalHits.push(...hits);
          from += PAGE_SIZE;

          retryCount = 0; // reset retry counter on success
          await new Promise((r) => setTimeout(r, 300));
        } catch (err) {
          if (err.response?.status === 429 && retryCount < maxRetries) {
            retryCount++;
            const delay = Math.pow(2, retryCount) * 1000;
            console.warn(
              `⚠️ 429 Rate Limit. Retrying in ${
                delay / 1000
              }s (attempt ${retryCount})`
            );
            await new Promise((r) => setTimeout(r, delay));
            continue;
          } else {
            console.error(`❌ Error fetching for "${groupName}":`, err.message);
            break;
          }
        }
      }

      if (totalHits.length > 0) {
        await IngredientDetails.create({
          groupName,
          hits: totalHits,
        });
        console.log(
          `✅ Saved all ${totalHits.length} hits for: "${groupName}"`
        );
        savedCount++;
      } else {
        console.log(`⚠️ No hits found for "${groupName}"`);
      }
    }

    return res.status(200).json({
      success: true,
      message: `✔️ Done. Saved: ${savedCount}, Skipped: ${skippedCount}`,
    });
  } catch (error) {
    console.error("❌ Error while fetching/storing:", error);
    return res.status(500).json({
      success: false,
      message: "Error during fetch/store process.",
    });
  }
};

const fetchAndStoreSupplementLabels = async (req, res) => {
  try {
    const supplements = await Suppliments.find({});
    let savedCount = 0;
    let skippedCount = 0;

    for (const supp of supplements) {
      const sourceId = supp?.sourceId;
      if (!sourceId) continue;

      // ✅ Skip if already exists
      const alreadyExists = await SupplementDetails.findOne({ sourceId });
      if (alreadyExists) {
        console.log(`♻️ Skipping "${sourceId}" — already exists`);
        skippedCount++;
        continue;
      }

      const url = `https://api.ods.od.nih.gov/dsld/v9/label/${sourceId}`;
      console.log(`🌐 Fetching: ${url}`);

      try {
        const response = await axios.get(url);

        // Convert entire response object into flat key-value structure
        const rawData = response.data;
        const flattenedData = {};

        const flatten = (obj, prefix = "") => {
          for (let key in obj) {
            const value = obj[key];
            const newKey = prefix ? `${prefix}.${key}` : key;
            if (value && typeof value === "object" && !Array.isArray(value)) {
              flatten(value, newKey);
            } else {
              flattenedData[newKey] = value;
            }
          }
        };

        flatten(rawData);

        await SupplementDetails.create({
          sourceId,
          data: flattenedData,
        });

        console.log(`✅ Saved label for: ${sourceId}`);
        savedCount++;

        // Wait for 2 seconds before next call
        await new Promise((r) => setTimeout(r, 2000));
      } catch (err) {
        console.error(`❌ Error fetching ${sourceId}: ${err.message}`);
      }
    }

    return res.status(200).json({
      success: true,
      message: `✔️ Done. Saved: ${savedCount}, Skipped: ${skippedCount}`,
    });
  } catch (err) {
    console.error("❌ Fatal Error:", err);
    return res.status(500).json({
      success: false,
      message: "Error during supplement label fetch/store.",
    });
  }
};

const fetchAndStoreDailyMedDrugs = async (req, res) => {
  try {
    let nextUrl = "https://dailymed.nlm.nih.gov/dailymed/services/v2/spls.json";
    let totalSaved = 0;
    let currentPage = 1;

    while (nextUrl) {
      console.log(`📄 Fetching Page ${currentPage}: ${nextUrl}`);
      const response = await axios.get(nextUrl);
      const items = response.data.data || [];
      const metadata = response.data.metadata || {};

      if (!items.length) {
        console.log("⚠️ No items found on this page.");
        break;
      }

      // Prepare bulk operations to reduce MongoDB load
      const bulkOps = [];

      for (const item of items) {
        const { setid } = item;
        if (!setid) continue;

        // Check if already exists
        const alreadyExists = await Drugs.exists({ setid });
        if (!alreadyExists) {
          bulkOps.push({
            insertOne: {
              document: {
                setid,
                data: item,
              },
            },
          });
        }
      }

      if (bulkOps.length > 0) {
        const result = await Drugs.bulkWrite(bulkOps);
        totalSaved += result.insertedCount || 0;
        console.log(
          `✅ Inserted ${
            result.insertedCount || 0
          } new drugs on page ${currentPage}`
        );
      } else {
        console.log(`♻️ Skipped all existing records on page ${currentPage}`);
      }

      nextUrl = metadata.next_page_url || null;
      currentPage++;
    }

    return apiResponse({
      res,
      status: true,
      statusCode: StatusCodes.OK,
      message: "Fetched and stored all paginated DailyMed SPLs.",
      data: { totalSaved },
    });
  } catch (error) {
    console.error("❌ Error syncing DailyMed data:", error.message || error);
    return apiResponse({
      res,
      status: false,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: "Failed to fetch and store DailyMed SPLs.",
      data: null,
    });
  }
};

const fetchAndStoreDrugXML = async (req, res) => {
  try {
    const limit = 1000;
    let skip = 0;
    let totalProcessed = 0;
    let totalSkipped = 0;
    let hasMore = true;

    while (hasMore) {
      const url = `https://api.fda.gov/drug/label.json?limit=${limit}&skip=${skip}`;
      const response = await axios.get(url);

      const results = response.data.results || [];
      const total = response.data.meta.results.total;
      console.log(`🔄 Fetching records ${skip + 1} to ${skip + results.length} of ${total}`);

      for (let item of results) {
        const setId = item.set_id || item.id || item.openfda?.set_id;

        // Check required field exists
        if (!setId || !item.openfda || !item.openfda.substance_name) {
          totalSkipped++;
          continue;
        }

        // Check if already stored using 'setid'
        const exists = await DrugsDetails.findOne({ setid: setId });
        if (exists) {
          console.log(`⏭️ Already exists: ${setId}`);
          totalSkipped++;
          continue;
        }

        // Store the drug record if not exists
        await DrugsDetails.create({
          setid: setId,  // Use setid in the schema
          data: item,    // Store the full data for each drug
        });

        console.log(`✅ Stored: ${setId}`);
        totalProcessed++;
      }

      // Pagination logic
      skip += limit;
      hasMore = skip < response.data.meta.results.total && results.length > 0;
    }

    console.log("\n🎉 Completed OpenFDA sync operation.");
    console.log(`📊 Total Processed: ${totalProcessed}`);
    console.log(`⏭️ Total Skipped: ${totalSkipped}`);

    return res.status(StatusCodes.OK).json({
      status: true,
      message: "OpenFDA drug labels fetched and stored.",
      data: {
        totalProcessed,
        totalSkipped,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching OpenFDA data:", error.message || error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: false,
      message: "Failed to fetch and store OpenFDA drug label data.",
    });
  }
};

const fetchAndUpdateDrugClassification = async (req, res) => {
  try {
    const drugs = await DrugsDetails.find({});

    if (!drugs.length) {
      return res.status(404).json({
        status: false,
        message: "No drugs found in the database.",
      });
    }

    let totalProcessed = 0;
    let totalUpdated = 0;
    let totalFailed = 0;

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    for (let i = 0; i < drugs.length; i++) {
      const drug = drugs[i];

      // ✅ Skip if classification already exists
      if (drug.data?.openfda?.classification_name) {
        console.log(`⏭️ Already classified. Skipping drug with setid: ${drug.setid}`);
        continue;
      }

      const substanceName = drug.data.openfda?.substance_name?.[0];

      if (!substanceName) {
        console.log(`⏭️ No substance_name found for drug with setid: ${drug.setid}`);
        continue;
      }

      try {
        console.log(`🔍 Fetching RxNorm ID for substance: ${substanceName}`);

        const rxNormResponse = await axios.get(
          `https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(substanceName)}`
        );
        const rxNormId = rxNormResponse.data.idGroup?.rxnormId?.[0];

        if (!rxNormId) {
          console.log(`⏭️ No RxNorm ID found for substance: ${substanceName}`);
          totalFailed++;
          continue;
        }

        console.log(`🌐 RxNorm ID for ${substanceName}: ${rxNormId}`);

        const rxClassResponse = await axios.get(
          `https://rxnav.nlm.nih.gov/REST/rxclass/class/byRxcui.json?rxcui=${rxNormId}`
        );

        const classificationData = rxClassResponse.data;

        console.log(`✅ Classification found for ${substanceName}:`, classificationData);

        await DrugsDetails.updateOne(
          { setid: drug.setid },
          { $set: { "data.openfda.classification_name": classificationData } }
        );

        totalProcessed++;
        totalUpdated++;
      } catch (error) {
        console.error(`❌ Error processing drug with setid: ${drug.setid}`, error.message || error);
        totalFailed++;
      }

      // ✅ 2-second delay between each request
      await delay(2000);
    }

    console.log("\n🎉 Completed drug classification sync.");
    console.log(`📊 Total Processed: ${totalProcessed}`);
    console.log(`🔄 Total Updated: ${totalUpdated}`);
    console.log(`⏭️ Total Failed: ${totalFailed}`);

    return res.status(200).json({
      status: true,
      message: "Drug classification details fetched and updated.",
      data: {
        totalProcessed,
        totalUpdated,
        totalFailed,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching or updating drug classification data:", error.message || error);
    return res.status(500).json({
      status: false,
      message: "Failed to fetch and update drug classification details.",
    });
  }
};



export default {
  fetchAndStoreAllProducts,
  fetchAllIngredientGroups,
  fetchAndStoreFactsheets,
  fetchAndStoreSupplementLabels,
  fetchAndStoreDailyMedDrugs,
  fetchAndStoreDrugXML,
  fetchAndUpdateDrugClassification
};
