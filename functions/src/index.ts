import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
admin.initializeApp();
const db = admin.firestore();

export const artifacts = functions.https.onRequest(async (req, res) => {
  const itemId = req.query.item_id;

  if (!itemId) {
    res.status(403).send("Item Id Required");
    return;
  }

  const snapshot = await db.collection("artifacts").doc(itemId as string).get();
  if (!snapshot.exists) {
    res.status(404).send(`Item Not Found ${itemId}`);
    return;
  }

  res.status(200).json(snapshot.data());
  return;
});
