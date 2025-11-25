import express from "express";
import db from "../db.js";

const router = express.Router();

router.get("/conversations/:userId", async (req, res) => {
    const { userId } = req.params;
    
    console.log(`[BACKEND] Attempting to fetch conversations for UserID: ${userId}`);
    
    try {
        const query = `
SELECT
    c.ConversationID AS conversationId,
    c.UpdatedAt AS time,
    
    -- 1. Calculate the Partner ID directly
    IF(c.Participant1_ID = ?, c.Participant2_ID, c.Participant1_ID) AS partnerId,
    
    -- 2. Use COALESCE to get the name from Customers or Staffs
    COALESCE(
        cu.CustName, 
        st.StaffName
    ) AS name,

   ls.ShopImage_url AS partnerPicture,

    -- 3. Get the last message text or image
    (
        SELECT 
            CASE 
                WHEN m.MessageText IS NOT NULL AND m.MessageText != '' THEN m.MessageText
                WHEN m.MessageImage IS NOT NULL AND m.MessageImage != '' THEN '📷 Photo'
                ELSE ''
            END
        FROM Messages m
        WHERE m.ConversationID = c.ConversationID 
        ORDER BY m.CreatedAt DESC 
        LIMIT 1
    ) AS lastMessage,

    -- 4. Count unread messages
    (
        SELECT COUNT(*) 
        FROM Messages m 
        WHERE m.ConversationID = c.ConversationID 
            AND m.ReceiverID = ? 
            AND m.MessageStatus = 'Delivered'
    ) AS unreadCount

FROM Conversations c
-- 5. Calculate Partner ID for JOINs
JOIN (SELECT IF(c.Participant1_ID = ?, c.Participant2_ID, c.Participant1_ID) AS PartnerID, c.ConversationID FROM Conversations c) AS p ON p.ConversationID = c.ConversationID

-- 6. LEFT JOINs using the PartnerID
LEFT JOIN Customers cu ON cu.CustID = p.PartnerID
LEFT JOIN Cust_Credentials cc ON cc.CustID = p.PartnerID 
LEFT JOIN Staffs st ON st.StaffID = p.PartnerID
LEFT JOIN Shop_Owners so ON so.OwnerID = p.PartnerID
-- 🟢 NEW: Find the associated Laundry Shop
LEFT JOIN Laundry_Shops ls ON ls.OwnerID = p.PartnerID OR ls.OwnerID = st.ShopID

-- 7. Filter conversations involving the current user
WHERE c.Participant1_ID = ? OR c.Participant2_ID = ?
ORDER BY c.UpdatedAt DESC;
        `;
        
        const cleanBindings = [
            userId, // 1. Partner ID calc (IF condition)
            userId, // 2. unreadCount ReceiverID
            userId, // 3. Partner ID calc in Subquery 'p'
            userId, // 4. WHERE P1
            userId  // 5. WHERE P2
        ];

        const [conversations] = await db.query(query, cleanBindings);
        
        console.log(`[BACKEND] Found ${conversations.length} conversations for UserID: ${userId}`);
        if (conversations.length > 0) {
            console.log("[BACKEND] Sample conversation data:", conversations[0]);
        }

        res.json(conversations);
    } catch (error) {
        console.error("Error fetching conversations:", error);
        res.status(500).json({ error: "Failed to fetch conversations" });
    }
});

/**
 * Fetch message history for a conversation.
 */
router.get("/history/:conversationId", async (req, res) => {
  const { conversationId } = req.params;
  try {
    const query = `
      SELECT
        MessageID as id,
        ConversationID as conversationId,
        SenderID as senderId, 
        ReceiverID as receiverId, 
        MessageText as text, 
        MessageImage as image, 
        CreatedAt as time, 
        MessageStatus as status
      FROM Messages
      WHERE ConversationID = ?
      ORDER BY CreatedAt ASC;
    `;
    const [messages] = await db.query(query, [conversationId]);
    res.json(messages);
  } catch (error) {
    console.error("Error fetching message history:", error);
    res.status(500).json({ error: "Failed to fetch message history" });
  }
});

router.post("/", async (req, res) => {
  const { senderId, receiverId, text, image } = req.body;
  if (!senderId || !receiverId || (!text && !image)) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Standardize participant order (lowest ID first) to match Unique Constraint
    const participant1 = senderId < receiverId ? senderId : receiverId;
    const participant2 = senderId < receiverId ? receiverId : senderId;

    // Step 1: Find or Create the Conversation
    let [[conversation]] = await connection.query(
      "SELECT ConversationID FROM Conversations WHERE Participant1_ID = ? AND Participant2_ID = ?",
      [participant1, participant2]
    );

    let conversationId;
    if (conversation) {
      conversationId = conversation.ConversationID;
    } else {
      // 💡 FIX: Let MySQL handle the ID (AUTO_INCREMENT)
      const [result] = await connection.query(
        "INSERT INTO Conversations (Participant1_ID, Participant2_ID, UpdatedAt) VALUES (?, ?, NOW())",
        [participant1, participant2]
      );
      conversationId = result.insertId;
    }

    // Step 2: Insert the new message (MessageID is AUTO_INCREMENT)
    const [msgResult] = await connection.query(
      `INSERT INTO Messages 
        (ConversationID, SenderID, ReceiverID, MessageText, MessageImage, CreatedAt, MessageStatus) 
        VALUES (?, ?, ?, ?, ?, NOW(), 'Sent')`,
      [conversationId, senderId, receiverId, text || null, image || null]
    );
    const newMessageId = msgResult.insertId;

    // Step 3: Update the conversation's timestamp
    await connection.query(
      "UPDATE Conversations SET UpdatedAt = NOW() WHERE ConversationID = ?",
      [conversationId]
    );

    await connection.commit();

    // Step 4: Return the newly created message
    const [[newMessage]] = await db.query("SELECT * FROM Messages WHERE MessageID = ?", [newMessageId]);
    res.status(201).json(newMessage);

  } catch (error) {
    await connection.rollback();
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Failed to send message" });
  } finally {
    connection.release();
  }
});


/**
 * Mark messages in a conversation as read.
 */
router.patch("/read", async (req, res) => {
  const { conversationId, userId } = req.body; // userId is the person reading the messages
  if (!conversationId || !userId) {
    return res.status(400).json({ error: "Conversation ID and User ID are required" });
  }
  try {
    await db.query(
      "UPDATE Messages SET MessageStatus = 'Read' WHERE ConversationID = ? AND ReceiverID = ? AND MessageStatus = 'Delivered'",
      [conversationId, userId]
    );
    res.status(200).json({ success: true, message: "Messages marked as read" });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ error: "Failed to update message status" });
  }
});


export default router;